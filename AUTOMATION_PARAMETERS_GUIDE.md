# Guide des Paramètres d'Automatisation

Ce guide explique comment utiliser le nouveau système de paramètres liés aux automatisations pour personnaliser le comportement de chaque automatisation individuellement.

## Vue d'ensemble

Le système de paramètres d'automatisation permet de :
- **Associer des paramètres spécifiques** à chaque automatisation
- **Personnaliser le comportement** de chaque automatisation indépendamment
- **Surcharger les paramètres globaux** pour des besoins spécifiques
- **Centraliser la configuration** dans une interface dédiée

## Architecture

### Tables de base de données

1. **`settings`** - Stocke tous les paramètres (globaux et utilisateur)
2. **`automation_settings`** - Table de liaison entre automatisations et paramètres
3. **`automations`** - Table des automatisations existante

### Composants principaux

- **`AutomationParameters`** - Interface pour gérer les paramètres d'une automatisation
- **`AutomationParametersList`** - Liste toutes les automatisations avec leurs paramètres
- **`useAutomationSettings`** - Hook pour gérer les paramètres d'automatisation
- **`useAutomationSettingsLoader`** - Hook utilitaire pour charger les paramètres

## Utilisation

### 1. Accéder aux paramètres d'automatisation

Dans l'AutomationManager :
1. Cliquez sur l'onglet **"Paramètres d'automatisation"**
2. Sélectionnez une automatisation en cliquant sur **"Paramètres"**
3. Gérez les paramètres liés à cette automatisation

### 2. Lier un paramètre à une automatisation

```typescript
// Dans le composant AutomationParameters
const handleLinkSetting = async () => {
  await linkSettingToAutomation(automationId, selectedSettingId);
};
```

### 3. Utiliser les paramètres dans le code

```typescript
// Dans useAutomations
const automationSettings = await loadAutomationSettings(automation.id);
const timeout = getAutomationSetting(automationSettings, 'automation.webhook_timeout', defaultTimeout);
```

## Paramètres disponibles

### Paramètres de webhook

| Clé | Type | Description | Valeur par défaut |
|-----|------|-------------|-------------------|
| `automation.webhook_timeout` | number | Délai d'attente (ms) | 30000 |
| `automation.webhook_method` | string | Méthode HTTP | "POST" |
| `automation.webhook_headers` | object | Headers personnalisés | {} |
| `automation.webhook_params` | object | Paramètres personnalisés | {} |

### Paramètres de retry

| Clé | Type | Description | Valeur par défaut |
|-----|------|-------------|-------------------|
| `automation.retry_count` | number | Nombre de tentatives | 3 |
| `automation.retry_delay` | number | Délai entre tentatives (ms) | 1000 |

### Paramètres de logging

| Clé | Type | Description | Valeur par défaut |
|-----|------|-------------|-------------------|
| `automation.enable_logging` | boolean | Activer les logs | true |
| `automation.log_level` | string | Niveau de log | "info" |

### Paramètres d'authentification

| Clé | Type | Description | Valeur par défaut |
|-----|------|-------------|-------------------|
| `automation.webhook_auth_token` | string | Token d'auth | "" |
| `automation.custom_user_agent` | string | User-Agent | "CRM-N8N-Automation/1.0" |

## Exemples d'usage

### Exemple 1: Timeout personnalisé

Pour configurer un timeout spécifique pour une automatisation critique :

1. Allez dans "Paramètres globaux" 
2. Créez un paramètre `automation.webhook_timeout` avec la valeur `60000`
3. Allez dans "Paramètres d'automatisation"
4. Liez ce paramètre à votre automatisation critique

### Exemple 2: Headers d'authentification

Pour ajouter un token d'authentification à une automatisation :

```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "X-Custom-Header": "value"
}
```

1. Créez un paramètre `automation.webhook_headers` avec la valeur JSON ci-dessus
2. Liez ce paramètre à votre automatisation

### Exemple 3: Paramètres webhook personnalisés

Pour envoyer des données personnalisées :

