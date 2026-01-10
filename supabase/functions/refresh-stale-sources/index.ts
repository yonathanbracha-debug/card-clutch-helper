/**
 * Refresh Stale Sources Edge Function (Admin/Cron)
 * Finds sources past their refresh interval and re-ingests them
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaleSource {
  id: string;
  url: string;
  title: string;
  category: string;
  trust_tier: number;
  refresh_interval_days: number;
}

// Chunking config (same as ingest-source)
const CHUNK_SIZE = 750;
const CHUNK_OVERLAP = 120;

function extractTextFromHtml(html: string): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
  
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br)[^>]*>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  text = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
  
  return text;
}

function chunkText(text: string): Array<{ text: string; index: number; tokenCount: number }> {
  const chunks: Array<{ text: string; index: number; tokenCount: number }> = [];
  const words = text.split(/\s+/);
  
  let currentChunk = "";
  let chunkIndex = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testChunk = currentChunk ? `${currentChunk} ${word}` : word;
    
    if (testChunk.length > CHUNK_SIZE && currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        tokenCount: Math.ceil(currentChunk.length / 4),
      });
      chunkIndex++;
      
      const overlapWords = currentChunk.split(/\s+/).slice(-Math.ceil(CHUNK_OVERLAP / 6));
      currentChunk = [...overlapWords, word].join(" ");
    } else {
      currentChunk = testChunk;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      tokenCount: Math.ceil(currentChunk.length / 4),
    });
  }
  
  return chunks;
}

async function getEmbeddings(texts: string[], openaiKey: string): Promise<number[][]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

async function upsertToPinecone(
  vectors: Array<{ id: string; values: number[]; metadata: Record<string, unknown> }>,
  pineconeHost: string,
  pineconeKey: string
): Promise<void> {
  const response = await fetch(`${pineconeHost}/vectors/upsert`, {
    method: "POST",
    headers: {
      "Api-Key": pineconeKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vectors }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinecone upsert error: ${response.status} ${errorText}`);
  }
}

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

async function verifyAdmin(supabase: any, authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return false;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "owner"])
      .limit(1);

    return !!(roleData && roleData.length > 0);
  } catch (e) {
    console.error("Auth verification error:", e);
    return false;
  }
}

async function refreshSource(
  source: StaleSource,
  supabase: any,
  openaiKey: string,
  pineconeHost: string,
  pineconeKey: string
): Promise<{ success: boolean; chunks?: number; error?: string }> {
  try {
    // Fetch URL
    const fetchResponse = await fetch(source.url, {
      headers: {
        "User-Agent": "CardClutch-Bot/1.0 (knowledge refresh)",
      },
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP ${fetchResponse.status}`);
    }

    const rawHtml = await fetchResponse.text();
    const rawText = extractTextFromHtml(rawHtml);
    const contentHash = hashContent(rawText);

    // Create document record
    const { data: docData, error: docError } = await supabase
      .from("knowledge_documents")
      .insert({
        source_id: source.id,
        content_hash: contentHash,
        raw_text: rawText,
        raw_html: rawHtml.slice(0, 500000),
        http_status: fetchResponse.status,
      })
      .select("id")
      .single();

    if (docError || !docData) {
      throw new Error(`Document insert failed: ${docError?.message}`);
    }

    const docId = docData.id;

    // Chunk text
    const chunks = chunkText(rawText);
    if (chunks.length === 0) {
      return { success: true, chunks: 0 };
    }

    // Generate embeddings
    const BATCH_SIZE = 20;
    const allVectors: Array<{ id: string; values: number[]; metadata: Record<string, unknown> }> = [];
    const chunkRecords: Array<{
      doc_id: string;
      source_id: string;
      chunk_index: number;
      chunk_text: string;
      pinecone_vector_id: string;
      token_count: number;
    }> = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map(c => c.text);
      const embeddings = await getEmbeddings(texts, openaiKey);

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const vectorId = `${source.id}:${contentHash}:${chunk.index}`;

        allVectors.push({
          id: vectorId,
          values: embeddings[j],
          metadata: {
            source_id: source.id,
            source_url: source.url,
            source_title: source.title,
            category: source.category,
            trust_tier: source.trust_tier,
            status: "active",
            chunk_text: chunk.text,
            chunk_index: chunk.index,
          },
        });

        chunkRecords.push({
          doc_id: docId,
          source_id: source.id,
          chunk_index: chunk.index,
          chunk_text: chunk.text,
          pinecone_vector_id: vectorId,
          token_count: chunk.tokenCount,
        });
      }
    }

    // Upsert to Pinecone
    await upsertToPinecone(allVectors, pineconeHost, pineconeKey);

    // Insert chunks
    await supabase.from("knowledge_chunks").insert(chunkRecords);

    // Update source
    const now = new Date().toISOString();
    await supabase
      .from("knowledge_sources")
      .update({
        status: "active",
        last_fetched_at: now,
        last_ingested_at: now,
        error_message: null,
      })
      .eq("id", source.id);

    return { success: true, chunks: chunks.length };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    
    await supabase
      .from("knowledge_sources")
      .update({
        status: "error",
        error_message: errorMsg,
        last_fetched_at: new Date().toISOString(),
      })
      .eq("id", source.id);

    return { success: false, error: errorMsg };
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
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const pineconeKey = Deno.env.get("PINECONE_API_KEY");
    const pineconeHost = Deno.env.get("PINECONE_HOST");

    if (!openaiKey || !pineconeKey || !pineconeHost) {
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Find stale sources
    const { data: staleSources, error: queryError } = await supabase
      .from("knowledge_sources")
      .select("id, url, title, category, trust_tier, refresh_interval_days, last_ingested_at")
      .eq("status", "active")
      .order("last_ingested_at", { ascending: true, nullsFirst: true })
      .limit(10);

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    // Filter to actually stale sources
    const now = Date.now();
    const stale = (staleSources || []).filter(s => {
      if (!s.last_ingested_at) return true;
      const lastIngested = new Date(s.last_ingested_at).getTime();
      const refreshMs = (s.refresh_interval_days || 30) * 24 * 60 * 60 * 1000;
      return now - lastIngested > refreshMs;
    }) as StaleSource[];

    if (stale.length === 0) {
      return new Response(
        JSON.stringify({ message: "No stale sources to refresh", refreshed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh each stale source
    const results = [];
    for (const source of stale) {
      const result = await refreshSource(source, supabase, openaiKey, pineconeHost, pineconeKey);
      results.push({
        source_id: source.id,
        url: source.url,
        ...result,
      });
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        message: `Refreshed ${successCount} of ${stale.length} sources`,
        refreshed: successCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Refresh error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Refresh failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
