ALTER TABLE public.project_members ADD COLUMN access_level text NOT NULL DEFAULT 'full';

-- Update existing RLS policies to account for access_level
-- No policy changes needed since access is managed at app level