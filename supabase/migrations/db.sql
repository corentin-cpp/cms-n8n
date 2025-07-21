CREATE TABLE IF NOT EXISTS public.automation_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL,
  status text DEFAULT 'running'::text CHECK (status = ANY (ARRAY['success'::text, 'error'::text, 'running'::text])),
  execution_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_executions_pkey PRIMARY KEY (id),
  CONSTRAINT automation_executions_automation_id_fkey FOREIGN KEY (automation_id) REFERENCES public.automations(id)
);
CREATE TABLE IF NOT EXISTS public.automations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT ''::text,
  n8n_workflow_id text,
  webhook_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  webhook_method character varying DEFAULT 'POST'::character varying,
  webhook_headers jsonb DEFAULT '{}'::jsonb,
  webhook_params jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT automations_pkey PRIMARY KEY (id),
  CONSTRAINT automations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE IF NOT EXISTS public.csv_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  filename text NOT NULL,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT csv_imports_pkey PRIMARY KEY (id),
  CONSTRAINT csv_imports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'member'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);