import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Automation, AutomationExecutionWithName } from '../lib/types';
import { useAuth } from './useAuth';

interface UseAutomationsReturn {
  automations: Automation[];
  executions: AutomationExecutionWithName[];
  loadingPage: boolean;
  executing: string | null;
  errorPage: string | null;
  executeAutomation: (automation: Automation) => Promise<void>;
  toggleAutomation: (automation: Automation) => Promise<void>;
  createAutomation: (automation: Partial<Automation>) => Promise<void>;
  updateAutomation: (id: string, automation: Partial<Automation>) => Promise<void>;
  deleteAutomation: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useAutomations(): UseAutomationsReturn {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [executions, setExecutions] = useState<AutomationExecutionWithName[]>([]);
  const [loadingPage, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [errorPage, setError] = useState<string | null>(null);

  const loadAutomations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: automationsError } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (automationsError) throw automationsError;
      setAutomations(data || []);
    } catch (err) {
      console.error('Error loading automations:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
  }, [user]);

  const loadExecutions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: executionsError } = await supabase
        .from('automation_executions')
        .select(`
          *,
          automations!inner(name, user_id)
        `)
        .eq('automations.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20); // Augmenté à 20 mais limité

      if (executionsError) throw executionsError;
      setExecutions(data || []);
    } catch (err) {
      console.error('Error loading executions:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([loadAutomations(), loadExecutions()]);
    } finally {
      setLoading(false);
    }
  }, [user, loadAutomations, loadExecutions]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  const executeAutomation = useCallback(async (automation: Automation) => {
    if (!automation.webhook_url) {
      throw new Error('Cette automatisation n\'a pas d\'URL webhook configurée');
    }

    setExecuting(automation.id);
    setError(null);

    try {
      // Create execution record
      const { data: execution, error: executionError } = await supabase
        .from('automation_executions')
        .insert({
          automation_id: automation.id,
          status: 'running',
          execution_data: {},
        })
        .select()
        .single();

      if (executionError) throw executionError;

      // Mettre à jour l'état local immédiatement pour un feedback rapide
      setExecutions(prev => [{
        ...execution,
        automations: { name: automation.name }
      } as AutomationExecutionWithName, ...prev.slice(0, 19)]);

      // Call webhook with new configuration
      const requestOptions: RequestInit = {
        method: automation.webhook_method,
        headers: {
          'Content-Type': 'application/json',
          ...automation.webhook_headers,
        },
      };

      // Add body for POST, PUT, PATCH methods
      if (['POST', 'PUT', 'PATCH'].includes(automation.webhook_method)) {
        requestOptions.body = JSON.stringify({
          automation_id: automation.id,
          execution_id: execution.id,
          timestamp: new Date().toISOString(),
          ...automation.webhook_params,
        });
      } else {
        // For GET, DELETE, add params as query string
        const url = new URL(automation.webhook_url);
        Object.entries(automation.webhook_params || {}).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });
        // Also add default params
        url.searchParams.set('automation_id', automation.id);
        url.searchParams.set('execution_id', execution.id);
        url.searchParams.set('timestamp', new Date().toISOString());
        
        // Update webhook_url for the request
        requestOptions.headers = {
          ...automation.webhook_headers,
        };
        // Use the modified URL
        const response = await fetch(url.toString(), requestOptions);
        const result = await response.json();

        // Update execution status
        const { error: updateError } = await supabase
          .from('automation_executions')
          .update({
            status: response.ok ? 'success' : 'error',
            execution_data: result,
            error_message: response.ok ? null : result.error || 'Erreur inconnue',
          })
          .eq('id', execution.id);

        if (updateError) throw updateError;

        // Mettre à jour l'état local
        setExecutions(prev => prev.map(exec => 
          exec.id === execution.id 
            ? {
                ...exec,
                status: response.ok ? 'success' : 'error',
                execution_data: result,
                error_message: response.ok ? null : result.error || 'Erreur inconnue',
              }
            : exec
        ));
        
        return;
      }

      const response = await fetch(automation.webhook_url, requestOptions);

      const result = await response.json();

      // Update execution status
      const { error: updateError } = await supabase
        .from('automation_executions')
        .update({
          status: response.ok ? 'success' : 'error',
          execution_data: result,
          error_message: response.ok ? null : result.error || 'Erreur inconnue',
        })
        .eq('id', execution.id);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      setExecutions(prev => prev.map(exec => 
        exec.id === execution.id 
          ? {
              ...exec,
              status: response.ok ? 'success' : 'error',
              execution_data: result,
              error_message: response.ok ? null : result.error || 'Erreur inconnue',
            }
          : exec
      ));
      return execution.id;
    } catch (error) {
      console.error('Error executing automation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'exécution';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setExecuting(null);
    }
  }, []);

  const toggleAutomation = useCallback(async (automation: Automation) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('automations')
        .update({ is_active: !automation.is_active })
        .eq('id', automation.id);

      if (updateError) throw updateError;

      // Mettre à jour l'état local immédiatement
      setAutomations(prev => prev.map(auto => 
        auto.id === automation.id 
          ? { ...auto, is_active: !auto.is_active }
          : auto
      ));

    } catch (error) {
      console.error('Error toggling automation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de basculement';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const createAutomation = useCallback(async (automationData: Partial<Automation>) => {
    if (!user) return;

    try {
      setError(null);
      
      const { data, error: insertError } = await supabase
        .from('automations')
        .insert({
          user_id: user.id,
          name: automationData.name,
          description: automationData.description || '',
          webhook_url: automationData.webhook_url,
          webhook_method: automationData.webhook_method || 'POST',
          webhook_headers: automationData.webhook_headers || {},
          webhook_params: automationData.webhook_params || {},
          is_active: automationData.is_active ?? true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Mettre à jour l'état local
      setAutomations(prev => [data, ...prev]);

    } catch (error) {
      console.error('Error creating automation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de création';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const updateAutomation = useCallback(async (id: string, automationData: Partial<Automation>) => {
    if (!user) return;

    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('automations')
        .update({
          name: automationData.name,
          description: automationData.description,
          webhook_url: automationData.webhook_url,
          webhook_method: automationData.webhook_method,
          webhook_headers: automationData.webhook_headers,
          webhook_params: automationData.webhook_params,
          is_active: automationData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      setAutomations(prev => prev.map(auto => 
        auto.id === id ? { ...auto, ...data } : auto
      ));

    } catch (error) {
      console.error('Error updating automation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de mise à jour';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const deleteAutomation = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('automations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Mettre à jour l'état local
      setAutomations(prev => prev.filter(auto => auto.id !== id));

    } catch (error) {
      console.error('Error deleting automation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de suppression';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  return {
    automations,
    executions,
    loadingPage,
    executing,
    errorPage,
    executeAutomation,
    toggleAutomation,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    refreshData,
  };
}
