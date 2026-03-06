
-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Project members (controls who can see which project)
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Link tasks to projects (optional)
ALTER TABLE public.tasks ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- RLS for projects: admin sees all, members see their projects
CREATE POLICY "Admin can read all projects" ON public.projects FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can read their projects" ON public.projects FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid()));

CREATE POLICY "Admin can create projects" ON public.projects FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update projects" ON public.projects FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete projects" ON public.projects FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for project_members
CREATE POLICY "Admin can manage project_members" ON public.project_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can read own project_members" ON public.project_members FOR SELECT TO authenticated
USING (user_id = auth.uid());
