import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useSettings, Setting, SettingValue } from './useSettings';

interface UseAutomationSettingsReturn {
  automationSettings: Record<string, SettingValue>;
  linkedSettings: Setting[];
  availableSettings: Setting[];
  loading: boolean;
  error: string | null;
  linkSettingToAutomation: (automationId: string, settingId: string) => Promise<void>;
  unlinkSettingFromAutomation: (automationId: string, settingId: string) => Promise<void>;
  getAutomationSetting: (key: string, defaultValue?: SettingValue) => SettingValue;
  refreshAutomationSettings: () => Promise<void>;
}

export function useAutomationSettings(automationId?: string): UseAutomationSettingsReturn {
  const { user } = useAuth();
  const { refreshSettings } = useSettings();
  const [automationSettings, setAutomationSettings] = useState<Record<string, SettingValue>>({});
  const [linkedSettings, setLinkedSettings] = useState<Setting[]>([]);
  const [availableSettings, setAvailableSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAutomationSettings = useCallback(async () => {
    if (!automationId) {
      setLinkedSettings([]);
      setAutomationSettings({});
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Charger les paramètres liés à cette automatisation
      const { data: linkedData, error: linkedError } = await supabase
        .from('automation_settings')
        .select(`
          id,
          setting_id,
          settings (
            id,
            category,
            key,
            value,
            description,
            is_public,
            user_id
          )
        `)
        .eq('automation_id', automationId);

      if (linkedError) throw linkedError;

      // Organiser les paramètres liés
      const linked = linkedData?.map(item => item.settings).filter(Boolean) as unknown as Setting[] || [];
      setLinkedSettings(linked);

      // Créer un dictionnaire des paramètres de l'automatisation
      const settingsDict: Record<string, SettingValue> = {};
      linked.forEach(setting => {
        const key = `${setting.category}.${setting.key}`;
        settingsDict[key] = setting.value;
      });
      setAutomationSettings(settingsDict);

      // Charger tous les paramètres disponibles pour cette automatisation
      const { data: allSettingsData, error: allSettingsError } = await supabase
        .from('settings')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user?.id || 'null'},is_public.eq.true`)
        .order('category, key');

      if (allSettingsError) throw allSettingsError;

      setAvailableSettings(allSettingsData || []);
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres d\'automatisation:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [automationId, user?.id]);

  const linkSettingToAutomation = useCallback(async (autId: string, settingId: string) => {
    try {
      setError(null);

      const { error: linkError } = await supabase
        .from('automation_settings')
        .insert({
          automation_id: autId,
          setting_id: settingId
        });

      if (linkError) throw linkError;

      // Rafraîchir les paramètres de l'automatisation
      await loadAutomationSettings();
    } catch (err) {
      console.error('Erreur lors de la liaison du paramètre:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la liaison');
      throw err;
    }
  }, [loadAutomationSettings]);

  const unlinkSettingFromAutomation = useCallback(async (autId: string, settingId: string) => {
    try {
      setError(null);

      const { error: unlinkError } = await supabase
        .from('automation_settings')
        .delete()
        .eq('automation_id', autId)
        .eq('setting_id', settingId);

      if (unlinkError) throw unlinkError;

      // Rafraîchir les paramètres de l'automatisation
      await loadAutomationSettings();
    } catch (err) {
      console.error('Erreur lors de la suppression de la liaison:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      throw err;
    }
  }, [loadAutomationSettings]);

  const getAutomationSetting = useCallback((key: string, defaultValue?: SettingValue): SettingValue => {
    return automationSettings[key] ?? defaultValue ?? null;
  }, [automationSettings]);

  const refreshAutomationSettings = useCallback(async () => {
    await loadAutomationSettings();
    await refreshSettings();
  }, [loadAutomationSettings, refreshSettings]);

  useEffect(() => {
    loadAutomationSettings();
  }, [loadAutomationSettings]);

  return {
    automationSettings,
    linkedSettings,
    availableSettings: availableSettings.filter(setting => 
      !linkedSettings.some(linked => linked.id === setting.id)
    ),
    loading,
    error,
    linkSettingToAutomation,
    unlinkSettingFromAutomation,
    getAutomationSetting,
    refreshAutomationSettings
  };
}
