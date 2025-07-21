import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SettingValue } from './useSettings';

/**
 * Hook utilitaire pour récupérer les paramètres d'une automatisation spécifique
 */
export function useAutomationSettingsLoader() {
  const loadAutomationSettings = useCallback(async (automationId: string): Promise<Record<string, SettingValue>> => {
    try {
      const { data, error } = await supabase
        .from('automation_settings')
        .select(`
          settings (
            category,
            key,
            value
          )
        `)
        .eq('automation_id', automationId);

      if (error) throw error;

      // Organiser les paramètres en dictionnaire
      const settings: Record<string, SettingValue> = {};
      data?.forEach(item => {
        if (item.settings) {
          const setting = item.settings as unknown as { category: string; key: string; value: SettingValue };
          const key = `${setting.category}.${setting.key}`;
          settings[key] = setting.value;
        }
      });

      return settings;
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres d\'automatisation:', err);
      return {};
    }
  }, []);

  const getAutomationSetting = useCallback(
    (settings: Record<string, SettingValue>, key: string, defaultValue?: SettingValue): SettingValue => {
      return settings[key] ?? defaultValue ?? null;
    },
    []
  );

  return {
    loadAutomationSettings,
    getAutomationSetting
  };
}