```json
{
  "environment": "production",
  "priority": "high",
  "notification_channel": "slack"
}
```

1. Créez un paramètre `automation.webhook_params` avec la valeur JSON ci-dessus
2. Liez ce paramètre à votre automatisation

## Ordre de priorité

Les paramètres sont appliqués dans cet ordre (du plus prioritaire au moins prioritaire) :

1. **Paramètres liés à l'automatisation** - Paramètres spécifiquement liés via `automation_settings`
2. **Paramètres utilisateur** - Paramètres avec `user_id` défini
3. **Paramètres globaux** - Paramètres avec `is_public = true`
4. **Valeurs par défaut du code** - Valeurs hardcodées dans l'application

## Migration des données

### Appliquer les migrations

```sql
-- 1. Table de liaison automation_settings
\i supabase/migrations/20250721130000_add_automation_settings.sql

-- 2. Paramètres par défaut
\i supabase/migrations/20250721140000_add_default_automation_settings.sql
```

### Vérification

```sql
-- Vérifier les paramètres par défaut
SELECT * FROM settings WHERE category = 'automation';

-- Vérifier les liaisons
SELECT 
  a.name,
  s.key,
  s.value
FROM automation_settings aut_s
JOIN automations a ON a.id = aut_s.automation_id
JOIN settings s ON s.id = aut_s.setting_id;
```

## API de développement

### Hooks disponibles

#### `useAutomationSettings(automationId)`

Hook principal pour gérer les paramètres d'automatisation :

```typescript
const {
  automationSettings,    // Paramètres actuels
  linkedSettings,        // Paramètres liés
  availableSettings,     // Paramètres disponibles à lier
  loading,
  error,
  linkSettingToAutomation,
  unlinkSettingFromAutomation,
  getAutomationSetting,
  refreshAutomationSettings
} = useAutomationSettings(automationId);
```

#### `useAutomationSettingsLoader()`

Hook utilitaire pour charger les paramètres :

```typescript
const {
  loadAutomationSettings,
  getAutomationSetting
} = useAutomationSettingsLoader();
```

### Fonction utilitaires

#### `getAutomationSetting(settings, key, defaultValue)`

Récupère une valeur de paramètre avec une valeur par défaut :

```typescript
const timeout = getAutomationSetting(
  automationSettings, 
  'automation.webhook_timeout', 
  30000
);
```

## Bonnes pratiques

### 1. Nomenclature des paramètres

- Utilisez le préfixe `automation.` pour tous les paramètres d'automatisation
- Utilisez des noms descriptifs : `webhook_timeout` plutôt que `timeout`
- Groupez par fonctionnalité : `webhook_*`, `retry_*`, `log_*`

### 2. Types de données

- **Strings** : Entourez de guillemets doubles `"value"`
- **Numbers** : Pas de guillemets `42`
- **Booleans** : `true` ou `false`
- **Objects** : JSON valide `{"key": "value"}`

### 3. Sécurité

- Marquez les paramètres sensibles comme `is_public = false`
- Utilisez des variables d'environnement pour les tokens
- Ne stockez jamais de mots de passe en plain text

### 4. Performance

- Limitez le nombre de paramètres par automatisation
- Utilisez le cache quand possible
- Préchargez les paramètres couramment utilisés

## Dépannage

### Paramètre non pris en compte

1. Vérifiez que le paramètre est bien lié à l'automatisation
2. Vérifiez l'ordre de priorité
3. Vérifiez la syntaxe JSON pour les objets

### Erreur de liaison

1. Vérifiez les permissions RLS
2. Vérifiez que l'utilisateur est propriétaire de l'automatisation
3. Vérifiez que le paramètre existe

### Performance lente

1. Vérifiez les index sur `automation_settings`
2. Limitez le nombre de requêtes simultanées
3. Utilisez le cache pour les paramètres statiques

## Support

Pour toute question ou problème :
1. Vérifiez les logs de la console browser
2. Vérifiez les logs Supabase
3. Consultez la documentation des hooks
4. Testez avec des paramètres simples d'abord
