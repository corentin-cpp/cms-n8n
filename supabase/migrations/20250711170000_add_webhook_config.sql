-- Ajouter les nouvelles colonnes pour la configuration des webhooks
ALTER TABLE automations 
ADD COLUMN webhook_method varchar(10) DEFAULT 'POST',
ADD COLUMN webhook_headers jsonb DEFAULT '{}',
ADD COLUMN webhook_params jsonb DEFAULT '{}';

-- Mettre à jour les automatisations existantes pour avoir POST par défaut
UPDATE automations SET webhook_method = 'POST' WHERE webhook_method IS NULL;


