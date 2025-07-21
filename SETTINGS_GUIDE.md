# Système de Paramètres - CRM N8N

Ce document explique comment utiliser le système de paramètres de l'application CRM N8N.

## Vue d'ensemble

Le système de paramètres permet de :
- 📊 Configurer des paramètres globaux ou spécifiques à l'utilisateur
- 🔧 Modifier facilement la configuration sans redéploiement
- 💾 Sauvegarder automatiquement les préférences utilisateur
- 🏷️ Organiser les paramètres par catégories

## Structure de la Base de Données

### Table `settings`
```sql
CREATE TABLE settings (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),  -- NULL pour paramètres globaux
  category text NOT NULL,                -- Ex: 'automation', 'ui', 'app'
  key text NOT NULL,                     -- Ex: 'webhook_timeout', 'theme'
  value jsonb NOT NULL,                  -- Valeur JSON flexible
  description text,                      -- Description du paramètre
  is_public boolean DEFAULT false,       -- Visible par tous les utilisateurs
  created_at timestamp,
  updated_at timestamp
);
```

## Utilisation dans le Code

### 1. Hook Principal : `useSettings`

```typescript
import { useSettings } from '../hooks/useSettings';

function MyComponent() {
  const { 
    settings,           // Tous les paramètres chargés
    loading,           // État de chargement
    error,             // Erreurs éventuelles
    getSetting,        // Récupérer un paramètre
    setSetting,        // Définir un paramètre
    deleteSetting,     // Supprimer un paramètre
    getSettingsByCategory, // Paramètres d'une catégorie
    refreshSettings    // Recharger depuis la DB
  } = useSettings();

  // Exemples d'utilisation
  const theme = getSetting('ui', 'theme', 'dark');
  const timeout = getSetting('automation', 'webhook_timeout', 30000);

  const handleSave = async () => {
    await setSetting('ui', 'theme', 'light', 'Thème de l\'interface');
  };

  return <div>...</div>;
}
```

### 2. Hooks Utilitaires : `useSettingsHelpers`

Pour simplifier l'accès aux paramètres courants :

```typescript
import { useAutomationSettings, useUISettings } from '../hooks/useSettingsHelpers';

function AutomationComponent() {
  const { 
    getWebhookTimeout,
    getDefaultWebhookMethod,
    setWebhookTimeout 
  } = useAutomationSettings();

  const timeout = getWebhookTimeout(); // 30000 par défaut
  const method = getDefaultWebhookMethod(); // 'POST' par défaut

  return <div>...</div>;
}
```

### 3. Composant de Gestion : `SettingsManager`

Interface utilisateur pour gérer les paramètres :

```typescript
import { SettingsManager } from '../components/settings/SettingsManager';

function MyPage() {
  return (
    <div>
      {/* Interface pour gérer les paramètres d'automatisation */}
      <SettingsManager 
        category="automation" 
        title="Paramètres des automatisations" 
      />
      
      {/* Interface pour gérer les paramètres UI */}
      <SettingsManager 
        category="ui" 
        title="Paramètres de l'interface" 
      />
    </div>
  );
}
```

## Catégories de Paramètres

### 📋 `automation`
- `webhook_timeout` : Timeout des webhooks (millisecondes)
- `default_webhook_method` : Méthode HTTP par défaut
- `max_retries` : Nombre maximum de tentatives
- `retry_delay` : Délai entre les tentatives
- `enable_notifications` : Activer les notifications
- `execution_history_limit` : Limite d'historique des exécutions

### 🎨 `ui`
- `theme` : Thème de l'interface ('dark', 'light')
- `items_per_page` : Éléments par page
- `show_tooltips` : Afficher les info-bulles
- `auto_refresh` : Actualisation automatique
- `refresh_interval` : Intervalle d'actualisation

### ⚙️ `app`
- `default_webhook_timeout` : Timeout global par défaut
- `max_execution_history` : Historique maximum global
- `enable_notifications` : Notifications globales

## Exemples Pratiques

### Créer un Nouveau Paramètre

```typescript
const { setSetting } = useSettings();

// Paramètre utilisateur
await setSetting(
  'automation',           // Catégorie
  'custom_header',        // Clé
  'Bearer token',         // Valeur
  'En-tête personnalisé'  // Description
);

// Paramètre complexe (objet)
await setSetting(
  'automation',
  'email_config',
  {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    use_tls: true
  },
  'Configuration email'
);
```

### Utiliser un Paramètre dans une Fonction

```typescript
const { getWebhookTimeout } = useAutomationSettings();

async function callWebhook(url: string) {
  const timeout = getWebhookTimeout();
  
  const response = await Promise.race([
    fetch(url),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
  
  return response;
}
```

### Interface de Configuration

L'interface dans `AutomationManager` permet de :
- ✅ Voir tous les paramètres d'une catégorie
- ✅ Ajouter de nouveaux paramètres
- ✅ Modifier les valeurs existantes
- ✅ Supprimer des paramètres
- ✅ Valider les types (string, number, boolean, object)

## Types de Valeurs Supportés

1. **String** : `"ma_valeur"`
2. **Number** : `42`, `3.14`
3. **Boolean** : `true`, `false`
4. **Object** : `{"key": "value", "nested": {"data": true}}`

## Sécurité et Permissions

- 🔒 **RLS activé** : Chaque utilisateur ne voit que ses paramètres
- 🌍 **Paramètres publics** : `is_public=true` visible par tous
- 🔧 **Paramètres globaux** : `user_id=null` pour la configuration app

## Migration et Paramètres par Défaut

Les paramètres par défaut sont insérés automatiquement lors de la migration :

```sql
INSERT INTO settings (user_id, category, key, value, description, is_public) VALUES
  (NULL, 'app', 'default_webhook_timeout', '30000', 'Timeout par défaut', true),
  (NULL, 'ui', 'theme', '"dark"', 'Thème par défaut', true),
  -- ... autres paramètres
```

## API Reference

### `useSettings()`
- `settings: Record<string, SettingValue>` - Tous les paramètres
- `loading: boolean` - État de chargement
- `error: string | null` - Erreur éventuelle
- `getSetting(category, key, defaultValue?)` - Récupérer une valeur
- `setSetting(category, key, value, description?)` - Définir une valeur
- `deleteSetting(category, key)` - Supprimer un paramètre
- `getSettingsByCategory(category)` - Paramètres d'une catégorie
- `refreshSettings()` - Recharger depuis la DB

### Types
```typescript
type SettingValue = string | number | boolean | object | null;

interface Setting {
  id: string;
  user_id?: string;
  category: string;
  key: string;
  value: SettingValue;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
```

## Bonnes Pratiques

1. **Nommage** : Utilisez des noms clairs (`webhook_timeout` vs `wt`)
2. **Catégories** : Groupez logiquement (`automation`, `ui`, `app`)
3. **Descriptions** : Toujours ajouter une description
4. **Défauts** : Définissez toujours une valeur par défaut
5. **Types** : Validez les types avant utilisation
6. **Performance** : Les paramètres sont mis en cache automatiquement
