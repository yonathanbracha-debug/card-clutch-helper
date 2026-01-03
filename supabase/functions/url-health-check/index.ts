import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResult {
  card_id: string;
  url_type: "terms" | "source" | "image";
  url: string;
  status: "ok" | "redirect" | "broken" | "invalid";
  http_status: number | null;
  error_text: string | null;
}

async function checkUrl(url: string): Promise<{ status: string; httpStatus: number | null; error: string | null }> {
  if (!url) {
    return { status: "invalid", httpStatus: null, error: "URL is empty" };
  }

  // Validate URL format
  if (!url.match(/^https?:\/\//i)) {
    return { status: "invalid", httpStatus: null, error: "Invalid URL scheme" };
  }

  try {
    // Try HEAD request first (faster)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let response: Response;
    try {
      response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "manual",
      });
    } catch {
      // Fallback to GET if HEAD fails
      response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "manual",
      });
    }
    
    clearTimeout(timeoutId);

    const httpStatus = response.status;

    if (httpStatus >= 200 && httpStatus < 300) {
      return { status: "ok", httpStatus, error: null };
    } else if (httpStatus >= 300 && httpStatus < 400) {
      return { status: "redirect", httpStatus, error: `Redirects to: ${response.headers.get("location") || "unknown"}` };
    } else {
      return { status: "broken", httpStatus, error: `HTTP ${httpStatus}` };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    if (errorMessage.includes("abort")) {
      return { status: "broken", httpStatus: null, error: "Request timed out" };
    }
    return { status: "broken", httpStatus: null, error: errorMessage };
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting URL health check for admin:", user.id);

    // Fetch all active cards with URLs
    const { data: cards, error: cardsError } = await supabase
      .from("credit_cards")
      .select("id, name, source_url, terms_url, image_url")
      .eq("is_active", true);

    if (cardsError) {
      throw new Error(`Failed to fetch cards: ${cardsError.message}`);
    }

    console.log(`Checking URLs for ${cards?.length || 0} cards`);

    const results: HealthCheckResult[] = [];

    // Process cards in batches to avoid rate limiting
    for (const card of cards || []) {
      // Check source_url
      if (card.source_url) {
        const check = await checkUrl(card.source_url);
        results.push({
          card_id: card.id,
          url_type: "source",
          url: card.source_url,
          status: check.status as any,
          http_status: check.httpStatus,
          error_text: check.error,
        });
      }

      // Check terms_url
      if (card.terms_url) {
        const check = await checkUrl(card.terms_url);
        results.push({
          card_id: card.id,
          url_type: "terms",
          url: card.terms_url,
          status: check.status as any,
          http_status: check.httpStatus,
          error_text: check.error,
        });
      }

      // Check image_url
      if (card.image_url) {
        const check = await checkUrl(card.image_url);
        results.push({
          card_id: card.id,
          url_type: "image",
          url: card.image_url,
          status: check.status as any,
          http_status: check.httpStatus,
          error_text: check.error,
        });
      }

      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clear old results and insert new ones
    await supabase.from("card_url_health").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (results.length > 0) {
      const { error: insertError } = await supabase.from("card_url_health").insert(
        results.map(r => ({
          card_id: r.card_id,
          url_type: r.url_type,
          url: r.url,
          status: r.status,
          http_status: r.http_status,
          error_text: r.error_text,
          checked_at: new Date().toISOString(),
        }))
      );

      if (insertError) {
        console.error("Failed to insert results:", insertError);
      }
    }

    // Calculate summary
    const summary = {
      total: results.length,
      ok: results.filter(r => r.status === "ok").length,
      redirect: results.filter(r => r.status === "redirect").length,
      broken: results.filter(r => r.status === "broken").length,
      invalid: results.filter(r => r.status === "invalid").length,
    };

    console.log("Health check complete:", summary);

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("URL health check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
