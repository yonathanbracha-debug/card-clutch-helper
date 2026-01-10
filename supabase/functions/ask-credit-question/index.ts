/**
 * Ask Credit Question Edge Function
 * AI-powered credit question answering with OpenAI embeddings + Pinecone RAG
 * Rate limited, audit logged, quota-safe
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OpenAI config
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_CHAT_MODEL = "gpt-4o-mini";

// Rate limits
const RATE_LIMITS = {
  unauth: { maxPerMinute: 20 },
  auth: { maxPerMinute: 60 },
};

// Validation constants
const MIN_QUESTION_LENGTH = 5;
const MAX_QUESTION_LENGTH = 800;
const MAX_CARDS = 20;
const PINECONE_TOP_K = 6;
const MIN_RELEVANCE_SCORE = 0.65;

interface AskQuestionRequest {
  question: string;
  include_citations?: boolean;
  user_context?: {
    cards?: string[];
    preferences?: Record<string, unknown>;
  };
}

interface PineconeMatch {
  id: string;
  score: number;
  metadata?: {
    source_id?: string;
    source_url?: string;
    source_title?: string;
    category?: string;
    trust_tier?: number;
    status?: string;
    chunk_text?: string;
    chunk_index?: number;
  };
}

interface Citation {
  title: string;
  url: string;
  category: string;
  relevance: number;
}

// Intent classification keywords
const CARD_REWARD_KEYWORDS = [
  "best card", "which card", "recommend", "points", "cashback", "miles",
  "rewards", "earning rate", "multiplier", "category bonus", "rotating",
];

const CREDIT_EDUCATION_KEYWORDS = [
  "credit score", "utilization", "payment", "interest", "apr", "dispute",
  "report", "fico", "vantage", "hard pull", "soft pull", "inquiry",
  "statement", "balance", "minimum payment", "grace period",
];

// ============= Utility Functions =============

async function hashIP(ip: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP.trim();
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP.trim();
  return "unknown";
}

function sanitizeText(text: string): string {
  return text.replace(/[\x00-\x1F\x7F]/g, "").trim();
}

// ============= Rate Limiting =============

async function checkRateLimit(
  supabase: any,
  bucket: string,
  scope: string,
  maxCount: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const { data, error } = await supabase
    .from("rate_limits")
    .select("id, count, blocked_until")
    .eq("bucket", bucket)
    .eq("scope", scope)
    .gte("window_start", windowStart)
    .order("window_start", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Rate limit check error:", error);
    return { allowed: true };
  }

  const row = data?.[0] as { id: string; count: number; blocked_until: string | null } | undefined;

  if (row?.blocked_until) {
    const blockedUntil = new Date(row.blocked_until);
    if (blockedUntil > new Date()) {
      const retryAfterSeconds = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000);
      return { allowed: false, retryAfterSeconds };
    }
  }

  const currentCount = row?.count || 0;
  if (currentCount >= maxCount) {
    return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  return { allowed: true };
}

async function incrementRateLimit(
  supabase: any,
  bucket: string,
  scope: string
): Promise<void> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60000).toISOString();

  const { data } = await supabase
    .from("rate_limits")
    .select("id, count")
    .eq("bucket", bucket)
    .eq("scope", scope)
    .gte("window_start", windowStart)
    .order("window_start", { ascending: false })
    .limit(1);

  const rows = data as Array<{ id: string; count: number }> | null;

  if (rows && rows.length > 0) {
    await supabase
      .from("rate_limits")
      .update({ count: rows[0].count + 1, updated_at: now.toISOString() })
      .eq("id", rows[0].id);
  } else {
    await supabase.from("rate_limits").insert({
      bucket,
      scope,
      window_start: now.toISOString(),
      count: 1,
      updated_at: now.toISOString(),
    });
  }
}

// ============= Intent Classification =============

function classifyIntent(question: string): string {
  const lowerQ = question.toLowerCase();
  
  if (CARD_REWARD_KEYWORDS.some(kw => lowerQ.includes(kw))) {
    return "card_rewards";
  }
  if (CREDIT_EDUCATION_KEYWORDS.some(kw => lowerQ.includes(kw))) {
    return "credit_education";
  }
  if (lowerQ.includes("issuer") || lowerQ.includes("chase") || lowerQ.includes("amex") || lowerQ.includes("citi")) {
    return "issuer_policy";
  }
  return "general";
}

// ============= OpenAI Functions =============

interface OpenAIError {
  type: string;
  code: string;
  message: string;
}

function parseOpenAIError(status: number, body: string): { httpCode: number; message: string } {
  try {
    const parsed = JSON.parse(body);
    const error = parsed.error as OpenAIError | undefined;
    
    if (status === 429 || error?.code === "rate_limit_exceeded") {
      return { httpCode: 503, message: "AI service is temporarily busy. Please try again in a moment." };
    }
    if (status === 402 || error?.code === "insufficient_quota") {
      return { httpCode: 402, message: "AI service quota exceeded. Please try again later." };
    }
    if (error?.message) {
      return { httpCode: 500, message: `AI error: ${error.message}` };
    }
  } catch {
    // Ignore parse errors
  }
  return { httpCode: 500, message: "AI service unavailable. Please try again." };
}

async function getEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const { httpCode, message } = parseOpenAIError(response.status, errorText);
    const err = new Error(message);
    (err as any).httpCode = httpCode;
    throw err;
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function generateAnswer(
  question: string,
  context: string,
  intent: string,
  openaiKey: string
): Promise<string> {
  const systemPrompt = `You are CardClutch's credit expert assistant. You provide accurate, helpful information about credit cards, credit scores, and personal finance.

CONTEXT FROM TRUSTED SOURCES:
${context || "No relevant context available."}

RULES:
1. ONLY use information from the provided context. If the context doesn't contain relevant information, say "I don't have enough information to answer that accurately" and ask ONE clarifying question.
2. NEVER hallucinate or make up specific numbers, rates, or product details.
3. Be conservative and safe with financial advice. Use phrases like "generally" and "typically".
4. Do NOT provide legal, tax, or investment advice.
5. Keep answers concise but complete (2-4 paragraphs max).
6. For card-specific questions without context, recommend checking issuer websites.
7. Cite your sources when possible using the source titles from context.

INTENT: ${intent}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.3,
      max_completion_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const { httpCode, message } = parseOpenAIError(response.status, errorText);
    const err = new Error(message);
    (err as any).httpCode = httpCode;
    throw err;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate an answer.";
}

// ============= Pinecone Functions =============

async function queryPinecone(
  embedding: number[],
  pineconeHost: string,
  pineconeKey: string
): Promise<PineconeMatch[]> {
  const response = await fetch(`${pineconeHost}/query`, {
    method: "POST",
    headers: {
      "Api-Key": pineconeKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vector: embedding,
      topK: PINECONE_TOP_K,
      includeMetadata: true,
      filter: {
        trust_tier: { "$lte": 3 },
        status: { "$eq": "active" },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinecone query error:", response.status, errorText);
    // Don't throw - return empty and proceed without RAG
    return [];
  }

  const data = await response.json();
  return data.matches || [];
}

function buildContextFromMatches(matches: PineconeMatch[]): { context: string; citations: Citation[] } {
  const relevantMatches = matches.filter(m => m.score >= MIN_RELEVANCE_SCORE);
  
  if (relevantMatches.length === 0) {
    return { context: "", citations: [] };
  }

  const contextParts: string[] = [];
  const citations: Citation[] = [];
  const seenUrls = new Set<string>();

  for (const match of relevantMatches) {
    const meta = match.metadata;
    if (!meta?.chunk_text) continue;

    contextParts.push(`[Source: ${meta.source_title || "Unknown"}]\n${meta.chunk_text}`);

    // Add citation if not already added
    const url = meta.source_url || "";
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      citations.push({
        title: meta.source_title || "Unknown Source",
        url,
        category: meta.category || "general",
        relevance: match.score,
      });
    }
  }

  return {
    context: contextParts.join("\n\n---\n\n"),
    citations,
  };
}

// ============= Request Validation =============

function validateRequest(body: unknown): { valid: true; data: AskQuestionRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Question validation
  if (!req.question || typeof req.question !== "string") {
    return { valid: false, error: "Question is required" };
  }

  const question = sanitizeText(req.question);
  if (question.length < MIN_QUESTION_LENGTH) {
    return { valid: false, error: `Question must be at least ${MIN_QUESTION_LENGTH} characters` };
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return { valid: false, error: `Question must be less than ${MAX_QUESTION_LENGTH} characters` };
  }

  // include_citations validation
  const includeCitations = req.include_citations === true;

  // user_context validation
  let userContext: AskQuestionRequest["user_context"] = undefined;
  if (req.user_context && typeof req.user_context === "object") {
    const ctx = req.user_context as Record<string, unknown>;
    userContext = {};

    if (Array.isArray(ctx.cards)) {
      const cards = ctx.cards.filter((c): c is string => 
        typeof c === "string" && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)
      ).slice(0, MAX_CARDS);
      if (cards.length > 0) {
        userContext.cards = cards;
      }
    }

    if (ctx.preferences && typeof ctx.preferences === "object") {
      userContext.preferences = ctx.preferences as Record<string, unknown>;
    }
  }

  return {
    valid: true,
    data: {
      question,
      include_citations: includeCitations,
      user_context: userContext,
    },
  };
}

// ============= Main Handler =============

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const startTime = Date.now();

  // Helper to create error responses
  const errorResponse = (status: number, message: string, retryAfter?: number) => {
    const headers: Record<string, string> = { ...corsHeaders, "Content-Type": "application/json" };
    if (retryAfter) headers["Retry-After"] = String(retryAfter);
    return new Response(JSON.stringify({ error: message }), { status, headers });
  };

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const pineconeKey = Deno.env.get("PINECONE_API_KEY");
    const pineconeHost = Deno.env.get("PINECONE_HOST");
    const rateLimitSalt = Deno.env.get("RATE_LIMIT_SALT") || "default-salt";

    if (!openaiKey) {
      console.error("Missing OPENAI_API_KEY");
      return errorResponse(500, "Service configuration error");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header (optional)
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (e) {
        console.error("Auth error:", e);
      }
    }

    // Get and hash client IP
    const clientIP = getClientIP(req);
    const ipHash = await hashIP(clientIP, rateLimitSalt);

    // Rate limiting
    const rateLimit = userId ? RATE_LIMITS.auth : RATE_LIMITS.unauth;
    const bucket = userId ? `user:${userId}` : `ip:${ipHash}`;
    
    const limitCheck = await checkRateLimit(
      supabase,
      bucket,
      "ask_credit_question",
      rateLimit.maxPerMinute,
      60000
    );

    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "rate_limited",
          message: "Too many questions. Please wait a moment and try again.",
          retry_after_seconds: limitCheck.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(limitCheck.retryAfterSeconds),
          },
        }
      );
    }

    // Parse and validate request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse(400, "Invalid JSON body");
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
      return errorResponse(400, validation.error);
    }

    const { question, include_citations } = validation.data;

    // Classify intent
    const intent = classifyIntent(question);

    // Generate embedding for the question
    let embedding: number[] | null = null;
    let context = "";
    let citations: Citation[] = [];

    try {
      embedding = await getEmbedding(question, openaiKey);
    } catch (e) {
      const err = e as Error & { httpCode?: number };
      // If embedding fails due to quota, return appropriate error
      if (err.httpCode === 402 || err.httpCode === 503) {
        return errorResponse(err.httpCode, err.message, err.httpCode === 503 ? 30 : undefined);
      }
      // For other errors, continue without RAG
      console.error("Embedding error (continuing without RAG):", err.message);
    }

    // Query Pinecone if we have embedding and config
    if (embedding && pineconeHost && pineconeKey) {
      try {
        const matches = await queryPinecone(embedding, pineconeHost, pineconeKey);
        const result = buildContextFromMatches(matches);
        context = result.context;
        citations = result.citations;
      } catch (e) {
        console.error("Pinecone error (continuing without RAG):", e);
      }
    }

    // Generate answer
    let answer: string;
    try {
      answer = await generateAnswer(question, context, intent, openaiKey);
    } catch (e) {
      const err = e as Error & { httpCode?: number };
      if (err.httpCode) {
        return errorResponse(err.httpCode, err.message, err.httpCode === 503 ? 30 : undefined);
      }
      return errorResponse(500, "Failed to generate answer. Please try again.");
    }

    // Calculate confidence based on RAG quality
    let confidence = 0.5; // Base confidence without RAG
    if (context) {
      // Higher confidence with RAG context
      const avgRelevance = citations.length > 0 
        ? citations.reduce((sum, c) => sum + c.relevance, 0) / citations.length
        : 0;
      confidence = Math.min(0.95, 0.6 + avgRelevance * 0.35);
    }
    if (intent === "credit_education" && context) {
      confidence = Math.min(0.95, confidence + 0.1);
    }

    // Increment rate limit
    await incrementRateLimit(supabase, bucket, "ask_credit_question");

    const latencyMs = Date.now() - startTime;

    // Log query for audit
    try {
      await supabase.from("rag_queries").insert({
        user_id: userId,
        ip_hash: ipHash,
        question,
        intent,
        retrieved_chunks: citations.map(c => ({
          title: c.title,
          url: c.url,
          relevance: c.relevance,
        })),
        answer,
        confidence,
        model: OPENAI_CHAT_MODEL,
        latency_ms: latencyMs,
        include_citations: include_citations || false,
      });
    } catch (logError) {
      console.error("Failed to log query:", logError);
    }

    // Build response
    const response: Record<string, unknown> = {
      answer,
      confidence,
      intent,
      latency_ms: latencyMs,
    };

    // Include citations if requested and available
    if (include_citations && citations.length > 0) {
      response.citations = citations;
    }

    // Suggest follow-up questions
    const followups: string[] = [];
    if (intent === "credit_education") {
      followups.push(
        "How can I improve my credit score?",
        "What's the ideal credit utilization ratio?"
      );
    } else if (intent === "card_rewards") {
      followups.push(
        "Which card is best for dining?",
        "How do I maximize travel rewards?"
      );
    }
    if (followups.length > 0) {
      response.followups = followups;
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Ask question error:", error);
    
    // Determine appropriate error code
    const err = error as Error & { httpCode?: number };
    const httpCode = err.httpCode || 500;
    const message = err.message || "An unexpected error occurred. Please try again.";

    // Log error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from("rag_queries").insert({
        question: "ERROR",
        answer: message,
        confidence: 0,
        error: message,
        latency_ms: Date.now() - startTime,
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: httpCode, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
