
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Messages table (for DM and group chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Channels table
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Channel members
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Trigger for auto-creating profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: authenticated users can read all, update own
CREATE POLICY "Authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles: authenticated can read, only admin can manage
CREATE POLICY "Authenticated can read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Tasks: all authenticated can CRUD
CREATE POLICY "Authenticated can read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Channels: members can read
CREATE POLICY "Members can read channels" ON public.channels FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channels.id AND user_id = auth.uid())
);
CREATE POLICY "Admin can create channels" ON public.channels FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Channel members
CREATE POLICY "Members can read channel_members" ON public.channel_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_members.channel_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Admin can manage channel_members" ON public.channel_members FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete channel_members" ON public.channel_members FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Messages: channel members can read/insert
CREATE POLICY "Members can read messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = messages.channel_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = messages.channel_id AND user_id = auth.uid())
);

-- Documents: all authenticated
CREATE POLICY "Authenticated can read documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated can update documents" ON public.documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete documents" ON public.documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
