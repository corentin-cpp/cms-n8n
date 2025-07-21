import { useSettings } from './useSettings';

/**
 * Hook utilitaire pour accéder facilement aux paramètres d'automatisation
 */
export function useAutomationSettings() {
  const { getSetting, setSetting } = useSettings();

  // Paramètres spécifiques aux automatisations
  const getWebhookTimeout = (): number => 
    getSetting('automation', 'webhook_timeout', 30000) as number;

  const getDefaultWebhookMethod = (): string => 
    getSetting('automation', 'default_webhook_method', 'POST') as string;

  const getMaxRetries = (): number => 
    getSetting('automation', 'max_retries', 3) as number;

  const getRetryDelay = (): number => 
    getSetting('automation', 'retry_delay', 1000) as number;

  const getEnableNotifications = (): boolean => 
    getSetting('automation', 'enable_notifications', true) as boolean;

  const getExecutionHistoryLimit = (): number => 
    getSetting('automation', 'execution_history_limit', 100) as number;

  // Setters pour les paramètres courants
  const setWebhookTimeout = (timeout: number) => 
    setSetting('automation', 'webhook_timeout', timeout, 'Timeout par défaut pour les webhooks en millisecondes');

  const setDefaultWebhookMethod = (method: string) => 
    setSetting('automation', 'default_webhook_method', method, 'Méthode HTTP par défaut pour les webhooks');

  const setMaxRetries = (retries: number) => 
    setSetting('automation', 'max_retries', retries, 'Nombre maximum de tentatives en cas d\'échec');

  const setRetryDelay = (delay: number) => 
    setSetting('automation', 'retry_delay', delay, 'Délai entre les tentatives en millisecondes');

  const setEnableNotifications = (enabled: boolean) => 
    setSetting('automation', 'enable_notifications', enabled, 'Activer les notifications pour les automatisations');

  const setExecutionHistoryLimit = (limit: number) => 
    setSetting('automation', 'execution_history_limit', limit, 'Nombre maximum d\'exécutions à conserver');

  return {
    // Getters
    getWebhookTimeout,
    getDefaultWebhookMethod,
    getMaxRetries,
    getRetryDelay,
    getEnableNotifications,
    getExecutionHistoryLimit,
    
    // Setters
    setWebhookTimeout,
    setDefaultWebhookMethod,
    setMaxRetries,
    setRetryDelay,
    setEnableNotifications,
    setExecutionHistoryLimit,
  };
}

/**
 * Hook utilitaire pour accéder aux paramètres d'interface utilisateur
 */
export function useUISettings() {
  const { getSetting, setSetting } = useSettings();

  const getTheme = (): string => 
    getSetting('ui', 'theme', 'dark') as string;

  const getItemsPerPage = (): number => 
    getSetting('ui', 'items_per_page', 20) as number;

  const getShowTooltips = (): boolean => 
    getSetting('ui', 'show_tooltips', true) as boolean;

  const getAutoRefresh = (): boolean => 
    getSetting('ui', 'auto_refresh', false) as boolean;

  const getRefreshInterval = (): number => 
    getSetting('ui', 'refresh_interval', 30000) as number;

  const setTheme = (theme: string) => 
    setSetting('ui', 'theme', theme, 'Thème de l\'interface utilisateur');

  const setItemsPerPage = (items: number) => 
    setSetting('ui', 'items_per_page', items, 'Nombre d\'éléments par page');

  const setShowTooltips = (show: boolean) => 
    setSetting('ui', 'show_tooltips', show, 'Afficher les info-bulles');

  const setAutoRefresh = (enabled: boolean) => 
    setSetting('ui', 'auto_refresh', enabled, 'Actualisation automatique des données');

  const setRefreshInterval = (interval: number) => 
    setSetting('ui', 'refresh_interval', interval, 'Intervalle d\'actualisation en millisecondes');

  return {
    // Getters
    getTheme,
    getItemsPerPage,
    getShowTooltips,
    getAutoRefresh,
    getRefreshInterval,
    
    // Setters
    setTheme,
    setItemsPerPage,
    setShowTooltips,
    setAutoRefresh,
    setRefreshInterval,
  };
}
