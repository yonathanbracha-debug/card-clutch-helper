/**
 * Ingest Source Edge Function (Admin Only)
 * Fetches URL content, chunks it, generates embeddings, and upserts to Pinecone
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chunking config
const CHUNK_SIZE = 750; // Target chars per chunk
const CHUNK_OVERLAP = 120;
const MAX_URL_LENGTH = 2048;
const MAX_TITLE_LENGTH = 200;

interface IngestRequest {
  url: string;
  title: string;
  category: string;
  issuer?: string;
  trust_tier?: number;
  refresh_interval_days?: number;
  notes?: string;
}

interface ChunkData {
  text: string;
  index: number;
  tokenCount: number;
}

// Simple HTML to text extraction
function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
  
  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br)[^>]*>/gi, "\n");
  
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, " ");
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
  
  return text;
}

function chunkText(text: string): ChunkData[] {
  const chunks: ChunkData[] = [];
  const words = text.split(/\s+/);
  
  let currentChunk = "";
  let chunkIndex = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testChunk = currentChunk ? `${currentChunk} ${word}` : word;
    
    if (testChunk.length > CHUNK_SIZE && currentChunk) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        tokenCount: Math.ceil(currentChunk.length / 4), // Rough token estimate
      });
      chunkIndex++;
      
      // Start new chunk with overlap
      const overlapWords = currentChunk.split(/\s+/).slice(-Math.ceil(CHUNK_OVERLAP / 6));
      currentChunk = [...overlapWords, word].join(" ");
    } else {
      currentChunk = testChunk;
    }
  }
  
  // Don't forget the last chunk
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
  // Simple hash for content comparison
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function validateRequest(body: unknown): { valid: true; data: IngestRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // URL validation
  if (!req.url || typeof req.url !== "string") {
    return { valid: false, error: "URL is required" };
  }
  
  const url = req.url.trim();
  if (url.length > MAX_URL_LENGTH) {
    return { valid: false, error: "URL too long" };
  }
  
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { valid: false, error: "URL must start with http:// or https://" };
  }

  // Title validation
  if (!req.title || typeof req.title !== "string") {
    return { valid: false, error: "Title is required" };
  }
  
  const title = req.title.trim();
  if (title.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: "Title too long" };
  }

  // Category validation
  const validCategories = ["issuer_policy", "credit_education", "regulatory", "general"];
  if (!req.category || typeof req.category !== "string") {
    return { valid: false, error: "Category is required" };
  }
  
  const category = req.category.trim();
  if (!validCategories.includes(category)) {
    return { valid: false, error: `Category must be one of: ${validCategories.join(", ")}` };
  }

  // Optional fields
  const issuer = typeof req.issuer === "string" ? req.issuer.trim().slice(0, 100) : undefined;
  const trustTier = typeof req.trust_tier === "number" ? Math.min(5, Math.max(1, Math.floor(req.trust_tier))) : 3;
  const refreshInterval = typeof req.refresh_interval_days === "number" 
    ? Math.min(365, Math.max(1, Math.floor(req.refresh_interval_days))) 
    : 30;
  const notes = typeof req.notes === "string" ? req.notes.trim().slice(0, 1000) : undefined;

  return {
    valid: true,
    data: {
      url,
      title,
      category,
      issuer,
      trust_tier: trustTier,
      refresh_interval_days: refreshInterval,
      notes,
    },
  };
}

async function verifyAdmin(supabase: any, authHeader: string | null): Promise<{ isAdmin: boolean; userId: string | null }> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { isAdmin: false, userId: null };
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { isAdmin: false, userId: null };
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "owner"])
      .limit(1);

    const isAdmin = !!(roleData && roleData.length > 0);
    return { isAdmin, userId: user.id };
  } catch (e) {
    console.error("Auth verification error:", e);
    return { isAdmin: false, userId: null };
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
      console.error("Missing required API keys");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get("authorization");
    const { isAdmin, userId } = await verifyAdmin(supabase, authHeader);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    const { url, title, category, issuer, trust_tier, refresh_interval_days, notes } = validation.data;

    // Check if source already exists
    const { data: existingSource } = await supabase
      .from("knowledge_sources")
      .select("id")
      .eq("url", url)
      .limit(1);

    let sourceId: string;

    if (existingSource && existingSource.length > 0) {
      sourceId = existingSource[0].id;
      // Update existing source
      await supabase
        .from("knowledge_sources")
        .update({
          title,
          category,
          issuer,
          trust_tier,
          refresh_interval_days,
          notes,
          status: "active",
          error_message: null,
        })
        .eq("id", sourceId);
    } else {
      // Create new source
      const { data: newSource, error: insertError } = await supabase
        .from("knowledge_sources")
        .insert({
          url,
          title,
          category,
          issuer,
          trust_tier,
          refresh_interval_days,
          notes,
          created_by: userId,
        })
        .select("id")
        .single();

      if (insertError || !newSource) {
        throw new Error(`Failed to create source: ${insertError?.message}`);
      }

      sourceId = newSource.id;
    }

    // Fetch URL content
    let rawHtml: string;
    let httpStatus: number;

    try {
      const fetchResponse = await fetch(url, {
        headers: {
          "User-Agent": "CardClutch-Bot/1.0 (knowledge ingestion)",
        },
      });
      
      httpStatus = fetchResponse.status;
      
      if (!fetchResponse.ok) {
        throw new Error(`HTTP ${httpStatus}`);
      }

      rawHtml = await fetchResponse.text();
    } catch (fetchError) {
      // Mark source as error
      await supabase
        .from("knowledge_sources")
        .update({
          status: "error",
          error_message: fetchError instanceof Error ? fetchError.message : "Fetch failed",
          last_fetched_at: new Date().toISOString(),
        })
        .eq("id", sourceId);

      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch URL",
          details: fetchError instanceof Error ? fetchError.message : "Unknown error",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract text
    const rawText = extractTextFromHtml(rawHtml);
    const contentHash = hashContent(rawText);

    // Create document record
    const { data: docData, error: docError } = await supabase
      .from("knowledge_documents")
      .insert({
        source_id: sourceId,
        content_hash: contentHash,
        raw_text: rawText,
        raw_html: rawHtml.slice(0, 500000), // Limit stored HTML
        http_status: httpStatus,
      })
      .select("id")
      .single();

    if (docError || !docData) {
      throw new Error(`Failed to create document: ${docError?.message}`);
    }

    const docId = docData.id;

    // Chunk text
    const chunks = chunkText(rawText);

    if (chunks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Source fetched but no content to chunk",
          source_id: sourceId,
          document_id: docId,
          chunks_created: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate embeddings in batches
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
        const vectorId = `${sourceId}:${contentHash}:${chunk.index}`;

        allVectors.push({
          id: vectorId,
          values: embeddings[j],
          metadata: {
            source_id: sourceId,
            source_url: url,
            source_title: title,
            category,
            trust_tier: trust_tier || 3,
            status: "active",
            chunk_text: chunk.text,
            chunk_index: chunk.index,
          },
        });

        chunkRecords.push({
          doc_id: docId,
          source_id: sourceId,
          chunk_index: chunk.index,
          chunk_text: chunk.text,
          pinecone_vector_id: vectorId,
          token_count: chunk.tokenCount,
        });
      }
    }

    // Upsert to Pinecone
    await upsertToPinecone(allVectors, pineconeHost, pineconeKey);

    // Insert chunk records
    const { error: chunkError } = await supabase
      .from("knowledge_chunks")
      .insert(chunkRecords);

    if (chunkError) {
      console.error("Chunk insert error:", chunkError);
    }

    // Update source status
    const now = new Date().toISOString();
    await supabase
      .from("knowledge_sources")
      .update({
        status: "active",
        last_fetched_at: now,
        last_ingested_at: now,
        error_message: null,
      })
      .eq("id", sourceId);

    return new Response(
      JSON.stringify({
        success: true,
        source_id: sourceId,
        document_id: docId,
        chunks_created: chunks.length,
        vectors_upserted: allVectors.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Ingest error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Ingestion failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
