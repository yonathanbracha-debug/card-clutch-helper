/**
 * Ask Credit Question Edge Function
 * RAG-powered credit question answering with rate limiting and audit logging
 * Uses Pinecone for vector search and OpenAI for embeddings + completion
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limits
const RATE_LIMITS = {
  unauth: { maxPerMinute: 20 },
  auth: { maxPerMinute: 60 },
};

// Validation constants
const MIN_QUESTION_LENGTH = 5;
const MAX_QUESTION_LENGTH = 800;
const MAX_CARDS = 20;

interface AskQuestionRequest {
  question: string;
  include_citations?: boolean;
  user_context?: {
    cards?: string[];
    preferences?: Record<string, unknown>;
  };
}

interface ChunkResult {
  id: string;
  score: number;
  metadata: {
    chunk_text: string;
    source_url: string;
    source_title: string;
    category: string;
    trust_tier: number;
  };
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

async function getEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function queryPinecone(
  embedding: number[],
  pineconeHost: string,
  pineconeKey: string,
  topK: number = 6
): Promise<ChunkResult[]> {
  const response = await fetch(`${pineconeHost}/query`, {
    method: "POST",
    headers: {
      "Api-Key": pineconeKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vector: embedding,
      topK,
      includeMetadata: true,
      filter: {
        trust_tier: { "$lte": 3 },
        status: { "$eq": "active" },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinecone query error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.matches || [];
}

async function generateAnswer(
  question: string,
  context: string,
  citations: ChunkResult[],
  openaiKey: string,
  includeCitations: boolean
): Promise<{ answer: string; confidence: number }> {
  const systemPrompt = `You are CardClutch's credit expert assistant. You provide accurate, helpful information about credit cards, credit scores, and personal finance.

RULES:
1. NEVER hallucinate or make up information. If you don't know, say so.
2. Be conservative and safe with financial advice. Use phrases like "generally" and "typically".
3. Do NOT provide legal, tax, or investment advice. Suggest consulting professionals.
4. If the context doesn't contain enough information, acknowledge uncertainty.
5. Keep answers concise but complete (2-4 paragraphs max).
6. If you need clarification, ask 1-2 specific follow-up questions.

CONTEXT FROM KNOWLEDGE BASE:
${context}

${includeCitations ? "Include source citations in your answer when referencing specific information." : ""}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI completion error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const answer = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate an answer.";
  
  // Calculate confidence based on context quality
  const avgScore = citations.length > 0
    ? citations.reduce((sum, c) => sum + c.score, 0) / citations.length
    : 0.3;
  const confidence = Math.min(0.95, Math.max(0.3, avgScore));

  return { answer, confidence };
}

function validateRequest(body: unknown): { valid: true; data: AskQuestionRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Question validation
  if (!req.question || typeof req.question !== "string") {
    return { valid: false, error: "Question is required" };
  }

  const question = req.question.trim();
  if (question.length < MIN_QUESTION_LENGTH) {
    return { valid: false, error: `Question must be at least ${MIN_QUESTION_LENGTH} characters` };
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return { valid: false, error: `Question must be less than ${MAX_QUESTION_LENGTH} characters` };
  }

  // Sanitize: remove control characters
  const sanitizedQuestion = question.replace(/[\x00-\x1F\x7F]/g, "");

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
      question: sanitizedQuestion,
      include_citations: includeCitations,
      user_context: userContext,
    },
  };
}

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

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const pineconeKey = Deno.env.get("PINECONE_API_KEY");
    const pineconeHost = Deno.env.get("PINECONE_HOST");
    const rateLimitSalt = Deno.env.get("RATE_LIMIT_SALT") || "default-salt";

    if (!openaiKey || !pineconeKey || !pineconeHost) {
      console.error("Missing required API keys");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { question, include_citations, user_context } = validation.data;

    // Classify intent
    const intent = classifyIntent(question);

    // Get embedding for question
    const embedding = await getEmbedding(question, openaiKey);

    // Query Pinecone for relevant chunks
    const chunks = await queryPinecone(embedding, pineconeHost, pineconeKey, 6);

    // Build context from retrieved chunks
    const context = chunks
      .map((c, i) => `[${i + 1}] ${c.metadata.chunk_text}\n(Source: ${c.metadata.source_title})`)
      .join("\n\n");

    // Generate answer
    const { answer, confidence } = await generateAnswer(
      question,
      context || "No specific information found in knowledge base.",
      chunks,
      openaiKey,
      include_citations || false
    );

    // Increment rate limit
    await incrementRateLimit(supabase, bucket, "ask_credit_question");

    const latencyMs = Date.now() - startTime;

    // Log query for audit
    await supabase.from("rag_queries").insert({
      user_id: userId,
      ip_hash: ipHash,
      question,
      intent,
      retrieved_chunks: chunks.map(c => ({
        id: c.id,
        score: c.score,
        source_url: c.metadata.source_url,
        source_title: c.metadata.source_title,
      })),
      answer,
      confidence,
      model: "gpt-4o-mini",
      latency_ms: latencyMs,
      include_citations: include_citations || false,
    });

    // Build response
    const response: Record<string, unknown> = {
      answer,
      confidence,
      intent,
      latency_ms: latencyMs,
    };

    if (include_citations) {
      response.citations = chunks.map(c => ({
        title: c.metadata.source_title,
        url: c.metadata.source_url,
        category: c.metadata.category,
        relevance: c.score,
      }));
    }

    // Suggest follow-up questions based on intent
    const followups = [];
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
    
    // Log error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from("rag_queries").insert({
        question: "ERROR",
        answer: "An error occurred",
        confidence: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        latency_ms: Date.now() - startTime,
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ 
        error: "Failed to process your question. Please try again.",
        details: error instanceof Error ? error.message : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
