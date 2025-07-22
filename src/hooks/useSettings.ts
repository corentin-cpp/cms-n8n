import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type SettingValue = string | number | boolean | object | null;

export interface Setting {
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

interface UseSettingsReturn {
  settings: Record<string, SettingValue>;
  loading: boolean;
  error: string | null;
  getSetting: (category: string, key: string, defaultValue?: SettingValue) => SettingValue;
  setSetting: (category: string, key: string, value: SettingValue, description?: string) => Promise<void>;
  deleteSetting: (category: string, key: string) => Promise<void>;
  getSettingsByCategory: (category: string) => Record<string, SettingValue>;
  refreshSettings: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, SettingValue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Charger les paramètres publics et les paramètres de l'utilisateur
      const { data, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user?.id || 'null'},is_public.eq.true`)
        .order('created_at', { ascending: true });

      if (settingsError) throw settingsError;

      // Organiser les paramètres par catégorie.clé
      const settingsMap: Record<string, SettingValue> = {};
      
      data?.forEach((setting: Setting) => {
        const key = `${setting.category}.${setting.key}`;
        try {
          // Parser la valeur JSON
          settingsMap[key] = typeof setting.value === 'string' 
            ? JSON.parse(setting.value) 
            : setting.value;
        } catch {
          // Si le parsing échoue, garder la valeur telle quelle
          settingsMap[key] = setting.value;
        }
      });

      setSettings(settingsMap);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const getSetting = useCallback((category: string, key: string, defaultValue: SettingValue = null): SettingValue => {
    const settingKey = `${category}.${key}`;
    return settings[settingKey] !== undefined ? settings[settingKey] : defaultValue;
  }, [settings]);

  const setSetting = useCallback(async (
    category: string, 
    key: string, 
    value: SettingValue, 
    description?: string
  ): Promise<void> => {
    try {
      setError(null);

      // Convertir la valeur en JSON si nécessaire
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);

      const { error: upsertError } = await supabase
        .from('settings')
        .upsert({
          user_id: user?.id,
          category,
          key,
          value: jsonValue,
          description,
          is_public: false,
        }, {
          onConflict: 'user_id,category,key'
        });

      if (upsertError) throw upsertError;

      // Mettre à jour l'état local
      const settingKey = `${category}.${key}`;
      setSettings(prev => ({
        ...prev,
        [settingKey]: value
      }));

    } catch (err) {
      console.error('Error setting value:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const deleteSetting = useCallback(async (category: string, key: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('settings')
        .delete()
        .eq('user_id', user?.id)
        .eq('category', category)
        .eq('key', key);

      if (deleteError) throw deleteError;

      // Mettre à jour l'état local
      const settingKey = `${category}.${key}`;
      setSettings(prev => {
        const newSettings = { ...prev };
        delete newSettings[settingKey];
        return newSettings;
      });

    } catch (err) {
      console.error('Error deleting setting:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur de suppression';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const getSettingsByCategory = useCallback((category: string): Record<string, SettingValue> => {
    const categorySettings: Record<string, SettingValue> = {};
    Object.entries(settings).forEach(([key, value]) => {
      if (key.startsWith(`${category}.`)) {
        const settingKey = key.replace(`${category}.`, '');
        categorySettings[settingKey] = value;
      }
    });
    return categorySettings;
  }, [settings]);

  const refreshSettings = useCallback(async (): Promise<void> => {
    await loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    getSetting,
    setSetting,
    deleteSetting,
    getSettingsByCategory,
    refreshSettings,
  };
}
