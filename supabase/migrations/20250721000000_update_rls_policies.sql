/*
  # Mise à jour des politiques RLS

  Cette migration met à jour les politiques RLS pour permettre :
  - Accès complet aux tables csv_imports, automations, automation_executions pour tous les utilisateurs authentifiés
  - Accès restreint à la table profiles (chaque utilisateur ne peut modifier que son propre profil)
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view own CSV imports" ON csv_imports;
DROP POLICY IF EXISTS "Users can insert own CSV imports" ON csv_imports;
DROP POLICY IF EXISTS "Users can update own CSV imports" ON csv_imports;
DROP POLICY IF EXISTS "Users can delete own CSV imports" ON csv_imports;

DROP POLICY IF EXISTS "Users can view own automations" ON automations;
DROP POLICY IF EXISTS "Users can insert own automations" ON automations;
DROP POLICY IF EXISTS "Users can update own automations" ON automations;
DROP POLICY IF EXISTS "Users can delete own automations" ON automations;

DROP POLICY IF EXISTS "Users can view executions of own automations" ON automation_executions;
DROP POLICY IF EXISTS "Users can insert executions for own automations" ON automation_executions;

-- Créer les nouvelles politiques pour CSV imports - Accès complet
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

-- Créer les nouvelles politiques pour Automations - Accès complet
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

-- Créer les nouvelles politiques pour Automation executions - Accès complet
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

-- Les politiques pour la table profiles restent inchangées (accès restreint au profil de l'utilisateur)
-- CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
-- CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
