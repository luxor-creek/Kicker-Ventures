
-- Tighten update policies: only creator or assigned user can update tasks
DROP POLICY "Authenticated can update tasks" ON public.tasks;
CREATE POLICY "Creator or assignee can update tasks" ON public.tasks FOR UPDATE TO authenticated 
USING (auth.uid() = created_by OR auth.uid() = assigned_to OR public.has_role(auth.uid(), 'admin'));

-- Only creator or admin can update documents
DROP POLICY "Authenticated can update documents" ON public.documents;
CREATE POLICY "Creator or admin can update documents" ON public.documents FOR UPDATE TO authenticated 
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
