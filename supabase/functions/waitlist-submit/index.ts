/**
 * Waitlist Submit Edge Function
 * Server-side rate limiting + validation for waitlist signups
 */
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit config
const RATE_LIMIT = {
  maxPerMinute: 5,
  maxPerDay: 20,
  windowMinute: 60 * 1000,
  windowDay: 24 * 60 * 60 * 1000,
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

interface RateLimitCheck {
  allowed: boolean;
  retryAfterSeconds?: number;
}

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
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) {
    return cfIP.trim();
  }
  return "unknown";
}

async function checkRateLimit(
  supabase: SupabaseClient,
  bucket: string,
  scope: string,
  maxCount: number,
  windowMs: number
): Promise<RateLimitCheck> {
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
      const retryAfterSeconds = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000);
      return { allowed: false, retryAfterSeconds };
    }
  }

  const currentCount = row?.count || 0;
  if (currentCount >= maxCount) {
    const retryAfterSeconds = Math.ceil(windowMs / 1000);
    return { allowed: false, retryAfterSeconds };
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

async function logSecurityEvent(
  supabase: SupabaseClient,
  eventType: string,
  ipHash: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("security_events").insert({
      event_type: eventType,
      ip_hash: ipHash,
      metadata,
    });
  } catch (e) {
    console.error("Failed to log security event:", e);
  }
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const rateLimitSalt = Deno.env.get("RATE_LIMIT_SALT") || "default-salt-change-me";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get and hash client IP
    const clientIP = getClientIP(req);
    const ipHash = await hashIP(clientIP, rateLimitSalt);
    const ipBucket = `ip:${ipHash}`;

    // Check rate limits
    const minuteCheck = await checkRateLimit(
      supabase,
      ipBucket,
      "waitlist_minute",
      RATE_LIMIT.maxPerMinute,
      RATE_LIMIT.windowMinute
    );

    if (!minuteCheck.allowed) {
      await logSecurityEvent(supabase, "rate_limit_triggered", ipHash, {
        scope: "waitlist_submit",
        window: "minute",
      });
      
      return new Response(
        JSON.stringify({
          error: "rate_limited",
          message: "Too many requests. Please try again soon.",
          retry_after_seconds: minuteCheck.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(minuteCheck.retryAfterSeconds),
          },
        }
      );
    }

    const dayCheck = await checkRateLimit(
      supabase,
      ipBucket,
      "waitlist_day",
      RATE_LIMIT.maxPerDay,
      RATE_LIMIT.windowDay
    );

    if (!dayCheck.allowed) {
      await logSecurityEvent(supabase, "rate_limit_triggered", ipHash, {
        scope: "waitlist_submit",
        window: "day",
      });
      
      return new Response(
        JSON.stringify({
          error: "rate_limited",
          message: "Daily limit reached. Please try again tomorrow.",
          retry_after_seconds: dayCheck.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(dayCheck.retryAfterSeconds),
          },
        }
      );
    }

    // Parse and validate request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Honeypot check - if filled, silently "succeed"
    if (body.website && typeof body.website === "string" && body.website.length > 0) {
      console.log("Honeypot triggered");
      return new Response(
        JSON.stringify({ success: true, message: "You're on the list!" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email
    const email = body.email;
    if (!email || typeof email !== "string") {
      await logSecurityEvent(supabase, "validation_failed", ipHash, {
        scope: "waitlist_submit",
        reason: "missing_email",
      });
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      await logSecurityEvent(supabase, "validation_failed", ipHash, {
        scope: "waitlist_submit",
        reason: "email_too_long",
      });
      return new Response(
        JSON.stringify({ error: "Email is too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      await logSecurityEvent(supabase, "validation_failed", ipHash, {
        scope: "waitlist_submit",
        reason: "invalid_email_format",
      });
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate optional fields
    const utmSource = typeof body.utm_source === "string" ? body.utm_source.slice(0, 100) : null;
    const utmCampaign = typeof body.utm_campaign === "string" ? body.utm_campaign.slice(0, 100) : null;
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null;

    // Insert into database
    const { error: insertError } = await supabase.from("waitlist_subscribers").insert({
      email: trimmedEmail,
      utm_source: utmSource,
      utm_campaign: utmCampaign,
      referrer: referrer,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        // Duplicate email - treat as success for UX
        return new Response(
          JSON.stringify({ success: true, message: "You're already on the list!", duplicate: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Waitlist insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to join waitlist. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment rate limit counters on success
    await incrementRateLimit(supabase, ipBucket, "waitlist_minute");
    await incrementRateLimit(supabase, ipBucket, "waitlist_day");

    return new Response(
      JSON.stringify({ success: true, message: "Welcome to the waitlist!" }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Waitlist submit error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
