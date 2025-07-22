/*
  # Ajout de la table des paramètres

  Cette migration ajoute une table pour gérer les paramètres de l'application :
  - Paramètres globaux de l'application
  - Paramètres spécifiques à chaque utilisateur
  - Configuration flexible avec support JSON
*/

-- Create table for application settings
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL DEFAULT 'general',
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id),
  CONSTRAINT settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT settings_unique_user_key UNIQUE (user_id, category, key)
);

-- Ajouter un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_settings_user_category ON public.settings(user_id, category);
CREATE INDEX IF NOT EXISTS idx_settings_category_key ON public.settings(category, key);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for settings
-- Les utilisateurs peuvent voir leurs propres paramètres et les paramètres publics
CREATE POLICY "Users can view own settings and public settings"
  ON public.settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true OR user_id IS NULL);

-- Les utilisateurs peuvent modifier leurs propres paramètres
CREATE POLICY "Users can insert own settings"
  ON public.settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own settings"
  ON public.settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own settings"
  ON public.settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at_settings BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some default settings
INSERT INTO public.settings (user_id, category, key, value, description, is_public) VALUES
  (NULL, 'app', 'default_webhook_timeout', '30000', 'Timeout par défaut pour les webhooks en millisecondes', true),
  (NULL, 'app', 'max_execution_history', '100', 'Nombre maximum d''exécutions à conserver dans l''historique', true),
  (NULL, 'app', 'default_webhook_method', '"POST"', 'Méthode HTTP par défaut pour les webhooks', true),
  (NULL, 'app', 'enable_notifications', 'true', 'Activer les notifications par défaut', true),
  (NULL, 'ui', 'theme', '"dark"', 'Thème par défaut de l''interface', true),
  (NULL, 'ui', 'items_per_page', '20', 'Nombre d''éléments par page par défaut', true)
ON CONFLICT (user_id, category, key) DO NOTHING;
