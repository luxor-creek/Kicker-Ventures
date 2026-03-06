
-- Add category column if not exists
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS category TEXT;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated can read knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Authenticated can create knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Creator or admin can update knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Admin can delete knowledge_base" ON public.knowledge_base;

-- Create new policies
CREATE POLICY "Anyone can view knowledge base"
  ON public.knowledge_base FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create knowledge base docs"
  ON public.knowledge_base FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update knowledge base docs"
  ON public.knowledge_base FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete knowledge base docs"
  ON public.knowledge_base FOR DELETE
  USING (auth.role() = 'authenticated');
