
-- Fix: Restrict document reads to creators and admins
DROP POLICY IF EXISTS "Authenticated can read documents" ON public.documents;
CREATE POLICY "Creators and admins can read documents"
ON public.documents FOR SELECT TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::app_role));
