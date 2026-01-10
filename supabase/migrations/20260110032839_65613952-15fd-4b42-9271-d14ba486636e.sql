-- ============================================
-- RAG Knowledge Base Schema for CardClutch
-- Tables for knowledge sources, documents, chunks, and query audit
-- ============================================

-- Knowledge Sources Table: URLs/documents to ingest
CREATE TABLE public.knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  url text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL, -- 'issuer_policy', 'credit_education', 'regulatory', etc.
  issuer text NULL,
  trust_tier int NOT NULL DEFAULT 3 CHECK (trust_tier BETWEEN 1 AND 5), -- 1=highest
  refresh_interval_days int NOT NULL DEFAULT 30,
  last_fetched_at timestamptz NULL,
  last_ingested_at timestamptz NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  notes text NULL,
  error_message text NULL
);

-- Knowledge Documents Table: Raw fetched content
CREATE TABLE public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  content_hash text NOT NULL,
  raw_text text NOT NULL,
  raw_html text NULL,
  http_status int NULL,
  error text NULL
);

-- Knowledge Chunks Table: Vectorized chunks
CREATE TABLE public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id uuid NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  chunk_text text NOT NULL,
  pinecone_vector_id text UNIQUE NOT NULL,
  token_count int NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RAG Queries Audit Table: Every question asked
CREATE TABLE public.rag_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash text NULL,
  question text NOT NULL,
  intent text NULL,
  retrieved_chunks jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  model text NULL,
  latency_ms int NULL,
  error text NULL,
  include_citations boolean NOT NULL DEFAULT false
);

-- Indexes for performance
CREATE INDEX idx_knowledge_sources_status ON public.knowledge_sources(status);
CREATE INDEX idx_knowledge_sources_category ON public.knowledge_sources(category);
CREATE INDEX idx_knowledge_sources_last_ingested ON public.knowledge_sources(last_ingested_at);
CREATE INDEX idx_knowledge_documents_source ON public.knowledge_documents(source_id);
CREATE INDEX idx_knowledge_documents_hash ON public.knowledge_documents(content_hash);
CREATE INDEX idx_knowledge_chunks_source ON public.knowledge_chunks(source_id);
CREATE INDEX idx_knowledge_chunks_doc ON public.knowledge_chunks(doc_id);
CREATE INDEX idx_rag_queries_user ON public.rag_queries(user_id);
CREATE INDEX idx_rag_queries_created ON public.rag_queries(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_sources: Admin only
CREATE POLICY "Admins can read knowledge_sources"
  ON public.knowledge_sources FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can insert knowledge_sources"
  ON public.knowledge_sources FOR INSERT
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update knowledge_sources"
  ON public.knowledge_sources FOR UPDATE
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete knowledge_sources"
  ON public.knowledge_sources FOR DELETE
  USING (public.is_admin_or_owner(auth.uid()));

-- RLS Policies for knowledge_documents: Admin only
CREATE POLICY "Admins can read knowledge_documents"
  ON public.knowledge_documents FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can insert knowledge_documents"
  ON public.knowledge_documents FOR INSERT
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update knowledge_documents"
  ON public.knowledge_documents FOR UPDATE
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete knowledge_documents"
  ON public.knowledge_documents FOR DELETE
  USING (public.is_admin_or_owner(auth.uid()));

-- RLS Policies for knowledge_chunks: Admin only
CREATE POLICY "Admins can read knowledge_chunks"
  ON public.knowledge_chunks FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can insert knowledge_chunks"
  ON public.knowledge_chunks FOR INSERT
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update knowledge_chunks"
  ON public.knowledge_chunks FOR UPDATE
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete knowledge_chunks"
  ON public.knowledge_chunks FOR DELETE
  USING (public.is_admin_or_owner(auth.uid()));

-- RLS Policies for rag_queries: Users see own, admins see all
CREATE POLICY "Users can read own rag_queries"
  ON public.rag_queries FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- Service role only for inserts (edge functions)
CREATE POLICY "Service role can insert rag_queries"
  ON public.rag_queries FOR INSERT
  WITH CHECK (true); -- Controlled by edge function, not direct client access