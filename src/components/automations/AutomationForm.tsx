import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Automation } from '../../lib/types';

interface AutomationFormProps {
  automation?: Automation;
  onSave: (automation: Partial<Automation>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function AutomationForm({ automation, onSave, onCancel, loading = false }: AutomationFormProps) {
  const [formData, setFormData] = useState({
    name: automation?.name || '',
    description: automation?.description || '',
    webhook_url: automation?.webhook_url || '',
    webhook_method: automation?.webhook_method || 'POST' as const,
    webhook_headers: automation?.webhook_headers || {},
    webhook_params: automation?.webhook_params || {},
    is_active: automation?.is_active ?? true,
  });

  const [headersText, setHeadersText] = useState(
    JSON.stringify(automation?.webhook_headers || {}, null, 2)
  );
  const [paramsText, setParamsText] = useState(
    JSON.stringify(automation?.webhook_params || {}, null, 2)
  );
  const [jsonErrors, setJsonErrors] = useState({ headers: '', params: '' });

  const handleHeadersChange = (value: string) => {
    setHeadersText(value);
    try {
      const parsed = JSON.parse(value || '{}');
      setFormData(prev => ({ ...prev, webhook_headers: parsed }));
      setJsonErrors(prev => ({ ...prev, headers: '' }));
    } catch {
      setJsonErrors(prev => ({ ...prev, headers: 'JSON invalide' }));
    }
  };

  const handleParamsChange = (value: string) => {
    setParamsText(value);
    try {
      const parsed = JSON.parse(value || '{}');
      setFormData(prev => ({ ...prev, webhook_params: parsed }));
      setJsonErrors(prev => ({ ...prev, params: '' }));
    } catch {
      setJsonErrors(prev => ({ ...prev, params: 'JSON invalide' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier les erreurs JSON
    if (jsonErrors.headers || jsonErrors.params) {
      return;
    }

    await onSave(formData);
  };

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nom de l'automatisation"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL Webhook *
            </label>
            <Input
              value={formData.webhook_url}
              onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
              placeholder="https://votre-n8n.com/webhook/..."
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description de l'automatisation"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#24B2A4] focus:border-transparent resize-none"
            rows={3}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Méthode HTTP *
          </label>
          <select
            value={formData.webhook_method}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              webhook_method: e.target.value as typeof formData.webhook_method 
            }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#24B2A4] focus:border-transparent"
            disabled={loading}
          >
            {httpMethods.map(method => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Headers HTTP (JSON)
            </label>
            <textarea
              value={headersText}
              onChange={(e) => handleHeadersChange(e.target.value)}
              placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'
              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#24B2A4] focus:border-transparent font-mono text-sm ${
                jsonErrors.headers ? 'border-red-500' : 'border-gray-600'
              }`}
              rows={6}
              disabled={loading}
            />
            {jsonErrors.headers && (
              <p className="text-red-400 text-sm mt-1">{jsonErrors.headers}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Paramètres Body/Query (JSON)
            </label>
            <textarea
              value={paramsText}
              onChange={(e) => handleParamsChange(e.target.value)}
              placeholder='{\n  "key1": "value1",\n  "key2": "value2"\n}'
              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#24B2A4] focus:border-transparent font-mono text-sm ${
                jsonErrors.params ? 'border-red-500' : 'border-gray-600'
              }`}
              rows={6}
              disabled={loading}
            />
            {jsonErrors.params && (
              <p className="text-red-400 text-sm mt-1">{jsonErrors.params}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            className="w-4 h-4 text-[#24B2A4] bg-gray-800 border-gray-600 rounded focus:ring-[#24B2A4] focus:ring-2"
            disabled={loading}
          />
          <label htmlFor="is_active" className="text-sm text-gray-300">
            Automatisation active
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !formData.name.trim() || !formData.webhook_url.trim() || !!jsonErrors.headers || !!jsonErrors.params}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sauvegarde...
              </>
            ) : (
              <>
                {automation ? 'Mettre à jour' : 'Créer'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
