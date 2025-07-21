/*
  # CRM N8N Management System Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - admin, member
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `csv_imports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `filename` (text)
      - `columns` (jsonb) - structure of the CSV
      - `data` (jsonb) - CSV data
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `automations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text)
      - `n8n_workflow_id` (text)
      - `webhook_url` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `automation_executions`
      - `id` (uuid, primary key)
      - `automation_id` (uuid, references automations)
      - `status` (text) - success, error, running
      - `execution_data` (jsonb)
      - `error_message` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Users can only access their own data
*/

-- Create tables
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- CSV imports - Accès complet pour tous les utilisateurs authentifiés
CREATE POLICY "Users can view all CSV imports"
  ON csv_imports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert CSV imports"
  ON csv_imports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all CSV imports"
  ON csv_imports FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete all CSV imports"
  ON csv_imports FOR DELETE
  TO authenticated
  USING (true);

-- Automations - Accès complet pour tous les utilisateurs authentifiés
CREATE POLICY "Users can view all automations"
  ON automations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert automations"
  ON automations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all automations"
  ON automations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete all automations"
  ON automations FOR DELETE
  TO authenticated
  USING (true);

-- Automation executions - Accès complet pour tous les utilisateurs authentifiés
CREATE POLICY "Users can view all automation executions"
  ON automation_executions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert automation executions"
  ON automation_executions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all automation executions"
  ON automation_executions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete all automation executions"
  ON automation_executions FOR DELETE
  TO authenticated
  USING (true);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON csv_imports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();