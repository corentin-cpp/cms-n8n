/*
  # Ajout de paramètres par défaut pour les automatisations

  Cette migration ajoute des paramètres par défaut utiles pour les automatisations :
  - Délai d'attente par défaut pour les webhooks
  - Méthode HTTP par défaut 
  - Headers personnalisés
  - Paramètres de retry
*/

-- Paramètres par défaut pour toutes les automatisations
INSERT INTO settings (category, key, value, description, is_public) VALUES
  ('automation', 'webhook_timeout', '30000', 'Délai d''attente par défaut pour les webhooks (ms)', true),
  ('automation', 'webhook_method', '"POST"', 'Méthode HTTP par défaut pour les webhooks', true),
  ('automation', 'webhook_headers', '{}', 'Headers HTTP par défaut pour les webhooks', true),
  ('automation', 'webhook_params', '{}', 'Paramètres par défaut pour les webhooks', true),
  ('automation', 'retry_count', '3', 'Nombre de tentatives en cas d''échec', true),
  ('automation', 'retry_delay', '1000', 'Délai entre les tentatives (ms)', true),
  ('automation', 'enable_logging', 'true', 'Activer les logs détaillés', true),
  ('automation', 'log_level', '"info"', 'Niveau de log (debug, info, warn, error)', true)
ON CONFLICT (category, key, user_id) DO NOTHING;

-- Paramètres spécifiques aux utilisateurs (exemples)
INSERT INTO settings (category, key, value, description, is_public, user_id) VALUES
  ('automation', 'notification_email', '"admin@example.com"', 'Email de notification pour les erreurs', false, null),
  ('automation', 'webhook_auth_token', '""', 'Token d''authentification pour les webhooks', false, null),
  ('automation', 'custom_user_agent', '"CRM-N8N-Automation/1.0"', 'User-Agent personnalisé', false, null)
ON CONFLICT (category, key, user_id) DO NOTHING;
