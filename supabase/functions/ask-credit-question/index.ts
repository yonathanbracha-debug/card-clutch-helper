/**
 * Ask Credit Question Edge Function
 * AI-powered credit question answering with rate limiting and audit logging
 * Uses Lovable AI Gateway for completions
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Lovable AI Gateway
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

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

async function generateAnswer(
  question: string,
  lovableApiKey: string,
  intent: string
): Promise<{ answer: string; confidence: number }> {
  const systemPrompt = `You are CardClutch's credit expert assistant. You provide accurate, helpful information about credit cards, credit scores, and personal finance.

RULES:
1. NEVER hallucinate or make up specific numbers, rates, or product details. If you don't know exact details, say so.
2. Be conservative and safe with financial advice. Use phrases like "generally" and "typically".
3. Do NOT provide legal, tax, or investment advice. Suggest consulting professionals for specific situations.
4. Keep answers concise but complete (2-4 paragraphs max).
5. If you need clarification, ask 1-2 specific follow-up questions.
6. Focus on general credit education and best practices.
7. For card-specific questions, recommend the user check issuer websites for current terms.

INTENT CONTEXT: The user's question is classified as "${intent}".`;

  const response = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
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
    
    // Handle rate limiting from Lovable AI
    if (response.status === 429) {
      throw new Error("AI service is busy. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI service quota exceeded. Please try again later.");
    }
    
    throw new Error(`AI completion error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate an answer.";
  
  // Calculate confidence based on intent match
  let confidence = 0.75; // Default confidence
  if (intent === "credit_education") {
    confidence = 0.85; // Higher confidence for education questions
  } else if (intent === "card_rewards") {
    confidence = 0.7; // Lower for specific card questions without RAG
  } else if (intent === "issuer_policy") {
    confidence = 0.6; // Lower for issuer-specific questions
  }

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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const rateLimitSalt = Deno.env.get("RATE_LIMIT_SALT") || "default-salt";

    if (!lovableApiKey) {
      console.error("Missing LOVABLE_API_KEY");
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

    const { question, include_citations } = validation.data;

    // Classify intent
    const intent = classifyIntent(question);

    // Generate answer using Lovable AI
    const { answer, confidence } = await generateAnswer(
      question,
      lovableApiKey,
      intent
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
      retrieved_chunks: [], // No RAG retrieval in this version
      answer,
      confidence,
      model: "google/gemini-2.5-flash",
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

    // Suggest follow-up questions based on intent
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
    
    const startTimeForLog = Date.now();
    
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

    // Return user-friendly error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage.includes("busy") || errorMessage.includes("quota") 
          ? errorMessage 
          : "Failed to process your question. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
