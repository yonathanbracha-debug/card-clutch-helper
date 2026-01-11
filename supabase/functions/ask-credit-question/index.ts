/**
 * Ask Credit Question Edge Function v3
 * With HardAnswerSchema format and Section 6 blocking logic
 * 
 * Changes from v2:
 * - Uses HardAnswer schema (summary, recommended_action, steps, mechanics, edge_cases, warnings, confidence, blocked, block_reason)
 * - Implements credit_state blocking logic
 * - BNPL/high-risk detection forces risk mode
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const HARD_SCHEMA_VERSION = 2;
const OPENAI_CHAT_MODEL = "gpt-4o-mini";
const COST_PER_1K_INPUT = 0.00015;
const COST_PER_1K_OUTPUT = 0.0006;

type AnswerDepth = "beginner" | "intermediate" | "advanced";
type ConfidenceLevel = "low" | "medium" | "high";
type QuestionType = "myth" | "procedure" | "optimization" | "risk" | "education";

// Depth rules - Section 3
interface DepthRules {
  summary: { maxSentences: number };
  recommended_action: boolean;
  steps: { max: number };
  mechanics: boolean;
  edge_cases: boolean;
  warnings: 'severe_only' | 'allowed' | 'required';
}

const DEPTH_RULES: Record<AnswerDepth, DepthRules> = {
  beginner: {
    summary: { maxSentences: 2 },
    recommended_action: true,
    steps: { max: 3 },
    mechanics: false,
    edge_cases: false,
    warnings: 'severe_only',
  },
  intermediate: {
    summary: { maxSentences: 3 },
    recommended_action: true,
    steps: { max: 6 },
    mechanics: true,
    edge_cases: false,
    warnings: 'allowed',
  },
  advanced: {
    summary: { maxSentences: 4 },
    recommended_action: true,
    steps: { max: 10 },
    mechanics: true,
    edge_cases: true,
    warnings: 'required',
  },
};

// HardAnswer schema type - Section 2
interface HardAnswer {
  summary: string;
  recommended_action: string | null;
  steps: string[];
  mechanics: string | null;
  edge_cases: string[] | null;
  warnings: string[] | null;
  confidence: ConfidenceLevel;
  blocked: boolean;
  block_reason: string | null;
}

// Extended response with metadata
interface HardAnswerResponse extends HardAnswer {
  schema_version: number;
  request_id: string;
  answer_depth: AnswerDepth;
  question_type: QuestionType;
  myth_check?: {
    detected: boolean;
    myth?: string;
    correction?: string;
  };
  routing: {
    model: string;
    latency_ms: number;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Myth definitions - Section 4
interface CreditMyth {
  id: string;
  name: string;
  patterns: RegExp[];
  correction: string;
}

const MANDATORY_MYTHS: CreditMyth[] = [
  {
    id: "MYTH_0_UTIL_IS_BEST",
    name: "0% utilization is best",
    patterns: [/0%?\s*utilization\s*(is\s*)?(best|optimal|ideal)/i, /zero\s*utilization\s*(is\s*)?(good|best)/i],
    correction: "1-9% utilization typically scores better than 0%. Zero utilization suggests inactive accounts.",
  },
  {
    id: "MYTH_PAYING_EARLY_HURTS",
    name: "Paying early hurts score",
    patterns: [/paying\s*early\s*(hurt|damage|lower)\s*(score|credit)/i],
    correction: "Paying early does not hurt your score. It reduces utilization reported on statement close.",
  },
  {
    id: "MYTH_MORE_CARDS_ALWAYS_HELP",
    name: "More cards always help",
    patterns: [/more\s*cards?\s*(always|definitely)\s*(help|improve|good)/i],
    correction: "More cards can help average age and total credit, but new inquiries temporarily lower score.",
  },
  {
    id: "MYTH_CLOSING_IS_NEUTRAL",
    name: "Closing cards is neutral",
    patterns: [/closing\s*(cards?|accounts?)\s*(is\s*)?(neutral|fine|ok|doesn't\s*matter)/i],
    correction: "Closing cards reduces total credit limit, which can raise utilization and hurt score.",
  },
  {
    id: "MYTH_CARRYING_BALANCE_BUILDS_CREDIT",
    name: "Carrying balance builds credit",
    patterns: [/carry(ing)?\s*(a\s*)?balance\s*(to\s*)?(build|improve|help)\s*(credit|score)/i, /need\s*(to\s*)?carry\s*(a\s*)?balance/i],
    correction: "You do NOT need to carry a balance. Pay in full every month. Interest does not help your score.",
  },
  {
    id: "MYTH_BNPL_IS_HARMLESS",
    name: "BNPL is harmless",
    patterns: [/bnpl\s*(is\s*)?(harmless|safe|no\s*impact)/i, /buy\s*now\s*pay\s*later\s*(is\s*)?(safe|harmless)/i],
    correction: "Many BNPL providers now report to credit bureaus. Missed payments CAN hurt your score.",
  },
  {
    id: "MYTH_MINIMUM_AVOIDS_INTEREST_IMPACT",
    name: "Minimum payment avoids interest impact",
    patterns: [/minimum\s*payment\s*(avoids?|prevents?)\s*(interest|impact)/i],
    correction: "Minimum payment avoids late fees but you still accrue interest on remaining balance.",
  },
  {
    id: "MYTH_PAY_BY_DUE_DATE_AFFECTS_UTIL",
    name: "Pay by due date affects utilization",
    patterns: [/pay\s*(by|before)\s*(the\s*)?due\s*date\s*(to\s*)?(lower|reduce)\s*utilization/i],
    correction: "Utilization is reported on statement CLOSE date, not due date. Pay BEFORE statement closes.",
  },
  {
    id: "MYTH_CLOSING_DATE_IS_DUE_DATE",
    name: "Statement close is due date",
    patterns: [/statement\s*(close|closing)\s*(date\s*)?(is\s*)?(same\s*as\s*)?(due\s*date)/i],
    correction: "Statement close date and due date are different. Close date is when statement generates. Due date is ~21-25 days later.",
  },
  {
    id: "MYTH_CREDIT_CHECK_HURTS",
    name: "Checking credit hurts score",
    patterns: [/checking\s*(my\s*)?(own\s*)?credit\s*(score\s*)?(hurt|damage|lower)/i],
    correction: "Checking your own credit is a SOFT pull. It has zero effect on your score.",
  },
  {
    id: "MYTH_BNPL_HAS_NO_CREDIT_IMPACT",
    name: "BNPL has no credit impact",
    patterns: [/bnpl\s*(has\s*)?(no|zero)\s*(affect|impact)/i, /buy\s*now\s*pay\s*later\s*(doesn't|no)\s*affect/i],
    correction: "Many BNPL providers now report to credit bureaus. Missed payments CAN hurt your score.",
  },
];

// BNPL/high-risk patterns - Section 7
const HIGH_RISK_PATTERNS = [
  /bnpl/i,
  /buy\s*now\s*pay\s*later/i,
  /klarna/i,
  /affirm/i,
  /afterpay/i,
  /minimum\s*payment/i,
  /cash\s*advance/i,
  /payday/i,
  /large\s*(purchase|spend)/i,
];

// Calibration questions
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

// Utility functions
function generateRequestId(): string {
  return crypto.randomUUID();
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function classifyQuestion(question: string): QuestionType {
  const q = question.toLowerCase();
  
  // Check for myth patterns first
  for (const myth of MANDATORY_MYTHS) {
    for (const pattern of myth.patterns) {
      if (pattern.test(question)) return "myth";
    }
  }
  
  // Check for high-risk patterns
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(question)) return "risk";
  }
  
  // Classify based on keywords
  if (/should\s*i|what\s*card|best\s*card|recommend|optimize|maximize/i.test(q)) return "optimization";
  if (/how\s*(do|to)|when\s*(should|to)|step|process/i.test(q)) return "procedure";
  if (/risk|danger|hurt|damage|bad\s*for/i.test(q)) return "risk";
  
  return "education";
}

function detectMyth(question: string): { detected: boolean; myth?: string; correction?: string } {
  for (const myth of MANDATORY_MYTHS) {
    for (const pattern of myth.patterns) {
      if (pattern.test(question)) {
        return { detected: true, myth: myth.name, correction: myth.correction };
      }
    }
  }
  return { detected: false };
}

function redactPII(text: string): string {
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g, "[PHONE]")
    .replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, "[SSN]")
    .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, "[CARD]");
}

// Apply depth rules - Section 3
function applyDepthRules(answer: Partial<HardAnswer>, depth: AnswerDepth): HardAnswer {
  const rules = DEPTH_RULES[depth];
  
  return {
    summary: answer.summary || "",
    recommended_action: rules.recommended_action ? (answer.recommended_action || null) : null,
    steps: (answer.steps || []).slice(0, rules.steps.max),
    mechanics: rules.mechanics ? (answer.mechanics || null) : null,
    edge_cases: rules.edge_cases ? (answer.edge_cases || null) : null,
    warnings: answer.warnings || null,
    confidence: answer.confidence || "medium",
    blocked: answer.blocked || false,
    block_reason: answer.block_reason || null,
  };
}

// Create blocked response - Section 6
function createBlockedResponse(
  requestId: string,
  depth: AnswerDepth,
  reason: string,
  unlockConditions: string[],
  latencyMs: number
): HardAnswerResponse {
  return {
    schema_version: HARD_SCHEMA_VERSION,
    request_id: requestId,
    answer_depth: depth,
    question_type: "risk",
    summary: "This recommendation is blocked based on your credit profile.",
    recommended_action: null,
    steps: unlockConditions.map(c => `To unlock: ${c}`),
    mechanics: null,
    edge_cases: null,
    warnings: [reason],
    confidence: "high",
    blocked: true,
    block_reason: reason,
    routing: { model: "blocking_logic", latency_ms: latencyMs, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
  };
}

// Create calibration response
function createCalibrationResponse(
  requestId: string,
  depth: AnswerDepth,
  questions: CalibrationQuestion[],
  latencyMs: number
): HardAnswerResponse & { calibration: { needed: boolean; questions: CalibrationQuestion[] } } {
  return {
    schema_version: HARD_SCHEMA_VERSION,
    request_id: requestId,
    answer_depth: depth,
    question_type: "education",
    summary: "I need one detail before answering.",
    recommended_action: null,
    steps: [questions[0]?.prompt || "Please complete calibration."],
    mechanics: null,
    edge_cases: null,
    warnings: null,
    confidence: "low",
    blocked: false,
    block_reason: null,
    calibration: { needed: true, questions },
    routing: { model: "calibration", latency_ms: latencyMs, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
  };
}

// Create error response
function createErrorResponse(
  requestId: string,
  depth: AnswerDepth,
  code: string,
  message: string,
  latencyMs: number
): HardAnswerResponse {
  return {
    schema_version: HARD_SCHEMA_VERSION,
    request_id: requestId,
    answer_depth: depth,
    question_type: "education",
    summary: message,
    recommended_action: null,
    steps: [],
    mechanics: null,
    edge_cases: null,
    warnings: null,
    confidence: "low",
    blocked: false,
    block_reason: null,
    routing: { model: "error", latency_ms: latencyMs, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
    error: { code, message },
  };
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = generateRequestId();
  let depth: AnswerDepth = "beginner";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

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
        .select("onboarding_completed, experience_level, carry_balance, intent")
        .eq("user_id", userId)
        .maybeSingle();

      if (!creditProfile?.onboarding_completed) {
        const response = createErrorResponse(requestId, depth, "ONBOARDING_REQUIRED", "Complete credit onboarding to use Ask AI.", Date.now() - startTime);
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
      const response = createErrorResponse(requestId, depth, "INVALID_JSON", "Invalid JSON body", Date.now() - startTime);
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question, answer_depth: requestedDepth, context, calibration_answers } = body;

    if (!question || typeof question !== "string" || question.length < 5) {
      const response = createErrorResponse(requestId, depth, "VALIDATION_ERROR", "Question must be at least 5 characters", Date.now() - startTime);
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
        supabase.from("user_credit_profile").select("experience_level, carry_balance, intent").eq("user_id", userId).maybeSingle(),
      ]);
      aiPrefs = aiPrefsResult.data;
      userCalibration = calibResult.data;
      creditProfile = profileResult.data;
    }

    // Determine answer depth (Section 3)
    if (requestedDepth && ["beginner", "intermediate", "advanced"].includes(requestedDepth)) {
      depth = requestedDepth as AnswerDepth;
    } else if (aiPrefs?.answer_depth) {
      depth = aiPrefs.answer_depth as AnswerDepth;
    } else if (creditProfile?.experience_level) {
      const mapping: Record<string, AnswerDepth> = { beginner: "beginner", intermediate: "intermediate", advanced: "advanced" };
      depth = mapping[creditProfile.experience_level] || "beginner";
    }

    // Get credit_state for blocking logic
    const carriesBalance = creditProfile?.carry_balance || userCalibration?.carry_balance === true;
    const intent = creditProfile?.intent || "score";

    // Section 6: Blocking Logic - Safety > Help
    const questionType = classifyQuestion(question);
    
    // Block rewards optimization if user carries balance
    if (questionType === "optimization" && carriesBalance) {
      const isRewardsQuestion = /rewards?|cashback|points|miles|maximize|best\s*card\s*for/i.test(question);
      if (isRewardsQuestion) {
        const response = createBlockedResponse(
          requestId,
          depth,
          "You carry balances. Rewards optimization becomes negative expected value under interest.",
          ["Pay off all credit card balances", "Build a habit of paying in full each month"],
          Date.now() - startTime
        );
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Section 4: Myth Detection - blocked = true for myths
    const mythCheck = detectMyth(question);
    if (mythCheck.detected) {
      const response: HardAnswerResponse = {
        schema_version: HARD_SCHEMA_VERSION,
        request_id: requestId,
        answer_depth: depth,
        question_type: "myth",
        summary: mythCheck.correction || "This is a common misconception.",
        recommended_action: "Reframe your understanding with the correct information.",
        steps: [],
        mechanics: null,
        edge_cases: null,
        warnings: [`Myth detected: "${mythCheck.myth}"`],
        confidence: "high",
        blocked: true,
        block_reason: "This question is based on a common credit myth. No optimization advice until misconception is addressed.",
        myth_check: mythCheck,
        routing: { model: "myth_detection", latency_ms: Date.now() - startTime, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
      };

      // Persist myth detection
      if (userId) {
        try {
          await supabase.from("rag_queries").insert({
            user_id: userId,
            question: redactPII(question),
            redacted_question: redactPII(question),
            answer: mythCheck.correction || "",
            answer_json: response,
            redacted_answer: response,
            answer_schema_version: HARD_SCHEMA_VERSION,
            answer_depth: depth,
            myth_flags: [mythCheck.myth],
            calibration_needed: false,
            calibration_questions: [],
            routing: response.routing,
            confidence: 0.95,
            model: "myth_detection",
            latency_ms: Date.now() - startTime,
          });
        } catch (logError) {
          console.error("Failed to log myth query:", logError);
        }
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if calibration needed
    if (!userCalibration && userId) {
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

        // Update AI preferences if not set
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

    // Section 7: BNPL + High-Risk Detection - force risk mode
    const isHighRisk = HIGH_RISK_PATTERNS.some(p => p.test(question));
    
    // Generate answer using Lovable AI
    if (!lovableKey) {
      const response = createErrorResponse(requestId, depth, "CONFIG_ERROR", "AI service not configured", Date.now() - startTime);
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt with depth-specific instructions
    const depthInstructions = {
      beginner: "Give ONLY: 1-2 sentence summary, one recommended action, max 3 simple steps. NO jargon. NO mechanics. NO edge cases.",
      intermediate: "Include: summary, recommended action, up to 6 steps, 1-2 paragraphs of mechanics. Optional: 1-2 edge cases.",
      advanced: "Include: summary, recommended action, all steps, detailed mechanics, 3+ edge cases, explicit assumptions and limitations.",
    };

    const riskWarning = isHighRisk || carriesBalance
      ? "\n\nWARNING: This involves financial risk. Lead with downsides. Suppress reward framing. Be conservative."
      : "";

    const systemPrompt = `You are a credit expert AI providing regulated financial explanations.
${depthInstructions[depth]}${riskWarning}

CRITICAL: Respond with valid JSON matching this EXACT structure:
{
  "summary": "1-2 sentence main answer",
  "recommended_action": "what to do next",
  "steps": ["step 1", "step 2"],
  "mechanics": "how it works" or null,
  "edge_cases": ["exception 1"] or null,
  "warnings": ["critical warning"] or null,
  "confidence": "high" | "medium" | "low"
}

Rules:
- No extra fields
- No markdown
- No prose outside fields
- Empty arrays allowed, fabrication forbidden`;

    const tokensIn = estimateTokens(systemPrompt + question);
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        const response = createErrorResponse(requestId, depth, "RATE_LIMITED", "Rate limit exceeded. Please try again later.", Date.now() - startTime);
        return new Response(JSON.stringify(response), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        const response = createErrorResponse(requestId, depth, "PAYMENT_REQUIRED", "AI credits exhausted. Please add funds.", Date.now() - startTime);
        return new Response(JSON.stringify(response), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const response = createErrorResponse(requestId, depth, "AI_ERROR", "AI service error", Date.now() - startTime);
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";
    const tokensOut = estimateTokens(rawContent);
    
    // Parse JSON from response (handle markdown code blocks)
    let parsed: any;
    try {
      let jsonStr = rawContent;
      // Strip markdown code blocks if present
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      // Return error response if JSON invalid
      const response = createErrorResponse(requestId, depth, "INVALID_OUTPUT_SCHEMA", "AI returned invalid JSON", Date.now() - startTime);
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const latencyMs = Date.now() - startTime;
    const costUsd = (tokensIn * COST_PER_1K_INPUT + tokensOut * COST_PER_1K_OUTPUT) / 1000;

    // Apply depth rules to constrain output
    const constrained = applyDepthRules({
      summary: parsed.summary,
      recommended_action: parsed.recommended_action,
      steps: parsed.steps,
      mechanics: parsed.mechanics,
      edge_cases: parsed.edge_cases,
      warnings: parsed.warnings,
      confidence: parsed.confidence,
      blocked: false,
      block_reason: null,
    }, depth);

    // Section 5: Risk & Safety Guardrails - add warnings if high risk
    if (isHighRisk && (!constrained.warnings || constrained.warnings.length === 0)) {
      constrained.warnings = ["This involves financial products that may have hidden costs or credit impact."];
    }

    const finalResponse: HardAnswerResponse = {
      schema_version: HARD_SCHEMA_VERSION,
      request_id: requestId,
      answer_depth: depth,
      question_type: questionType,
      ...constrained,
      routing: {
        model: "google/gemini-3-flash-preview",
        latency_ms: latencyMs,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: costUsd,
      },
    };

    // Persist to database with redaction
    if (userId) {
      const redactedQuestion = redactPII(question);
      const redactedAnswer = JSON.parse(JSON.stringify(finalResponse));
      redactedAnswer.summary = redactPII(redactedAnswer.summary);

      try {
        await supabase.from("rag_queries").insert({
          user_id: userId,
          question: redactedQuestion,
          redacted_question: redactedQuestion,
          answer: finalResponse.summary,
          answer_json: finalResponse,
          redacted_answer: redactedAnswer,
          answer_schema_version: HARD_SCHEMA_VERSION,
          answer_depth: depth,
          myth_flags: [],
          calibration_needed: false,
          calibration_questions: [],
          routing: finalResponse.routing,
          confidence: constrained.confidence === "high" ? 0.9 : constrained.confidence === "medium" ? 0.7 : 0.5,
          model: "google/gemini-3-flash-preview",
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
    const response = createErrorResponse(requestId, depth, "INTERNAL_ERROR", (error as Error).message || "Unknown error", Date.now() - startTime);
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
