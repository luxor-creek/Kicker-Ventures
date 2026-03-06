
-- Junction table to link specific documents to tasks
CREATE TABLE public.task_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, document_id)
);

-- Enable RLS
ALTER TABLE public.task_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated can read task_documents"
ON public.task_documents FOR SELECT
USING (true);

CREATE POLICY "Authenticated can add task_documents"
ON public.task_documents FOR INSERT
WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Admin or adder can delete task_documents"
ON public.task_documents FOR DELETE
USING (auth.uid() = added_by OR has_role(auth.uid(), 'admin'::app_role));
