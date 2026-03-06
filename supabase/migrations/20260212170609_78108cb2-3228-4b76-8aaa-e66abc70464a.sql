-- Drop all existing restrictive policies on projects
DROP POLICY IF EXISTS "Admin can create projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can read all projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
DROP POLICY IF EXISTS "Members can read their projects" ON public.projects;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admin can create projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete projects"
ON public.projects FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can read all projects"
ON public.projects FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update projects"
ON public.projects FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can read their projects"
ON public.projects FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM project_members
  WHERE project_members.project_id = projects.id
  AND project_members.user_id = auth.uid()
));

-- Also fix project_members policies
DROP POLICY IF EXISTS "Admin can manage project_members" ON public.project_members;
DROP POLICY IF EXISTS "Members can read own project_members" ON public.project_members;

CREATE POLICY "Admin can manage project_members"
ON public.project_members FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can read own project_members"
ON public.project_members FOR SELECT TO authenticated
USING (user_id = auth.uid());