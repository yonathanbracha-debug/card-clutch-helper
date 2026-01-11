/**
 * Ask Credit Question Edge Function v2
 * Complete rewrite with:
 * - Hard output schema (AnswerSchema)
 * - Myth detection (deterministic)
 * - Calibration questions (context-aware)
 * - Depth-based composition (beginner/intermediate/advanced)
 * - PII redaction before persistence
 * - Server-first gating (onboarding required)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const SCHEMA_VERSION = 1;
const OPENAI_CHAT_MODEL = "gpt-4o-mini";
const COST_PER_1K_INPUT = 0.00015;
const COST_PER_1K_OUTPUT = 0.0006;

type AnswerDepth = "beginner" | "intermediate" | "advanced";
type ConfidenceLevel = "low" | "medium" | "high";
type RouteMode = "deterministic" | "rag" | "hybrid";

// Myth definitions (inlined for edge function)
interface CreditMyth {
  id: string;
  patterns: RegExp[];
  correction: string;
  why_it_matters: string;
}

const CREDIT_MYTHS: CreditMyth[] = [
  {
    id: "MYTH_0_UTIL_IS_BEST",
    patterns: [/0%?\s*utilization\s*(is\s*)?(best|optimal|ideal)/i, /zero\s*utilization\s*(is\s*)?(good|best)/i],
    correction: "0% utilization is NOT optimal. 1-9% reported utilization typically scores best.",
    why_it_matters: "Zero utilization suggests inactive accounts. Scoring models reward low but non-zero usage.",
  },
  {
    id: "MYTH_PAY_BY_DUE_DATE_AFFECTS_UTIL",
    patterns: [/pay\s*(by|before)\s*(the\s*)?due\s*date\s*(to\s*)?(lower|reduce)\s*utilization/i],
    correction: "Utilization is reported on statement CLOSE date, not due date. Pay BEFORE statement closes.",
    why_it_matters: "Most issuers report balances when the statement generates, not when payment is due.",
  },
  {
    id: "MYTH_CARRYING_BALANCE_BUILDS_SCORE",
    patterns: [/carry(ing)?\s*(a\s*)?balance\s*(to\s*)?(build|improve|help)\s*(credit|score)/i, /need\s*(to\s*)?carry\s*(a\s*)?balance/i],
    correction: "You do NOT need to carry a balance. Pay in full every month. Interest payments do not help your score.",
    why_it_matters: "This myth costs consumers billions in unnecessary interest.",
  },
  {
    id: "MYTH_CREDIT_CHECK_HURTS_ALWAYS",
    patterns: [/checking\s*(my\s*)?(own\s*)?credit\s*(score\s*)?(hurt|damage|lower)/i],
    correction: "Checking your own credit is a SOFT pull. It has zero effect on your score.",
    why_it_matters: "Fear of checking credit leads to ignorance about your own financial health.",
  },
  {
    id: "MYTH_CLOSING_DATE_IS_DUE_DATE",
    patterns: [/statement\s*(close|closing)\s*(date\s*)?(is\s*)?(same\s*as\s*)?(due\s*date)/i],
    correction: "Statement close date and due date are different. Close date is when statement generates. Due date is ~21-25 days later.",
    why_it_matters: "Confusing these dates causes missed timing for utilization optimization.",
  },
  {
    id: "MYTH_PAYING_INTEREST_HELPS_APPROVALS",
    patterns: [/paying\s*interest\s*(help|improve)\s*(approval|chance)/i],
    correction: "Paying interest does NOT improve approval odds. Banks profit from interest but scoring models do not reward it.",
    why_it_matters: "This myth benefits lenders, not you.",
  },
  {
    id: "MYTH_BNPL_HAS_NO_CREDIT_IMPACT",
    patterns: [/bnpl\s*(has\s*)?(no|zero)\s*(affect|impact)/i, /buy\s*now\s*pay\s*later\s*(doesn't|no)\s*affect/i],
    correction: "Many BNPL providers now report to credit bureaus. Missed payments CAN hurt your score.",
    why_it_matters: "BNPL is increasingly reported to bureaus. Missed payments can result in collections.",
  },
];

// Calibration question definitions
interface CalibrationQuestion {
  id: string;
  prompt: string;
  type: "single_select" | "number" | "currency" | "free_text";
  options?: { value: string; label: string }[];
  required: boolean;
}

const INITIAL_CALIBRATION: CalibrationQuestion[] = [
  { id: "goal", prompt: "What is your primary goal?", type: "single_select", options: [{ value: "score", label: "Build/Protect Credit Score" }, { value: "rewards", label: "Maximize Rewards" }, { value: "both", label: "Both" }], required: true },
  { id: "carry_balance", prompt: "Do you carry a balance month to month?", type: "single_select", options: [{ value: "no", label: "No, I pay in full" }, { value: "sometimes", label: "Sometimes" }, { value: "usually", label: "Usually" }], required: true },
  { id: "knows_statement_vs_due", prompt: "Do you know the difference between statement close and due date?", type: "single_select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], required: true },
  { id: "bnpl_usage", prompt: "How often do you use BNPL?", type: "single_select", options: [{ value: "never", label: "Never" }, { value: "sometimes", label: "Sometimes" }, { value: "often", label: "Often" }], required: true },
  { id: "confidence_level", prompt: "How confident are you about credit decisions?", type: "single_select", options: [{ value: "low", label: "Not confident" }, { value: "medium", label: "Somewhat" }, { value: "high", label: "Very confident" }], required: true },
];

// Schema response type
interface AnswerResponse {
  schema_version: number;
  request_id: string;
  answer_depth: AnswerDepth;
  routing: {
    mode: RouteMode;
    deterministic_topics_hit: string[];
    rag_chunks_count: number;
    model: string;
    latency_ms: number;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
  };
  calibration: {
    needed: boolean;
    questions: CalibrationQuestion[];
  };
  myth_detection: {
    flags: string[];
    corrections: { myth_id: string; correction: string; why_it_matters: string }[];
  };
  top_line: {
    verdict: string;
    confidence: ConfidenceLevel;
    one_sentence: string;
  };
  steps: { title: string; action: string; rationale: string }[];
  mechanics: { title: string; explanation: string }[];
  edge_cases: { title: string; risk: "low" | "medium" | "high"; detail: string }[];
  assumptions: string[];
  disclaimers: string[];
  followups: { prompt: string; reason: string }[];
}

// Utility functions
function generateRequestId(): string {
  return crypto.randomUUID();
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function detectMyths(question: string): { flags: string[]; corrections: AnswerResponse["myth_detection"]["corrections"] } {
  const flags: string[] = [];
  const corrections: AnswerResponse["myth_detection"]["corrections"] = [];
  
  for (const myth of CREDIT_MYTHS) {
    for (const pattern of myth.patterns) {
      if (pattern.test(question)) {
        if (!flags.includes(myth.id)) {
          flags.push(myth.id);
          corrections.push({ myth_id: myth.id, correction: myth.correction, why_it_matters: myth.why_it_matters });
        }
        break;
      }
    }
  }
  return { flags, corrections };
}

function redactPII(text: string): string {
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g, "[PHONE]")
    .replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, "[SSN]")
    .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, "[CARD]");
}

function createEmptyResponse(requestId: string, depth: AnswerDepth, latencyMs: number): AnswerResponse {
  return {
    schema_version: SCHEMA_VERSION,
    request_id: requestId,
    answer_depth: depth,
    routing: { mode: "deterministic", deterministic_topics_hit: [], rag_chunks_count: 0, model: "none", latency_ms: latencyMs, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
    calibration: { needed: false, questions: [] },
    myth_detection: { flags: [], corrections: [] },
    top_line: { verdict: "", confidence: "medium", one_sentence: "" },
    steps: [],
    mechanics: [],
    edge_cases: [],
    assumptions: [],
    disclaimers: [],
    followups: [],
  };
}

function createCalibrationResponse(requestId: string, depth: AnswerDepth, questions: CalibrationQuestion[], latencyMs: number): AnswerResponse {
  return {
    schema_version: SCHEMA_VERSION,
    request_id: requestId,
    answer_depth: depth,
    routing: { mode: "deterministic", deterministic_topics_hit: [], rag_chunks_count: 0, model: "none", latency_ms: latencyMs, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
    calibration: { needed: true, questions },
    myth_detection: { flags: [], corrections: [] },
    top_line: { verdict: "Need 2-5 details to answer precisely", confidence: "low", one_sentence: "Please answer a few quick questions so I can give you accurate guidance." },
    steps: [],
    mechanics: [],
    edge_cases: [],
    assumptions: [],
    disclaimers: [],
    followups: questions.map(q => ({ prompt: q.prompt, reason: "Required for accurate answer" })),
  };
}

function createErrorResponse(requestId: string, code: string, message: string, latencyMs: number): AnswerResponse & { error: { code: string; message: string } } {
  return {
    ...createEmptyResponse(requestId, "beginner", latencyMs),
    top_line: { verdict: "Error", confidence: "low", one_sentence: message },
    error: { code, message },
  };
}

// Composition rules by depth
function composeByDepth(
  depth: AnswerDepth,
  raw: { verdict: string; one_sentence: string; steps: any[]; mechanics: any[]; edge_cases: any[]; assumptions: string[] }
): Pick<AnswerResponse, "steps" | "mechanics" | "edge_cases" | "assumptions"> {
  switch (depth) {
    case "beginner":
      return {
        steps: raw.steps.slice(0, 6),
        mechanics: [],
        edge_cases: [],
        assumptions: raw.assumptions.slice(0, 3),
      };
    case "intermediate":
      return {
        steps: raw.steps,
        mechanics: raw.mechanics.slice(0, 4),
        edge_cases: raw.edge_cases.slice(0, 3),
        assumptions: raw.assumptions.slice(0, 5),
      };
    case "advanced":
      return {
        steps: raw.steps,
        mechanics: raw.mechanics.slice(0, 6),
        edge_cases: raw.edge_cases.slice(0, 7),
        assumptions: raw.assumptions.slice(0, 7),
      };
  }
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = generateRequestId();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
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

    // Server-first gating: check credit profile onboarding
    if (userId) {
      const { data: creditProfile } = await supabase
        .from("user_credit_profile")
        .select("onboarding_completed, experience_level, carry_balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (!creditProfile?.onboarding_completed) {
        const response = createErrorResponse(requestId, "ONBOARDING_REQUIRED", "Complete credit onboarding to use Ask AI.", Date.now() - startTime);
        return new Response(JSON.stringify(response), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Parse request
    let body: any;
    try {
      body = await req.json();
    } catch {
      const response = createErrorResponse(requestId, "INVALID_JSON", "Invalid JSON body", Date.now() - startTime);
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question, answer_depth: requestedDepth, context, calibration_answers } = body;

    if (!question || typeof question !== "string" || question.length < 5) {
      const response = createErrorResponse(requestId, "VALIDATION_ERROR", "Question must be at least 5 characters", Date.now() - startTime);
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load user preferences and calibration
    let aiPrefs: { answer_depth: AnswerDepth; tone: string } | null = null;
    let userCalibration: any = null;
    let creditProfile: any = null;

    if (userId) {
      const [aiPrefsResult, calibResult, profileResult] = await Promise.all([
        supabase.from("user_ai_preferences").select("answer_depth, tone").eq("user_id", userId).maybeSingle(),
        supabase.from("user_calibration").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_credit_profile").select("experience_level, carry_balance").eq("user_id", userId).maybeSingle(),
      ]);
      aiPrefs = aiPrefsResult.data;
      userCalibration = calibResult.data;
      creditProfile = profileResult.data;
    }

    // Determine answer depth (C1)
    let depth: AnswerDepth = "beginner";
    if (requestedDepth && ["beginner", "intermediate", "advanced"].includes(requestedDepth)) {
      depth = requestedDepth as AnswerDepth;
    } else if (aiPrefs?.answer_depth) {
      depth = aiPrefs.answer_depth as AnswerDepth;
    } else if (creditProfile?.experience_level) {
      const mapping: Record<string, AnswerDepth> = { beginner: "beginner", intermediate: "intermediate", advanced: "advanced" };
      depth = mapping[creditProfile.experience_level] || "beginner";
    }

    // Hard rule: cap at intermediate if carrying balance unless explicitly advanced
    const carriesBalance = creditProfile?.carry_balance || userCalibration?.carry_balance;
    if (carriesBalance && depth === "advanced" && requestedDepth !== "advanced") {
      depth = "intermediate";
    }

    // Check if calibration needed
    if (!userCalibration && userId) {
      // Handle calibration answers if provided
      if (calibration_answers && Object.keys(calibration_answers).length > 0) {
        // Save calibration
        const calibData: any = {
          user_id: userId,
          knows_statement_vs_due: calibration_answers.knows_statement_vs_due === "yes",
          carry_balance: calibration_answers.carry_balance !== "no",
          bnpl_usage: calibration_answers.bnpl_usage || "never",
          confidence_level: calibration_answers.confidence_level || "medium",
          goal_score: calibration_answers.goal === "score" || calibration_answers.goal === "both",
          goal_rewards: calibration_answers.goal === "rewards" || calibration_answers.goal === "both",
        };
        await supabase.from("user_calibration").upsert(calibData);

        // Also update AI preferences if not set
        if (!aiPrefs) {
          const newDepth = calibration_answers.confidence_level === "high" ? "intermediate" : "beginner";
          await supabase.from("user_ai_preferences").upsert({
            user_id: userId,
            answer_depth: newDepth,
            last_calibrated_at: new Date().toISOString(),
          });
          depth = newDepth;
        }

        userCalibration = calibData;
      } else {
        // Need calibration
        const response = createCalibrationResponse(requestId, depth, INITIAL_CALIBRATION, Date.now() - startTime);
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Myth detection
    const mythResult = detectMyths(question);

    // Generate answer using AI
    if (!openaiKey) {
      const response = createErrorResponse(requestId, "CONFIG_ERROR", "AI service not configured", Date.now() - startTime);
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt based on depth
    const depthInstructions = {
      beginner: "Give simple, actionable steps. No jargon. Maximum 6 steps.",
      intermediate: "Include mechanics and 1-3 edge cases. Explain why each step matters.",
      advanced: "Include detailed mechanics, 3-7 edge cases, explicit assumptions, and what would change your answer.",
    };

    const riskHeader = carriesBalance && depth === "advanced" 
      ? "\n\n⚠️ RISK WARNING: You carry balances. Rewards optimization advice may not apply until balances are paid.\n" 
      : "";

    const mythContext = mythResult.flags.length > 0
      ? `\n\nMYTH DETECTED: ${mythResult.corrections.map(c => c.correction).join(" ")}\n`
      : "";

    const systemPrompt = `You are a credit expert AI. ${depthInstructions[depth]}${riskHeader}${mythContext}

Respond with valid JSON matching this exact structure:
{
  "verdict": "one clear sentence answer",
  "confidence": "low|medium|high",
  "one_sentence": "brief summary",
  "steps": [{"title": "Step 1", "action": "what to do", "rationale": "why"}],
  "mechanics": [{"title": "How it works", "explanation": "..."}],
  "edge_cases": [{"title": "Exception", "risk": "low|medium|high", "detail": "..."}],
  "assumptions": ["assumption 1"],
  "disclaimers": ["This is general guidance, not financial advice."]
}`;

    const tokensIn = estimateTokens(systemPrompt + question);
    
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OpenAI error:", aiResponse.status, errText);
      const response = createErrorResponse(requestId, "AI_ERROR", "AI service error", Date.now() - startTime);
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";
    const tokensOut = estimateTokens(rawContent);
    
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { verdict: "Unable to parse response", confidence: "low", one_sentence: rawContent.substring(0, 200), steps: [], mechanics: [], edge_cases: [], assumptions: [] };
    }

    const latencyMs = Date.now() - startTime;
    const costUsd = (tokensIn * COST_PER_1K_INPUT + tokensOut * COST_PER_1K_OUTPUT) / 1000;

    // Compose response by depth
    const composed = composeByDepth(depth, {
      verdict: parsed.verdict || "",
      one_sentence: parsed.one_sentence || "",
      steps: parsed.steps || [],
      mechanics: parsed.mechanics || [],
      edge_cases: parsed.edge_cases || [],
      assumptions: parsed.assumptions || [],
    });

    const finalResponse: AnswerResponse = {
      schema_version: SCHEMA_VERSION,
      request_id: requestId,
      answer_depth: depth,
      routing: {
        mode: "rag",
        deterministic_topics_hit: mythResult.flags,
        rag_chunks_count: 0,
        model: OPENAI_CHAT_MODEL,
        latency_ms: latencyMs,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: costUsd,
      },
      calibration: { needed: false, questions: [] },
      myth_detection: mythResult,
      top_line: {
        verdict: parsed.verdict || "See steps below",
        confidence: parsed.confidence || "medium",
        one_sentence: parsed.one_sentence || "",
      },
      ...composed,
      disclaimers: parsed.disclaimers || ["This is general guidance, not financial advice."],
      followups: [],
    };

    // Persist to database with redaction
    if (userId) {
      const redactedQuestion = redactPII(question);
      const redactedAnswer = JSON.parse(JSON.stringify(finalResponse));
      // Remove any PII from answer fields
      if (redactedAnswer.top_line) {
        redactedAnswer.top_line.verdict = redactPII(redactedAnswer.top_line.verdict);
        redactedAnswer.top_line.one_sentence = redactPII(redactedAnswer.top_line.one_sentence);
      }

      try {
        await supabase.from("rag_queries").insert({
          user_id: userId,
          question: redactedQuestion,
          redacted_question: redactedQuestion,
          answer: finalResponse.top_line.verdict,
          answer_json: finalResponse,
          redacted_answer: redactedAnswer,
          answer_schema_version: SCHEMA_VERSION,
          answer_depth: depth,
          myth_flags: mythResult.flags,
          calibration_needed: false,
          calibration_questions: [],
          routing: finalResponse.routing,
          confidence: parsed.confidence === "high" ? 0.9 : parsed.confidence === "medium" ? 0.7 : 0.5,
          model: OPENAI_CHAT_MODEL,
          latency_ms: latencyMs,
        });
      } catch (logError) {
        console.error("Failed to log query:", logError);
      }
    }

    return new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Ask error:", error);
    const response = createErrorResponse(requestId, "INTERNAL_ERROR", (error as Error).message || "Unknown error", Date.now() - startTime);
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
