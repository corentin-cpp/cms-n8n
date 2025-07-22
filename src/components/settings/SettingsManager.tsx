import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorNotification } from '../ui/ErrorNotification';
import { SuccessNotification } from '../ui/SuccessNotification';
import { useSettings, SettingValue } from '../../hooks/useSettings';
import { Settings, Save, RefreshCw, Trash2 } from 'lucide-react';

interface SettingsManagerProps {
  category?: string;
  title?: string;
}

interface SettingFormData {
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object';
}

export function SettingsManager({ 
  category = 'automation', 
  title = 'Paramètres des automatisations' 
}: SettingsManagerProps) {
  const { 
    loading, 
    error, 
    setSetting, 
    deleteSetting, 
    getSettingsByCategory,
    refreshSettings 
  } = useSettings();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<SettingFormData>({
    key: '',
    value: '',
    description: '',
    type: 'string'
  });

  const categorySettings = getSettingsByCategory(category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let parsedValue: SettingValue;

      switch (formData.type) {
        case 'number':
          parsedValue = parseFloat(formData.value);
          if (isNaN(parsedValue)) {
            throw new Error('Valeur numérique invalide');
          }
          break;
        case 'boolean':
          parsedValue = formData.value.toLowerCase() === 'true';
          break;
        case 'object':
          try {
            parsedValue = JSON.parse(formData.value);
          } catch {
            throw new Error('JSON invalide');
          }
          break;
        default:
          parsedValue = formData.value;
      }

      await setSetting(category, formData.key, parsedValue, formData.description);
      
      setFormData({ key: '', value: '', description: '', type: 'string' });
      setShowForm(false);
      setSuccessMessage('Paramètre sauvegardé avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving setting:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le paramètre "${key}" ?`)) {
      return;
    }

    try {
      await deleteSetting(category, key);
      setSuccessMessage('Paramètre supprimé avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting setting:', err);
    }
  };

  const formatValue = (value: SettingValue): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getValueType = (value: SettingValue): string => {
    if (value === null) return 'null';
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="sm" className="mr-2" />
        <span className="text-gray-400">Chargement des paramètres...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <ErrorNotification error={error} onClose={() => {}} />
      )}

      {successMessage && (
        <SuccessNotification 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)} 
        />
      )}

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-[#24B2A4]" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshSettings}
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              Nouveau paramètre
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 p-4 border border-gray-600 rounded-lg bg-gray-800">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Clé"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="webhook_timeout"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      type: e.target.value as SettingFormData['type']
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#24B2A4] focus:border-transparent"
                  >
                    <option value="string">Texte</option>
                    <option value="number">Nombre</option>
                    <option value="boolean">Booléen</option>
                    <option value="object">Objet JSON</option>
                  </select>
                </div>
              </div>

              <Input
                label="Valeur"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={
                  formData.type === 'boolean' ? 'true ou false' :
                  formData.type === 'number' ? '30000' :
                  formData.type === 'object' ? '{"key": "value"}' :
                  'Valeur du paramètre'
                }
                required
              />

              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du paramètre"
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {Object.keys(categorySettings).length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Aucun paramètre configuré pour cette catégorie
            </p>
          ) : (
            Object.entries(categorySettings).map(([key, value]) => (
              <div key={key} className="p-4 border border-gray-600 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-white">{key}</h4>
                      <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                        {getValueType(value)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      <pre className="whitespace-pre-wrap bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                        {formatValue(value)}
                      </pre>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(key)}
                    className="text-red-400 hover:text-red-300"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
