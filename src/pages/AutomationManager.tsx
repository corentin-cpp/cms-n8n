import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../lib/utils';
import { Automation } from '../lib/types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export function AutomationManager() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    n8n_workflow_id: '',
    webhook_url: '',
    is_active: true,
  });

  const loadAutomations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      console.error('Error loading automations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAutomations();
    }
  }, [user, loadAutomations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        // Update existing automation
        const { error } = await supabase
          .from('automations')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new automation
        const { error } = await supabase
          .from('automations')
          .insert({
            ...formData,
            user_id: user.id,
          });

        if (error) throw error;
      }

      resetForm();
      loadAutomations();
    } catch (error) {
      console.error('Error saving automation:', error);
    }
  };

  const handleEdit = (automation: Automation) => {
    setFormData({
      name: automation.name,
      description: automation.description,
      n8n_workflow_id: automation.n8n_workflow_id || '',
      webhook_url: automation.webhook_url || '',
      is_active: automation.is_active,
    });
    setEditingId(automation.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette automatisation ?')) return;

    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadAutomations();
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      n8n_workflow_id: '',
      webhook_url: '',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#24B2A4] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Gestion des automatisations</h1>
          <p className="text-gray-400">
            Configurez et gérez vos automatisations N8N
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle automatisation</span>
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? 'Modifier' : 'Nouvelle'} automatisation
              </h3>
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="ID Workflow N8N"
                value={formData.n8n_workflow_id}
                onChange={(e) => setFormData({ ...formData, n8n_workflow_id: e.target.value })}
                placeholder="workflow-id-123"
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de l'automatisation"
            />

            <Input
              label="URL Webhook"
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              placeholder="https://your-n8n-instance.com/webhook/..."
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-700 bg-gray-800 text-[#24B2A4] focus:ring-[#24B2A4]"
              />
              <label htmlFor="is_active" className="text-sm text-gray-300">
                Automatisation active
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Modifier' : 'Créer'}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">
          Automatisations configurées
        </h3>

        {automations.length === 0 ? (
          <p className="text-gray-400">Aucune automatisation configurée</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Nom</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
                <TableHeaderCell>Créé le</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div className="font-medium text-white">{automation.name}</div>
                    {automation.n8n_workflow_id && (
                      <div className="text-sm text-gray-400">
                        ID: {automation.n8n_workflow_id}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-400 max-w-md truncate">
                      {automation.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      automation.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {automation.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-400">
                      {formatDate(automation.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(automation)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(automation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}