
-- Create lindy_messages table
CREATE TABLE public.lindy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  agent_role TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.lindy_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own lindy messages"
  ON public.lindy_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages (sender must be 'user')
CREATE POLICY "Users can insert own lindy messages"
  ON public.lindy_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND sender = 'user');

-- Allow service role to insert agent messages (no auth.uid() check needed for service role)
-- Service role bypasses RLS, so this policy is for the edge function using service role key

-- Users can update read status on their own messages
CREATE POLICY "Users can update own lindy messages"
  ON public.lindy_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lindy_messages;

-- Index for performance
CREATE INDEX idx_lindy_messages_user_agent ON public.lindy_messages(user_id, agent_role, created_at DESC);
