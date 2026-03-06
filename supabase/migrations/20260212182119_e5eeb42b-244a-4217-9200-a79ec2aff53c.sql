
-- Create chat_channels table
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_channels
CREATE POLICY "Anyone can view channels" ON public.chat_channels FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create channels" ON public.chat_channels FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policies for chat_messages
CREATE POLICY "Anyone can view messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
