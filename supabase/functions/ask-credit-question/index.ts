/**
 * Ask Credit Question Edge Function
 * AI-powered credit question answering with:
 * 1. DETERMINISTIC ROUTER - Universal credit concepts answered instantly (0 tokens)
 * 2. HYBRID COMPOSER - Mixed questions get deterministic core + RAG supplement
 * 3. RAG PATH - Issuer-specific/complex questions use OpenAI embeddings + Pinecone
 * 
 * Rate limited, audit logged, quota-safe, cost-tracked
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OpenAI config
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_CHAT_MODEL = "gpt-4o-mini";

// Cost estimation (per 1M tokens)
const COST_EMBEDDING_PER_1M = 0.02;
const COST_CHAT_INPUT_PER_1M = 0.15;
const COST_CHAT_OUTPUT_PER_1M = 0.60;

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

// Metrics for cost tracking - MANDATORY fields for Admin Dashboard
interface RequestMetrics {
  route: "deterministic" | "rag" | "hybrid" | "clarify" | "error";
  intent: string;
  deterministic_hit: boolean;
  embedding_tokens: number | null;
  chat_tokens: number | null;
  pinecone_hits: number;
  latency_ms: number;
  model: string;
  cost_estimate_usd: number | null;
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

// Issuer keywords that trigger hybrid or RAG path
const ISSUER_KEYWORDS = [
  "amex", "american express", "chase", "citi", "citibank", "capital one",
  "discover", "wells fargo", "bank of america", "barclays", "us bank",
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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function calculateCost(embeddingTokens: number, chatInputTokens: number, chatOutputTokens: number): number {
  const embeddingCost = (embeddingTokens / 1_000_000) * COST_EMBEDDING_PER_1M;
  const chatInputCost = (chatInputTokens / 1_000_000) * COST_CHAT_INPUT_PER_1M;
  const chatOutputCost = (chatOutputTokens / 1_000_000) * COST_CHAT_OUTPUT_PER_1M;
  return embeddingCost + chatInputCost + chatOutputCost;
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
// EXPANDED RULESET: Tier A (Critical) + Tier B (Important)

interface DeterministicRule {
  id: string;
  matchers: (q: string) => boolean;
  answer: (q: string) => string;
  confidence: number;
}

const DETERMINISTIC_RULES: DeterministicRule[] = [
  // ========== TIER A: CRITICAL TOPICS ==========
  
  // Credit Utilization (overall + per-card)
  {
    id: "utilization_overall",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("credit utilization") ||
        s.includes("utilization rate") ||
        s.includes("utilization ratio") ||
        s.includes("how does utilization") ||
        (s.includes("utilization") && (s.includes("affect") || s.includes("impact") || s.includes("score")))
      );
    },
    answer: () => `Credit utilization is the percentage of your available credit that you're currently using, and it's one of the most important factors in your credit score (typically ~30% of your FICO score).

**How it's calculated:**

**Overall Utilization (most important):**
\`Total Balance Across All Cards ÷ Total Credit Limit Across All Cards\`

**Per-Card Utilization:**
Each card's individual utilization also matters, though less than overall.

**Example with multiple cards:**
• Card A: $500 balance, $5,000 limit (10%)
• Card B: $2,000 balance, $5,000 limit (40%)
• **Overall:** $2,500 ÷ $10,000 = **25%** ✓

**Guidelines:**
• **Under 10%**: Excellent – optimal for credit score
• **10–30%**: Good – generally safe range
• **30–50%**: Fair – may start to hurt your score
• **Above 50%**: Poor – significant negative impact

**Key insight:** Utilization is typically reported based on your **statement balance**, not your balance on the due date.`,
    confidence: 0.95,
  },

  // 0% Utilization Myth
  {
    id: "zero_utilization_myth",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        (s.includes("0%") && s.includes("utilization")) ||
        (s.includes("zero") && s.includes("utilization")) ||
        s.includes("is 0% utilization bad") ||
        s.includes("no utilization") ||
        (s.includes("utilization") && s.includes("too low"))
      );
    },
    answer: () => `**Is 0% utilization bad?** It's not ideal, but not terrible either.

**The 0% Utilization Myth:**
Many believe you need to carry a balance to build credit. This is **false**. You should pay your balance in full.

However, there's a nuance:

**0% reported utilization** (all cards show $0 balance) can slightly lower your score compared to a small balance because:
• Scoring models like to see you're actively using credit responsibly
• It shows lenders you can manage credit, not just have it

**Optimal approach:**
• Let a small balance (1-5%) post to your statement
• Then pay it in full by the due date
• You pay **zero interest** but show some utilization

**Example:**
1. Make purchases during the month
2. Wait for statement to close (small balance reports)
3. Pay statement balance in full by due date
4. Result: Low utilization reported, no interest paid

**Bottom line:** 0% is better than high utilization, but 1-9% is ideal.`,
    confidence: 0.95,
  },

  // Utilization Reporting Timing vs Payment Timing
  {
    id: "utilization_timing",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        (s.includes("when") && s.includes("utilization") && s.includes("report")) ||
        (s.includes("statement") && s.includes("close") && s.includes("pay")) ||
        s.includes("before statement closes") ||
        s.includes("when does utilization get reported") ||
        (s.includes("pay") && s.includes("before") && s.includes("after") && s.includes("statement"))
      );
    },
    answer: () => `**When is utilization reported to credit bureaus?**

Utilization is typically reported on your **statement closing date**, NOT your payment due date. This is crucial for optimizing your credit score.

**Timeline:**
1. **Statement Closes** → Balance is reported to bureaus
2. **Grace Period** (21-25 days)
3. **Payment Due Date** → Deadline to avoid interest

**To optimize your score:**
Pay down your balance **BEFORE** your statement closes. This way:
• A lower balance gets reported
• Your utilization looks better
• You still get a statement to pay off

**To avoid interest:**
Pay the statement balance **BY** the due date.

**Pro strategy (do both):**
1. Pay most of your balance a few days before statement closes
2. Let a small amount (1-5%) post to the statement
3. Pay the remaining statement balance by the due date

This gives you: **Low reported utilization + zero interest + on-time payment history**`,
    confidence: 0.95,
  },

  // Credit Cycling
  {
    id: "credit_cycling",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("credit cycling") ||
        (s.includes("pay") && s.includes("multiple times") && s.includes("month")) ||
        (s.includes("frequent") && s.includes("payment") && s.includes("utilization")) ||
        (s.includes("high spend") && s.includes("pay down")) ||
        s.includes("paying off before statement")
      );
    },
    answer: () => `**Credit Cycling** is the practice of making multiple payments within a billing cycle to free up credit and keep utilization low.

**How it works:**
1. Spend on your card
2. Pay off before statement closes
3. Spend again
4. Result: High spending, low reported utilization

**Benefits:**
• Keep utilization low even with high spending
• Useful when spending exceeds your credit limit
• Maintains good credit score

**Potential concerns:**
• Some issuers may flag excessive cycling as unusual activity
• Could trigger fraud alerts if extreme
• May be seen as sign of financial stress by some lenders

**Best practices:**
• Keep it reasonable – 1-2 extra payments per month is fine
• Don't cycle more than 2-3x your credit limit monthly
• If you need to cycle heavily, consider asking for a credit limit increase instead

**For credit score purposes:**
Making multiple payments is perfectly fine and often beneficial. What matters is the balance reported on your statement date.`,
    confidence: 0.93,
  },

  // Balance Transfers
  {
    id: "balance_transfer",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("balance transfer") ||
        (s.includes("transfer") && s.includes("balance") && (s.includes("credit") || s.includes("card")))
      );
    },
    answer: () => `**Balance Transfers** move debt from one card to another, typically to take advantage of a lower interest rate.

**How they affect your credit:**

**Utilization Impact:**
• The balance moves from Card A to Card B
• Your **total** utilization stays the same
• Per-card utilization changes (one up, one down)
• New card with high utilization could slightly hurt score

**Hard Inquiry:**
• If you open a new card for the transfer: small temporary score drop
• If transferring to existing card: no inquiry

**Average Age of Accounts:**
• New card lowers your average age
• Temporary negative impact

**Best practices:**
• Don't close the old card after transfer (hurts utilization and age)
• Have a payoff plan before the promo rate expires
• Factor in transfer fees (typically 3-5%)
• Don't make new purchases on the transfer card (payments apply to promo balance first)

**Promo APR:**
• Usually 0% for 12-21 months
• After promo ends, rate jumps to regular APR (often 20%+)
• Pay off before promo ends!`,
    confidence: 0.93,
  },

  // Promotional vs Regular APR
  {
    id: "promo_vs_regular_apr",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        (s.includes("promo") && s.includes("apr")) ||
        (s.includes("promotional") && (s.includes("rate") || s.includes("apr"))) ||
        (s.includes("0%") && (s.includes("apr") || s.includes("intro"))) ||
        s.includes("introductory apr") ||
        s.includes("intro rate")
      );
    },
    answer: () => `**Promotional APR vs Regular APR**

**Promotional/Intro APR:**
• Usually 0% for a limited time (12-21 months)
• Applies to purchases, balance transfers, or both
• Requires on-time payments to maintain
• Ends on a specific date

**Regular APR:**
• Your normal interest rate after promo ends
• Typically 18-29% depending on creditworthiness
• Variable rate (changes with prime rate)
• Applied to any remaining balance after promo

**Important rules:**

**To keep your promo rate:**
• Pay at least the minimum on time every month
• One late payment can void the promo immediately
• Rate jumps to penalty APR (often 29%+)

**What happens when promo ends:**
• Regular APR applies to remaining balance
• Interest starts accruing immediately
• No grace period on existing balance

**Strategy:**
1. Calculate total balance ÷ months of promo = monthly payment needed
2. Set up autopay for that amount
3. Pay off completely before promo expires`,
    confidence: 0.93,
  },

  // Deferred Interest
  {
    id: "deferred_interest",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("deferred interest") ||
        (s.includes("no interest if paid") && s.includes("full")) ||
        s.includes("retroactive interest") ||
        (s.includes("store card") && s.includes("interest")) ||
        s.includes("same as cash")
      );
    },
    answer: () => `**Deferred Interest** is NOT the same as 0% APR – it's a trap if you're not careful.

**How it works:**
• "No interest if paid in full within X months"
• Interest accrues from day one but is **deferred**
• If you pay in full before deadline: no interest charged
• If ANY balance remains: **ALL** deferred interest is charged retroactively

**Example:**
• $1,000 purchase with 12-month deferred interest at 26% APR
• Interest accrues: ~$260 over 12 months
• Pay $999 by deadline → You owe the original $1 PLUS $260 in interest!

**Common with:**
• Store credit cards (furniture, electronics, etc.)
• Medical financing (CareCredit)
• "Same as cash" offers

**0% APR is different:**
• No interest accrues during promo period
• After promo, interest only applies to remaining balance
• Much safer than deferred interest

**Protection tips:**
1. Know which type you have
2. Set reminders before deadline
3. Pay in full at least a week early
4. Make more than minimum payments monthly`,
    confidence: 0.94,
  },

  // Closing vs Downgrading a Card
  {
    id: "closing_vs_downgrading",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("close card") ||
        s.includes("closing a card") ||
        s.includes("cancel card") ||
        s.includes("downgrade card") ||
        s.includes("product change") ||
        (s.includes("close") && s.includes("credit card"))
      );
    },
    answer: () => `**Closing vs Downgrading a Credit Card**

**Effects of CLOSING a card:**

**Immediate impacts:**
• Reduces total credit limit → increases utilization
• Could significantly hurt score if high-limit card

**Long-term impacts:**
• Account stays on report for ~10 years
• Eventually falls off, reducing average age
• Hurts length of credit history over time

**When closing might make sense:**
• High annual fee with no offsetting value
• Temptation to overspend
• Simplifying finances

**DOWNGRADING (Product Change) is often better:**

**Benefits:**
• Keep the credit limit → utilization unchanged
• Keep the account age
• Usually no credit inquiry
• Avoid annual fee by switching to no-fee version

**Common downgrades:**
• Chase Sapphire Reserve → Freedom Flex
• Amex Platinum → Amex Green (or cancel)
• Citi Premier → Citi Double Cash

**Best strategy:**
1. Call issuer and ask about no-annual-fee options
2. Downgrade before annual fee posts
3. Keep the account open for credit history
4. Only close if no downgrade available AND the account is newer`,
    confidence: 0.94,
  },

  // Credit Limit Decrease Effect
  {
    id: "credit_limit_decrease",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("credit limit decrease") ||
        s.includes("limit decreased") ||
        s.includes("reduced credit limit") ||
        s.includes("lowered my limit") ||
        s.includes("cut my credit limit")
      );
    },
    answer: () => `**How Credit Limit Decreases Affect Your Score**

**Immediate impact:**
• Your credit utilization increases instantly
• Example: $1,000 balance on $10,000 limit = 10%
• After cut to $5,000 limit = 20% (same balance!)
• Could drop your score by 10-50+ points

**Why issuers decrease limits:**
• Inactivity on the card
• Missed payments (on any account)
• High utilization elsewhere
• Economy/risk concerns (happened widely in 2020)
• Lower income reported

**What to do if it happens:**

**Short-term:**
• Pay down balances to restore low utilization
• Don't close the card (makes utilization worse)

**To request reversal:**
• Call issuer and ask politely
• Explain good payment history
• Note any temporary circumstances

**Prevention:**
• Use each card at least once every 6-12 months
• Keep utilization low across all cards
• Maintain good payment history everywhere
• Update income when it increases

**Note:** The decrease itself isn't reported – only the resulting higher utilization is.`,
    confidence: 0.93,
  },

  // Statement Balance vs Due Date
  {
    id: "statement_vs_due_date",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        (s.includes("statement") && s.includes("due date")) ||
        (s.includes("statement balance") && s.includes("vs")) ||
        s.includes("difference between statement and due") ||
        (s.includes("pay") && s.includes("statement") && s.includes("close"))
      );
    },
    answer: () => `Your **statement balance** and **due date** serve different purposes:

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
  },

  // Minimum Payment
  {
    id: "minimum_payment",
    matchers: (q) => {
      const s = q.toLowerCase();
      return s.includes("minimum payment");
    },
    answer: () => `The **minimum payment** is the smallest amount you must pay by your due date to keep your account in good standing. However, paying only the minimum is costly:

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
  },

  // Grace Period
  {
    id: "grace_period",
    matchers: (q) => {
      const s = q.toLowerCase();
      return s.includes("grace period");
    },
    answer: () => `The **grace period** is the time between your statement closing date and your payment due date when you can pay your balance **without incurring interest**.

**Key points:**
• Typically **21-25 days** (required by law to be at least 21 days)
• **Only applies if you paid your previous balance in full**
• If you carry a balance from the previous month, there is **no grace period** – interest accrues immediately on new purchases

**How to maintain your grace period:**
1. Pay your statement balance in full by the due date every month
2. Once you carry a balance, you lose the grace period until you pay in full for a complete billing cycle

**Pro tip:** If you've lost your grace period, make a payment equal to your full statement balance to restore it for the next cycle.`,
    confidence: 0.95,
  },

  // APR / Interest Mechanics
  {
    id: "apr_mechanics",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        ((s.includes("apr") || s.includes("interest")) && 
         (s.includes("work") || s.includes("charge") || s.includes("avoid") || s.includes("calculated"))) &&
        !ISSUER_KEYWORDS.some(kw => s.includes(kw))
      );
    },
    answer: () => `**APR (Annual Percentage Rate)** is the yearly interest rate charged on carried balances. Here's how it works:

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
  },

  // Credit Score Factors
  {
    id: "credit_score_factors",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        ((s.includes("credit score") && (s.includes("affect") || s.includes("impact") || s.includes("factor"))) ||
         s.includes("what affects my score") ||
         s.includes("how is credit score calculated")) &&
        !ISSUER_KEYWORDS.some(kw => s.includes(kw))
      );
    },
    answer: () => `Your **credit score** is affected by five main factors (FICO model):

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
  },

  // Billing Cycle / Statement Closing
  {
    id: "billing_cycle",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("statement closing date") ||
        s.includes("billing cycle") ||
        s.includes("when does statement close")
      );
    },
    answer: () => `Your **billing cycle** and **statement closing date** are key to understanding your credit card:

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
  },

  // ========== TIER B: IMPORTANT TOPICS ==========

  // Charge Cards vs Credit Cards
  {
    id: "charge_vs_credit_card",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("charge card") ||
        (s.includes("no preset") && s.includes("limit")) ||
        s.includes("npsl") ||
        (s.includes("pay in full") && s.includes("card"))
      );
    },
    answer: () => `**Charge Cards vs Credit Cards**

**Credit Cards:**
• Have a fixed credit limit
• Can carry a balance (with interest)
• Report utilization to bureaus
• Minimum payment required

**Charge Cards:**
• No preset spending limit (NPSL)
• Must pay in full each month
• Don't report to utilization calculations
• Late payment = fees + potential cancellation

**Utilization Impact:**
• Charge cards often don't count toward utilization ratios
• Some scoring models ignore them entirely
• This can be beneficial if you spend heavily

**Popular charge cards:**
• Amex Platinum (charge card)
• Amex Gold (charge card)
• Amex Green (charge card)

**Note:** Some "charge cards" now offer Pay Over Time features, making them hybrids. When you use Pay Over Time, that portion may be reported like a credit card.`,
    confidence: 0.92,
  },

  // Business Cards and Personal Credit
  {
    id: "business_cards_personal_credit",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        (s.includes("business card") && (s.includes("personal") || s.includes("credit report"))) ||
        s.includes("do business cards report") ||
        s.includes("business credit card personal score")
      );
    },
    answer: () => `**Do Business Cards Affect Personal Credit?**

**General rule:**
Most business cards do NOT report to personal credit bureaus – but there are exceptions.

**Issuers that DON'T report to personal:**
• Chase (Ink cards)
• Amex (Business cards)
• Citi (Business cards)
• US Bank
• Wells Fargo

**Issuers that DO report to personal:**
• Capital One
• Discover
• Some small business lenders

**What DOES show up:**
• The hard inquiry when you apply
• The account, if you become delinquent (all issuers report defaults)

**Benefits of non-reporting:**
• High business spending doesn't affect personal utilization
• Can help separate business and personal finances
• Useful for high-spend businesses

**Caution:**
• You're still personally liable for the debt
• Late payments can still eventually hurt personal credit
• Defaults are reported regardless of issuer`,
    confidence: 0.91,
  },

  // Secured Cards
  {
    id: "secured_cards",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("secured card") ||
        s.includes("secured credit card") ||
        (s.includes("deposit") && s.includes("credit card"))
      );
    },
    answer: () => `**Secured Credit Cards** require a cash deposit that serves as your credit limit.

**How they work:**
• You deposit $200-$500+ upfront
• Your deposit = your credit limit
• Works like a regular credit card otherwise
• Activity is reported to credit bureaus

**Who they're for:**
• Building credit from scratch
• Rebuilding after bankruptcy or collections
• No or limited credit history

**Key benefits:**
• Easier approval than unsecured cards
• Helps establish payment history
• Can graduate to unsecured card over time
• Deposit is refundable when you close or upgrade

**Tips for success:**
• Use for small purchases you can pay off monthly
• Pay in full every month to avoid interest
• Keep utilization under 30%
• Many issuers review for graduation after 6-12 months

**Good secured cards:**
• Look for ones with no annual fee
• Ensure they report to all 3 bureaus
• Check for graduation path to unsecured`,
    confidence: 0.92,
  },

  // Store Cards
  {
    id: "store_cards",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("store card") ||
        s.includes("retail card") ||
        s.includes("store credit card")
      );
    },
    answer: () => `**Store Credit Cards** – Pros, Cons, and Impact

**Typical features:**
• 10-25% discount on first purchase
• Ongoing rewards at that retailer
• Often higher APRs (25-30%)
• Lower credit limits ($500-$2,000)

**Impact on credit score:**

**Potential negatives:**
• Hard inquiry reduces score temporarily
• Low limit can mean high utilization quickly
• Closing them hurts average age

**Potential positives:**
• Adds to credit mix
• Builds payment history
• Can help establish credit

**Store cards vs regular cards:**
• Store cards usually only work at one retailer
• Regular cards often earn more overall value
• Store cards have higher APRs

**When they make sense:**
• You shop there frequently
• You'll pay in full monthly
• The sign-up discount is substantial
• You won't be tempted to overspend

**Watch out for:**
• Deferred interest offers (not same as 0% APR)
• Temptation to overspend for rewards
• High APR if you carry a balance`,
    confidence: 0.91,
  },

  // Student Cards
  {
    id: "student_cards",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("student card") ||
        s.includes("student credit card") ||
        (s.includes("college") && s.includes("credit card"))
      );
    },
    answer: () => `**Student Credit Cards** are designed for college students with limited or no credit history.

**Typical features:**
• No credit history required
• Lower credit limits ($500-$1,500)
• Few or no rewards
• Some offer good grades bonuses
• No annual fee

**Benefits for students:**
• Start building credit history early
• Easier approval than regular cards
• Designed for responsible first-time use
• May graduate to better cards later

**Best practices:**
• Use for small, regular purchases (gas, groceries)
• Pay in full every month
• Keep utilization under 30%
• Set up autopay for at least minimum
• Don't carry a balance – APRs are high

**What to look for:**
• Reports to all 3 credit bureaus
• No annual fee
• Reasonable APR
• Path to upgrade after graduation

**Common student cards:**
• Discover it Student
• Capital One Journey
• Bank of America Travel Rewards for Students

**Pro tip:** Building good habits now creates a strong credit foundation for after graduation.`,
    confidence: 0.91,
  },

  // Hard vs Soft Inquiries
  {
    id: "hard_soft_inquiry",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("hard pull") ||
        s.includes("soft pull") ||
        s.includes("hard inquiry") ||
        s.includes("soft inquiry") ||
        (s.includes("inquiry") && (s.includes("credit") || s.includes("score")))
      );
    },
    answer: () => `**Hard Inquiries vs Soft Inquiries**

**Hard Inquiries:**
• Occur when you apply for credit
• Temporarily lower score by ~5-10 points
• Stay on report for 2 years
• Only affect score for 12 months
• Lenders can see them

**Examples of hard pulls:**
• Credit card applications
• Loan applications (auto, mortgage, personal)
• Apartment rental applications (sometimes)

**Soft Inquiries:**
• Don't affect your score at all
• Not visible to lenders
• Only you can see them on your report

**Examples of soft pulls:**
• Checking your own credit
• Pre-approval offers
• Background checks by employers
• Credit monitoring services

**Rate shopping protection:**
For mortgages, auto loans, and student loans, multiple inquiries within 14-45 days count as ONE inquiry for scoring purposes.

**Tips:**
• Don't apply for multiple cards in a short period
• Hard inquiries matter less if you have strong credit
• Focus on other factors – inquiries have smaller impact`,
    confidence: 0.93,
  },

  // Authorized User
  {
    id: "authorized_user",
    matchers: (q) => {
      const s = q.toLowerCase();
      return (
        s.includes("authorized user") ||
        s.includes("add someone to my card") ||
        s.includes("being added to card")
      );
    },
    answer: () => `**Authorized Users** – How It Affects Credit

**What is an authorized user?**
Someone added to another person's credit card account who can use the card but isn't responsible for payments.

**How it affects the authorized user's credit:**

**Positive impacts:**
• The account's full history may appear on your report
• Payment history from primary cardholder counts
• Can build credit without applying for own card
• Utilization of that card counts (if low, it helps)

**Requirements for benefit:**
• The issuer must report authorized users (most do)
• The primary account must be in good standing
• Works best with older accounts with perfect payment history

**Risks:**

**For authorized user:**
• If primary misses payments, it hurts your credit
• High utilization on card affects your utilization
• Some lenders may discount AU accounts when lending

**For primary cardholder:**
• Authorized user can spend on your card
• You're responsible for all charges
• Their spending affects your utilization

**Strategic use:**
• Parents adding children to build early credit
• Spouse sharing credit history
• Choose cards with low utilization and long history`,
    confidence: 0.92,
  },
];

// Check if question needs hybrid handling (deterministic + RAG)
function needsHybridAnswer(q: string): boolean {
  const s = q.toLowerCase();
  
  // Has both a deterministic topic AND an issuer/specific reference
  const hasDeterministicTopic = DETERMINISTIC_RULES.some(rule => rule.matchers(q));
  const hasIssuerReference = ISSUER_KEYWORDS.some(kw => s.includes(kw));
  
  return hasDeterministicTopic && hasIssuerReference;
}

// Get best matching deterministic rule
function getMatchingDeterministicRule(q: string): DeterministicRule | null {
  for (const rule of DETERMINISTIC_RULES) {
    if (rule.matchers(q)) {
      return rule;
    }
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
  if (ISSUER_KEYWORDS.some(kw => lowerQ.includes(kw))) {
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
  openaiKey: string,
  isHybridSupplement: boolean = false
): Promise<string> {
  const basePrompt = isHybridSupplement
    ? `You are supplementing an already-correct general explanation with issuer-specific or regulatory nuance only.

The user has already received a complete answer about the general credit concept. Your job is ONLY to add:
1. Issuer-specific details that differ from the general rule
2. Any regulatory nuances that apply

CONTEXT FROM TRUSTED SOURCES:
${context || "No relevant context available."}

RULES:
1. Do NOT repeat the general explanation - it's already been provided.
2. Start with "**Issuer-specific note:**" or similar.
3. If context is insufficient for issuer-specific details, say "I couldn't verify specific details about [issuer]. Check their website for the most accurate information."
4. Keep response brief - 1-2 paragraphs max.
5. Be conservative and don't make up issuer-specific details.`
    : `You are CardClutch's credit expert assistant. You provide accurate, helpful information about credit cards, credit scores, and personal finance.

CONTEXT FROM TRUSTED SOURCES:
${context || "No relevant context available."}

RULES:
1. For UNIVERSALLY ESTABLISHED credit concepts (utilization, payment timing, interest mechanics, score factors), provide confident answers even without context.
2. For ISSUER-SPECIFIC details (specific card terms, current rates, specific policies), ONLY use the provided context. If context is insufficient, say "I don't have specific details about that" and recommend checking the issuer's website.
3. NEVER hallucinate or make up specific numbers, rates, or product details.
4. Be conservative and safe with financial advice. Use phrases like "generally" and "typically".
5. Do NOT provide legal, tax, or investment advice.
6. Keep answers concise but complete (2-4 paragraphs max).
7. Cite your sources when possible using the source titles from context.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      messages: [
        { role: "system", content: basePrompt },
        { role: "user", content: question },
      ],
      temperature: 0.3,
      max_completion_tokens: isHybridSupplement ? 400 : 800,
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

  // Initialize metrics - MANDATORY fields for Admin Dashboard
  const metrics: RequestMetrics = {
    route: "error",
    intent: "unknown",
    deterministic_hit: false,
    embedding_tokens: null,
    chat_tokens: null,
    pinecone_hits: 0,
    latency_ms: 0,
    model: "none",
    cost_estimate_usd: null,
  };

  // Helper to create error responses
  const errorResponse = (status: number, message: string, retryAfter?: number) => {
    const headers: Record<string, string> = { ...corsHeaders, "Content-Type": "application/json" };
    if (retryAfter) headers["Retry-After"] = String(retryAfter);
    metrics.route = "error";
    metrics.latency_ms = Date.now() - startTime;
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
    const intent = classifyIntent(question);

    // =====================================================================
    // ROUTING DECISION: Deterministic → Hybrid → RAG
    // =====================================================================

    const matchingRule = getMatchingDeterministicRule(question);
    const isHybridQuestion = needsHybridAnswer(question);

    // =====================================================================
    // PATH 1: Pure DETERMINISTIC (0 tokens)
    // =====================================================================
    if (matchingRule && !isHybridQuestion) {
      const answer = matchingRule.answer(question);
      
      // Increment rate limit
      await incrementRateLimit(supabase, bucket, "ask_credit_question");
      
      // Populate metrics - deterministic path = zero AI tokens
      metrics.route = "deterministic";
      metrics.intent = "credit_education";
      metrics.deterministic_hit = true;
      metrics.embedding_tokens = null;
      metrics.chat_tokens = null;
      metrics.pinecone_hits = 0;
      metrics.latency_ms = Date.now() - startTime;
      metrics.model = "internal_rules";
      metrics.cost_estimate_usd = 0;
      
      // Log query for audit with complete metrics
      try {
        await supabase.from("rag_queries").insert({
          user_id: userId,
          ip_hash: ipHash,
          question,
          intent: "credit_education",
          retrieved_chunks: {
            metrics: metrics,
            rule_id: matchingRule.id,
          },
          answer,
          confidence: matchingRule.confidence,
          model: "internal_rules",
          latency_ms: metrics.latency_ms,
          include_citations: include_citations || false,
        });
      } catch (logError) {
        console.error("Failed to log deterministic query:", logError);
      }

      return new Response(
        JSON.stringify({
          answer,
          confidence: matchingRule.confidence,
          intent: "credit_education",
          source: "internal_rules",
          latency_ms: metrics.latency_ms,
          route: "deterministic",
          followups: [
            "How do hard inquiries affect my score?",
            "What's the best way to build credit?",
          ],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =====================================================================
    // PATH 2: HYBRID (deterministic core + RAG supplement)
    // =====================================================================
    if (matchingRule && isHybridQuestion) {
      // Get deterministic core answer first
      const coreAnswer = matchingRule.answer(question);
      let supplementAnswer = "";
      let citations: Citation[] = [];
      let hybridConfidence = matchingRule.confidence;
      let pineconeHits = 0;
      let embeddingTokens: number | null = null;
      let chatTokens: number | null = null;

      // Try to get RAG supplement
      let embedding: number[] | null = null;
      let context = "";

      if (pineconeHost && pineconeKey) {
        try {
          embedding = await getEmbedding(question, openaiKey);
          embeddingTokens = estimateTokens(question);
        } catch (e) {
          const err = e as Error & { httpCode?: number };
          if (err.httpCode === 402 || err.httpCode === 503) {
            // Continue without RAG supplement
            console.error("Embedding error in hybrid (continuing with core only):", err.message);
          } else {
            console.error("Embedding error (continuing without RAG):", err.message);
          }
        }

        if (embedding) {
          try {
            const matches = await queryPinecone(embedding, pineconeHost, pineconeKey);
            pineconeHits = matches.length;
            const result = buildContextFromMatches(matches);
            context = result.context;
            citations = result.citations;
          } catch (e) {
            console.error("Pinecone error (continuing without supplement):", e);
          }
        }

        // Generate supplement if we have context
        if (context) {
          try {
            supplementAnswer = await generateAnswer(question, context, intent, openaiKey, true);
            const chatInputTokens = estimateTokens(question + context);
            const chatOutputTokens = estimateTokens(supplementAnswer);
            chatTokens = chatInputTokens + chatOutputTokens;
          } catch (e) {
            const err = e as Error & { httpCode?: number };
            console.error("Chat error in hybrid (continuing with core only):", err.message);
            // Continue with just the core answer
          }
        } else {
          // No RAG context - add note about issuer specifics
          supplementAnswer = "\n\n**Issuer-specific note:** I couldn't verify specific details about this issuer's policies. For the most accurate information, please check directly with the card issuer's website.";
          hybridConfidence = Math.max(0.75, hybridConfidence - 0.1);
        }
      }

      await incrementRateLimit(supabase, bucket, "ask_credit_question");

      // Populate metrics for hybrid path
      metrics.route = "hybrid";
      metrics.intent = intent;
      metrics.deterministic_hit = true; // Hybrid still has deterministic core
      metrics.embedding_tokens = embeddingTokens;
      metrics.chat_tokens = chatTokens;
      metrics.pinecone_hits = pineconeHits;
      metrics.latency_ms = Date.now() - startTime;
      metrics.model = context ? `internal_rules+${OPENAI_CHAT_MODEL}` : "internal_rules";
      metrics.cost_estimate_usd = calculateCost(
        embeddingTokens || 0,
        chatTokens ? chatTokens * 0.6 : 0, // Approximate input
        chatTokens ? chatTokens * 0.4 : 0  // Approximate output
      );

      const finalAnswer = coreAnswer + (supplementAnswer ? "\n\n---\n\n" + supplementAnswer : "");

      try {
        await supabase.from("rag_queries").insert({
          user_id: userId,
          ip_hash: ipHash,
          question,
          intent,
          retrieved_chunks: {
            metrics: metrics,
            rule_id: matchingRule.id,
            citations: citations.map(c => ({ title: c.title, url: c.url, relevance: c.relevance })),
          },
          answer: finalAnswer,
          confidence: hybridConfidence,
          model: metrics.model,
          latency_ms: metrics.latency_ms,
          include_citations: include_citations || false,
        });
      } catch (logError) {
        console.error("Failed to log hybrid query:", logError);
      }

      const response: Record<string, unknown> = {
        answer: finalAnswer,
        confidence: hybridConfidence,
        intent,
        source: "hybrid",
        latency_ms: metrics.latency_ms,
        route: "hybrid",
      };

      if (include_citations && citations.length > 0) {
        response.citations = citations;
      }

      response.followups = [
        "What other issuers have different policies?",
        "How can I check my own card's terms?",
      ];

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =====================================================================
    // PATH 3: Full RAG (complex/issuer-specific questions)
    // =====================================================================

    let embedding: number[] | null = null;
    let context = "";
    let citations: Citation[] = [];
    let pineconeHits = 0;
    let embeddingTokens: number | null = null;
    let chatInputTokens = 0;
    let chatOutputTokens = 0;

    try {
      embedding = await getEmbedding(question, openaiKey);
      embeddingTokens = estimateTokens(question);
    } catch (e) {
      const err = e as Error & { httpCode?: number };
      if (err.httpCode === 402 || err.httpCode === 503) {
        return errorResponse(err.httpCode, err.message, err.httpCode === 503 ? 30 : undefined);
      }
      console.error("Embedding error (continuing without RAG):", err.message);
    }

    if (embedding && pineconeHost && pineconeKey) {
      try {
        const matches = await queryPinecone(embedding, pineconeHost, pineconeKey);
        pineconeHits = matches.length;
        const result = buildContextFromMatches(matches);
        context = result.context;
        citations = result.citations;
      } catch (e) {
        console.error("Pinecone error (continuing without RAG):", e);
      }
    }

    let answer: string;
    try {
      answer = await generateAnswer(question, context, intent, openaiKey);
      chatInputTokens = estimateTokens(question + context);
      chatOutputTokens = estimateTokens(answer);
    } catch (e) {
      const err = e as Error & { httpCode?: number };
      if (err.httpCode) {
        return errorResponse(err.httpCode, err.message, err.httpCode === 503 ? 30 : undefined);
      }
      return errorResponse(500, "Failed to generate answer. Please try again.");
    }

    // Calculate confidence
    let confidence = 0.5;
    if (context) {
      const avgRelevance = citations.length > 0 
        ? citations.reduce((sum, c) => sum + c.relevance, 0) / citations.length
        : 0;
      confidence = Math.min(0.95, 0.6 + avgRelevance * 0.35);
    }
    if (intent === "credit_education" && context) {
      confidence = Math.min(0.95, confidence + 0.1);
    }

    await incrementRateLimit(supabase, bucket, "ask_credit_question");

    // Populate metrics for RAG path
    metrics.route = "rag";
    metrics.intent = intent;
    metrics.deterministic_hit = false;
    metrics.embedding_tokens = embeddingTokens;
    metrics.chat_tokens = chatInputTokens + chatOutputTokens;
    metrics.pinecone_hits = pineconeHits;
    metrics.latency_ms = Date.now() - startTime;
    metrics.model = OPENAI_CHAT_MODEL;
    metrics.cost_estimate_usd = calculateCost(
      embeddingTokens || 0,
      chatInputTokens,
      chatOutputTokens
    );

    try {
      await supabase.from("rag_queries").insert({
        user_id: userId,
        ip_hash: ipHash,
        question,
        intent,
        retrieved_chunks: {
          metrics: metrics,
          citations: citations.map(c => ({ title: c.title, url: c.url, relevance: c.relevance })),
        },
        answer,
        confidence,
        model: OPENAI_CHAT_MODEL,
        latency_ms: metrics.latency_ms,
        include_citations: include_citations || false,
      });
    } catch (logError) {
      console.error("Failed to log query:", logError);
    }

    const response: Record<string, unknown> = {
      answer,
      confidence,
      intent,
      latency_ms: metrics.latency_ms,
      route: "rag",
    };

    if (include_citations && citations.length > 0) {
      response.citations = citations;
    }

    const followups: string[] = [];
    if (intent === "credit_education") {
      followups.push("How can I improve my credit score?", "What's the ideal credit utilization ratio?");
    } else if (intent === "card_rewards") {
      followups.push("Which card is best for dining?", "How do I maximize travel rewards?");
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
    
    const err = error as Error & { httpCode?: number };
    const httpCode = err.httpCode || 500;
    const message = err.message || "An unexpected error occurred. Please try again.";

    // Populate error metrics
    metrics.route = "error";
    metrics.intent = "error";
    metrics.deterministic_hit = false;
    metrics.latency_ms = Date.now() - startTime;
    metrics.model = "none";
    metrics.cost_estimate_usd = 0;

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from("rag_queries").insert({
        question: "ERROR",
        answer: message,
        confidence: 0,
        error: message,
        latency_ms: metrics.latency_ms,
        retrieved_chunks: { metrics },
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    // NEVER return 500 for user-facing errors - map to friendly codes
    const userFacingCode = httpCode === 500 ? 503 : httpCode;

    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: userFacingCode, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
