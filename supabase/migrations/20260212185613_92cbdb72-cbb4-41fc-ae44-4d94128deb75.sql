
-- 1. Add deadline column to tasks
ALTER TABLE public.tasks ADD COLUMN deadline timestamp with time zone DEFAULT NULL;

-- 2. Add title and phone to profiles for contact info
ALTER TABLE public.profiles ADD COLUMN title text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN phone text DEFAULT '';

-- 3. Create knowledge_base table
CREATE TABLE public.knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text DEFAULT '',
  doc_type text NOT NULL DEFAULT 'text',
  file_url text DEFAULT NULL,
  external_url text DEFAULT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read knowledge_base"
ON public.knowledge_base FOR SELECT USING (true);

CREATE POLICY "Authenticated can create knowledge_base"
ON public.knowledge_base FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator or admin can update knowledge_base"
ON public.knowledge_base FOR UPDATE USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete knowledge_base"
ON public.knowledge_base FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Add doc_type, external_url, file_url to documents table
ALTER TABLE public.documents ADD COLUMN doc_type text NOT NULL DEFAULT 'text';
ALTER TABLE public.documents ADD COLUMN external_url text DEFAULT NULL;
ALTER TABLE public.documents ADD COLUMN file_url text DEFAULT NULL;

-- 5. Create storage buckets for avatars and document files
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Storage policies for documents
CREATE POLICY "Document files are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
