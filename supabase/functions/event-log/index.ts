/**
 * Event Log Edge Function
 * Server-side rate limiting + validation for analytics events
 */
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit config
const RATE_LIMIT = {
  ipPerMinute: 60,
  userPerMinute: 120,
  windowMinute: 60 * 1000,
};

// Allowed event names
const ALLOWED_EVENTS = [
  "app_open",
  "page_view",
  "recommendation_requested",
  "recommendation_returned",
  "report_submitted",
  "card_selected",
  "card_deselected",
  "admin_viewed_dashboard",
  "analyze_started",
  "analyze_success",
  "analyze_failed",
  "demo_analysis_started",
  "demo_analysis_success",
  "demo_limit_reached",
  "signup_prompt_shown",
  "signup_clicked",
  "signup_completed",
  "wallet_card_added",
  "wallet_card_removed",
];

const MAX_URL_LENGTH = 2048;
const MAX_DOMAIN_LENGTH = 255;

interface RateLimitRow {
  id: string;
  count: number;
  blocked_until: string | null;
}

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
  supabase: SupabaseClient,
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

  const row = (data as RateLimitRow[] | null)?.[0];

  if (row?.blocked_until) {
    const blockedUntil = new Date(row.blocked_until);
    if (blockedUntil > new Date()) {
      return { allowed: false, retryAfterSeconds: Math.ceil((blockedUntil.getTime() - Date.now()) / 1000) };
    }
  }

  const currentCount = row?.count || 0;
  if (currentCount >= maxCount) {
    return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  return { allowed: true };
}

async function incrementRateLimit(
  supabase: SupabaseClient,
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

function extractDomain(url: string): string | null {
  try {
    const normalized = url.includes("://") ? url : `https://${url}`;
    const urlObj = new URL(normalized);
    return urlObj.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const rateLimitSalt = Deno.env.get("RATE_LIMIT_SALT") || "default-salt-change-me";

    // Service client for rate limiting and inserts
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check for auth token
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      try {
        const { data } = await userClient.auth.getUser(token);
        userId = data?.user?.id || null;
      } catch {
        // Token invalid, proceed as anonymous
      }
    }

    // Get and hash client IP
    const clientIP = getClientIP(req);
    const ipHash = await hashIP(clientIP, rateLimitSalt);
    const ipBucket = `ip:${ipHash}`;
    const userBucket = userId ? `user:${userId}` : null;

    // Check IP rate limit
    const ipCheck = await checkRateLimit(
      supabaseAdmin,
      ipBucket,
      "event_log",
      RATE_LIMIT.ipPerMinute,
      RATE_LIMIT.windowMinute
    );

    if (!ipCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "rate_limited",
          message: "Too many requests. Please slow down.",
          retry_after_seconds: ipCheck.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(ipCheck.retryAfterSeconds),
          },
        }
      );
    }

    // Check user rate limit if authenticated
    if (userBucket) {
      const userCheck = await checkRateLimit(
        supabaseAdmin,
        userBucket,
        "event_log",
        RATE_LIMIT.userPerMinute,
        RATE_LIMIT.windowMinute
      );

      if (!userCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: "rate_limited",
            message: "Too many requests. Please slow down.",
            retry_after_seconds: userCheck.retryAfterSeconds,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": String(userCheck.retryAfterSeconds),
            },
          }
        );
      }
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate event_name
    const eventName = body.event_name;
    if (!eventName || typeof eventName !== "string") {
      return new Response(
        JSON.stringify({ error: "event_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_EVENTS.includes(eventName)) {
      return new Response(
        JSON.stringify({ error: "Invalid event_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize optional fields
    let url: string | null = null;
    if (body.url && typeof body.url === "string") {
      const trimmedUrl = body.url.trim().slice(0, MAX_URL_LENGTH);
      const lower = trimmedUrl.toLowerCase();
      if (
        !lower.startsWith("javascript:") &&
        !lower.startsWith("data:") &&
        !lower.startsWith("file:")
      ) {
        url = trimmedUrl;
      }
    }

    let domain: string | null = null;
    if (body.domain && typeof body.domain === "string") {
      domain = body.domain.trim().slice(0, MAX_DOMAIN_LENGTH).toLowerCase();
    } else if (url) {
      domain = extractDomain(url);
    }

    // Sanitize context - only allow safe JSON
    let context: Record<string, unknown> = {};
    if (body.context && typeof body.context === "object" && !Array.isArray(body.context)) {
      const contextStr = JSON.stringify(body.context);
      if (contextStr.length <= 10000) {
        context = body.context as Record<string, unknown>;
      }
    }

    // Insert event
    const { error: insertError } = await supabaseAdmin.from("analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      context,
      url,
      domain,
    });

    if (insertError) {
      console.error("Event log insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to log event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment rate limit counters
    await incrementRateLimit(supabaseAdmin, ipBucket, "event_log");
    if (userBucket) {
      await incrementRateLimit(supabaseAdmin, userBucket, "event_log");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Event log error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
