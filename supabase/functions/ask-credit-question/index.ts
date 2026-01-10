/**
 * Ask Credit Question Edge Function
 * AI-powered credit question answering with:
 * 1. DETERMINISTIC ROUTER - Universal credit concepts answered instantly (0 tokens)
 * 2. RAG PATH - Issuer-specific/complex questions use OpenAI embeddings + Pinecone
 * 
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

// ============= Deterministic Credit Knowledge =============

interface DeterministicAnswer {
  answer: string;
  confidence: number;
  intent: string;
}

// Topics that can be answered WITHOUT RAG or LLM
function isDeterministicCreditTopic(q: string): boolean {
  const s = q.toLowerCase();
  return (
    s.includes("credit utilization") ||
    s.includes("utilization rate") ||
    s.includes("utilization ratio") ||
    s.includes("how does utilization") ||
    (s.includes("statement") && s.includes("balance")) ||
    (s.includes("statement") && s.includes("due date")) ||
    (s.includes("pay") && s.includes("statement") && s.includes("close")) ||
    s.includes("minimum payment") ||
    s.includes("grace period") ||
    (s.includes("apr") && !s.includes("which card") && !s.includes("best")) ||
    (s.includes("interest") && s.includes("work")) ||
    (s.includes("interest") && s.includes("charge")) ||
    (s.includes("interest") && s.includes("avoid")) ||
    (s.includes("credit score") && s.includes("affect")) ||
    (s.includes("credit score") && s.includes("impact")) ||
    (s.includes("multiple cards") && s.includes("utilization")) ||
    s.includes("statement closing date") ||
    s.includes("billing cycle")
  );
}

// Return deterministic answer for universal credit concepts (NO OpenAI, NO Pinecone)
function getDeterministicAnswer(q: string): DeterministicAnswer | null {
  const s = q.toLowerCase();

  // Credit Utilization
  if (s.includes("credit utilization") || s.includes("utilization rate") || s.includes("utilization ratio") || s.includes("how does utilization")) {
    return {
      answer: `Credit utilization is the percentage of your available credit that you're currently using, and it's one of the most important factors in your credit score (typically ~30% of your FICO score).

**How it's calculated:**
\`(Current Balance ÷ Credit Limit) × 100\`

**Guidelines:**
• **Under 10%**: Excellent – optimal for credit score
• **10–30%**: Good – generally safe range
• **30–50%**: Fair – may start to hurt your score
• **Above 50%**: Poor – significant negative impact

**Key insight:** Utilization is typically reported based on your **statement balance**, not your balance on the due date. To optimize your score, pay down your balance **before** your statement closes, not just before the due date.`,
      confidence: 0.95,
      intent: "credit_education",
    };
  }

  // Statement balance vs due date
  if ((s.includes("statement") && s.includes("due date")) || (s.includes("pay") && s.includes("statement") && s.includes("close"))) {
    return {
      answer: `Your **statement balance** and **due date** serve different purposes:

**Statement Balance:**
• This is what gets **reported to credit bureaus**
• It's the balance when your billing cycle closes
• Affects your credit utilization ratio

**Due Date:**
• This is the deadline to **avoid interest charges**
• Typically 21-25 days after the statement closes
• Missing it incurs late fees and potential APR increases

**To optimize both credit score AND avoid interest:**
1. Pay down your balance **before the statement closes** → lowers reported utilization
2. Pay the remaining statement balance **by the due date** → avoids interest

These strategies work together. You can make multiple payments per month to achieve both goals.`,
      confidence: 0.95,
      intent: "credit_education",
    };
  }

  // Minimum payment
  if (s.includes("minimum payment")) {
    return {
      answer: `The **minimum payment** is the smallest amount you must pay by your due date to keep your account in good standing. However, paying only the minimum is costly:

**What happens if you pay only the minimum:**
• You **avoid late fees** and penalties
• You **still get charged interest** on the remaining balance
• Debt compounds and can take years (even decades) to pay off
• A $5,000 balance at 20% APR paying minimums could take 20+ years to pay off

**Best practices:**
• **Pay in full** each month if possible → no interest charges
• If you can't pay in full, pay **as much as you can** above the minimum
• Set up autopay for at least the minimum to avoid late fees

**Credit score impact:** Paying on time (even the minimum) is good for your score, but high balances hurt your utilization ratio.`,
      confidence: 0.95,
      intent: "credit_education",
    };
  }

  // Grace period
  if (s.includes("grace period")) {
    return {
      answer: `The **grace period** is the time between your statement closing date and your payment due date when you can pay your balance **without incurring interest**.

**Key points:**
• Typically **21-25 days** (required by law to be at least 21 days)
• **Only applies if you paid your previous balance in full**
• If you carry a balance from the previous month, there is **no grace period** – interest accrues immediately on new purchases

**How to maintain your grace period:**
1. Pay your statement balance in full by the due date every month
2. Once you carry a balance, you lose the grace period until you pay in full for a complete billing cycle

**Pro tip:** If you've lost your grace period, make a payment equal to your full statement balance to restore it for the next cycle.`,
      confidence: 0.95,
      intent: "credit_education",
    };
  }

  // APR / Interest mechanics
  if ((s.includes("apr") || s.includes("interest")) && (s.includes("work") || s.includes("charge") || s.includes("avoid") || s.includes("calculated"))) {
    return {
      answer: `**APR (Annual Percentage Rate)** is the yearly interest rate charged on carried balances. Here's how it works:

**How interest is calculated:**
• **Daily Periodic Rate** = APR ÷ 365
• Interest accrues daily on your average daily balance
• Example: 24% APR = 0.0657% per day

**When you're charged interest:**
• Only on balances you **carry past the due date**
• If you pay in full by the due date, **no interest** (thanks to the grace period)
• If you carry a balance, interest starts accruing on **new purchases immediately**

**How to avoid interest:**
1. Pay your statement balance in full every month
2. Use cards with 0% intro APR offers for large purchases (if needed)
3. Never pay only the minimum if you can help it

**Types of APR:** Purchase APR, Balance Transfer APR, Cash Advance APR (often highest), and Penalty APR (triggered by missed payments).`,
      confidence: 0.95,
      intent: "credit_education",
    };
  }

  // Multiple cards utilization
  if ((s.includes("multiple cards") || s.includes("several cards")) && s.includes("utilization")) {
    return {
      answer: `When you have **multiple credit cards**, utilization is calculated in two ways:

**1. Overall Utilization (most important):**
\`Total Balance Across All Cards ÷ Total Credit Limit Across All Cards\`

**2. Per-Card Utilization:**
Each card's individual utilization also matters, though less than overall.

**Example:**
• Card A: $500 balance, $5,000 limit (10%)
• Card B: $2,000 balance, $5,000 limit (40%)
• **Overall:** $2,500 ÷ $10,000 = **25%** ✓

**Strategy tips:**
• Keep overall utilization under 30% (under 10% is optimal)
• Avoid maxing out any single card, even if overall is low
• Spreading balances across cards is better than concentrating on one
• Opening a new card increases total credit limit, which can lower overall utilization`,
      confidence: 0.95,
      intent: "credit_education",
    };
  }

  // Statement closing date / billing cycle
  if (s.includes("statement closing date") || s.includes("billing cycle")) {
    return {
      answer: `Your **billing cycle** and **statement closing date** are key to understanding your credit card:

**Billing Cycle:**
• Typically **28-31 days** depending on the issuer
• All purchases within this period appear on your statement
• Starts the day after your previous statement closed

**Statement Closing Date:**
• The last day of your billing cycle
• Your **balance on this day is reported to credit bureaus**
• This is the date that determines your utilization ratio

**Key dates timeline:**
1. **Statement closes** → Balance is reported to bureaus
2. **Statement generated** → You receive your bill
3. **Due date** (21-25 days later) → Deadline to pay to avoid interest

**Pro tip:** To lower your reported utilization, make a payment a few days **before** your statement closing date.`,
      confidence: 0.95,
      intent: "credit_education",
    };
  }

  // Credit score impact/affect (general question)
  if ((s.includes("credit score") && (s.includes("affect") || s.includes("impact"))) && !s.includes("which card") && !s.includes("issuer")) {
    return {
      answer: `Your **credit score** is affected by five main factors (FICO model):

**1. Payment History (35%)**
• Pay on time, every time
• Even one 30-day late payment can drop your score significantly

**2. Credit Utilization (30%)**
• Keep balances below 30% of your credit limits
• Under 10% is optimal for the highest scores

**3. Length of Credit History (15%)**
• Average age of your accounts matters
• Don't close old cards unnecessarily

**4. Credit Mix (10%)**
• Having different types of credit (cards, loans, mortgage) helps
• Don't open accounts just for mix – let it develop naturally

**5. New Credit (10%)**
• Hard inquiries temporarily lower your score (~5-10 points)
• Opening several accounts in a short period is risky

**Quick wins:** Pay on time, keep utilization low, don't close old accounts, and limit new applications.`,
      confidence: 0.95,
      intent: "credit_education",
    };
  }

  return null;
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
1. For UNIVERSALLY ESTABLISHED credit concepts (utilization, payment timing, interest mechanics, score factors), provide confident answers even without context. These are well-documented facts.
2. For ISSUER-SPECIFIC details (specific card terms, current rates, specific policies), ONLY use the provided context. If context is insufficient, say "I don't have specific details about that" and recommend checking the issuer's website.
3. NEVER hallucinate or make up specific numbers, rates, or product details.
4. Be conservative and safe with financial advice. Use phrases like "generally" and "typically".
5. Do NOT provide legal, tax, or investment advice.
6. Keep answers concise but complete (2-4 paragraphs max).
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

    // =====================================================================
    // STEP 1: Check for DETERMINISTIC answer FIRST (NO OpenAI, NO Pinecone)
    // This saves tokens and guarantees accurate answers for basic concepts
    // =====================================================================
    if (isDeterministicCreditTopic(question)) {
      const deterministicResult = getDeterministicAnswer(question);
      
      if (deterministicResult) {
        // Increment rate limit (still counts as a question)
        await incrementRateLimit(supabase, bucket, "ask_credit_question");
        
        const latencyMs = Date.now() - startTime;
        
        // Log query for audit (source: internal_rules)
        try {
          await supabase.from("rag_queries").insert({
            user_id: userId,
            ip_hash: ipHash,
            question,
            intent: deterministicResult.intent,
            retrieved_chunks: [], // No external sources used
            answer: deterministicResult.answer,
            confidence: deterministicResult.confidence,
            model: "internal_rules", // No LLM used
            latency_ms: latencyMs,
            include_citations: include_citations || false,
          });
        } catch (logError) {
          console.error("Failed to log deterministic query:", logError);
        }

        // Return immediately - no tokens spent!
        return new Response(
          JSON.stringify({
            answer: deterministicResult.answer,
            confidence: deterministicResult.confidence,
            intent: deterministicResult.intent,
            source: "internal_rules",
            latency_ms: latencyMs,
            followups: [
              "How do hard inquiries affect my score?",
              "What's the best way to build credit?",
            ],
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // =====================================================================
    // STEP 2: RAG path for issuer-specific or complex questions
    // =====================================================================

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
