/**
 * RAG Health Check Edge Function
 * Checks connectivity to OpenAI and Pinecone, plus knowledge base stats
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthStatus {
  overall: "healthy" | "degraded" | "unhealthy";
  openai: { status: "ok" | "error"; latency_ms?: number; error?: string };
  pinecone: { status: "ok" | "error"; latency_ms?: number; error?: string };
  knowledge_base: {
    sources_count: number;
    active_sources: number;
    error_sources: number;
    total_chunks: number;
    last_ingestion?: string;
  };
}

async function verifyAdmin(supabase: any, authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return false;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "owner"])
      .limit(1);

    return !!(roleData && roleData.length > 0);
  } catch {
    return false;
  }
}

async function checkOpenAI(apiKey: string): Promise<{ status: "ok" | "error"; latency_ms?: number; error?: string }> {
  const start = Date.now();
  
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return { status: "ok", latency_ms: latency };
    } else {
      return { status: "error", latency_ms: latency, error: `HTTP ${response.status}` };
    }
  } catch (e) {
    return { status: "error", error: e instanceof Error ? e.message : "Connection failed" };
  }
}

async function checkPinecone(host: string, apiKey: string): Promise<{ status: "ok" | "error"; latency_ms?: number; error?: string }> {
  const start = Date.now();
  
  try {
    const response = await fetch(`${host}/describe_index_stats`, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return { status: "ok", latency_ms: latency };
    } else {
      return { status: "error", latency_ms: latency, error: `HTTP ${response.status}` };
    }
  } catch (e) {
    return { status: "error", error: e instanceof Error ? e.message : "Connection failed" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const pineconeKey = Deno.env.get("PINECONE_API_KEY");
    const pineconeHost = Deno.env.get("PINECONE_HOST");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get("authorization");
    const isAdmin = await verifyAdmin(supabase, authHeader);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check services
    const openaiStatus = openaiKey 
      ? await checkOpenAI(openaiKey)
      : { status: "error" as const, error: "API key not configured" };

    const pineconeStatus = (pineconeHost && pineconeKey)
      ? await checkPinecone(pineconeHost, pineconeKey)
      : { status: "error" as const, error: "API key or host not configured" };

    // Get knowledge base stats
    const { data: sourcesData } = await supabase
      .from("knowledge_sources")
      .select("status, last_ingested_at");

    const sources = sourcesData || [];
    const activeSources = sources.filter(s => s.status === "active").length;
    const errorSources = sources.filter(s => s.status === "error").length;
    
    const lastIngestion = sources
      .filter(s => s.last_ingested_at)
      .map(s => s.last_ingested_at as string)
      .sort()
      .pop();

    const { count: chunksCount } = await supabase
      .from("knowledge_chunks")
      .select("id", { count: "exact", head: true });

    // Determine overall health
    let overall: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (openaiStatus.status === "error" || pineconeStatus.status === "error") {
      overall = "unhealthy";
    } else if (errorSources > 0 || (chunksCount || 0) === 0) {
      overall = "degraded";
    }

    const health: HealthStatus = {
      overall,
      openai: openaiStatus,
      pinecone: pineconeStatus,
      knowledge_base: {
        sources_count: sources.length,
        active_sources: activeSources,
        error_sources: errorSources,
        total_chunks: chunksCount || 0,
        last_ingestion: lastIngestion,
      },
    };

    return new Response(
      JSON.stringify(health),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({ 
        overall: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
