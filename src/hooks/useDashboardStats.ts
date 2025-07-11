import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface DashboardStats {
  csvImports: number;
  automations: number;
  activeAutomations: number;
  recentExecutions: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    csvImports: 0,
    automations: 0,
    activeAutomations: 0,
    recentExecutions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Utiliser Promise.allSettled pour gérer les erreurs partielles
      const results = await Promise.allSettled([
        supabase
          .from('csv_imports')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('automations')
          .select('id, is_active', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('automation_executions')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', yesterday),
      ]);

      // Traiter les résultats
      const csvImportsResult = results[0];
      const automationsResult = results[1];
      const executionsResult = results[2];

      const newStats: DashboardStats = {
        csvImports: 0,
        automations: 0,
        activeAutomations: 0,
        recentExecutions: 0,
      };

      if (csvImportsResult.status === 'fulfilled' && csvImportsResult.value.error === null) {
        newStats.csvImports = csvImportsResult.value.count || 0;
      }

      if (automationsResult.status === 'fulfilled' && automationsResult.value.error === null) {
        newStats.automations = automationsResult.value.count || 0;
        newStats.activeAutomations = automationsResult.value.data?.filter(a => a.is_active).length || 0;
      }

      if (executionsResult.status === 'fulfilled' && executionsResult.value.error === null) {
        newStats.recentExecutions = executionsResult.value.count || 0;
      }

      setStats(newStats);

      // Vérifier s'il y a eu des erreurs
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);

      if (errors.length > 0) {
        console.warn('Some stats failed to load:', errors);
        setError('Certaines statistiques n\'ont pas pu être chargées');
      }

    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}
