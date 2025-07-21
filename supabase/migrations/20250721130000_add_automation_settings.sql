/*
  # Table de liaison automation_settings

  Cette migration crée une table de liaison entre les automatisations et les paramètres,
  permettant d'associer des paramètres spécifiques à chaque automatisation.

  ### Nouvelles tables
  - `automation_settings`
    - `id` (uuid, primary key)
    - `automation_id` (uuid, references automations.id)
    - `setting_id` (uuid, references settings.id)
    - `created_at` (timestamp)

  ### Sécurité
  - Active RLS sur la table `automation_settings`
  - Les utilisateurs authentifiés peuvent voir/modifier les liaisons de leurs automatisations
*/

-- Créer la table de liaison automation_settings
CREATE TABLE automation_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id uuid REFERENCES automations(id) ON DELETE CASCADE NOT NULL,
  setting_id uuid REFERENCES settings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Contrainte d'unicité pour éviter les doublons
  UNIQUE(automation_id, setting_id)
);

-- Activer RLS
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour automation_settings
-- Les utilisateurs peuvent voir les liaisons des automatisations qu'ils peuvent voir
CREATE POLICY "Users can view automation settings for accessible automations"
  ON automation_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM automations a 
      WHERE a.id = automation_settings.automation_id
    )
  );

-- Les utilisateurs peuvent créer des liaisons pour leurs automatisations
CREATE POLICY "Users can insert automation settings for their automations"
  ON automation_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM automations a 
      WHERE a.id = automation_settings.automation_id 
      AND a.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent supprimer les liaisons de leurs automatisations
CREATE POLICY "Users can delete automation settings for their automations"
  ON automation_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM automations a 
      WHERE a.id = automation_settings.automation_id 
      AND a.user_id = auth.uid()
    )
  );

-- Index pour optimiser les performances
CREATE INDEX idx_automation_settings_automation_id ON automation_settings(automation_id);
CREATE INDEX idx_automation_settings_setting_id ON automation_settings(setting_id);
