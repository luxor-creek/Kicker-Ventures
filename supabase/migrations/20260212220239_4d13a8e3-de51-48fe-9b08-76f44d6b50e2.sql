
-- Task activity feed (AI updates, system events, user comments)
CREATE TABLE public.task_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID, -- null for system events
  agent_role TEXT, -- null for user/system entries
  type TEXT NOT NULL DEFAULT 'comment', -- 'comment', 'ai_update', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read task_activity" ON public.task_activity FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert task_activity" ON public.task_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Task outputs (AI-generated artifacts)
CREATE TABLE public.task_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  agent_role TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  preview_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read task_outputs" ON public.task_outputs FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert task_outputs" ON public.task_outputs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Task checklist items
CREATE TABLE public.task_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read checklist" ON public.task_checklist_items FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert checklist" ON public.task_checklist_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update checklist" ON public.task_checklist_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete checklist" ON public.task_checklist_items FOR DELETE USING (auth.role() = 'authenticated');

-- Add task_id to lindy_messages for task-scoped AI conversations
ALTER TABLE public.lindy_messages ADD COLUMN task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_activity;
