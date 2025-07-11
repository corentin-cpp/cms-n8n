import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Automation } from '../../lib/types';
import { Edit, Play, Pause, Globe, Code, Settings } from 'lucide-react';

interface AutomationDetailsProps {
  automation: Automation;
  onEdit: () => void;
  onExecute: () => void;
  onToggle: () => void;
  executing?: boolean;
}

export function AutomationDetails({ 
  automation, 
  onEdit, 
  onExecute, 
  onToggle, 
  executing = false 
}: AutomationDetailsProps) {
  const hasHeaders = automation.webhook_headers && Object.keys(automation.webhook_headers).length > 0;
  const hasParams = automation.webhook_params && Object.keys(automation.webhook_params).length > 0;

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{automation.name}</h3>
          <p className="text-gray-400 mt-1">{automation.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onExecute}
            disabled={executing || !automation.is_active}
          >
            <Play className="w-4 h-4 mr-2" />
            {executing ? 'Exécution...' : 'Exécuter'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {automation.is_active ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Désactiver
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Activer
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Configuration Webhook
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">URL</label>
              <p className="text-sm text-white font-mono break-all bg-gray-800/50 p-2 rounded">
                {automation.webhook_url}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Méthode</label>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                automation.webhook_method === 'GET' ? 'bg-green-900 text-green-300' :
                automation.webhook_method === 'POST' ? 'bg-blue-900 text-blue-300' :
                automation.webhook_method === 'PUT' ? 'bg-yellow-900 text-yellow-300' :
                automation.webhook_method === 'DELETE' ? 'bg-red-900 text-red-300' :
                'bg-purple-900 text-purple-300'
              }`}>
                {automation.webhook_method}
              </span>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Statut</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  automation.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {automation.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres Avancés
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center">
                <Code className="w-3 h-3 mr-1" />
                Headers HTTP
              </label>
              {hasHeaders ? (
                <pre className="text-xs text-gray-300 bg-gray-800/50 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(automation.webhook_headers, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-gray-500 italic mt-1">Aucun header configuré</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center">
                <Code className="w-3 h-3 mr-1" />
                Paramètres Body/Query
              </label>
              {hasParams ? (
                <pre className="text-xs text-gray-300 bg-gray-800/50 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(automation.webhook_params, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-gray-500 italic mt-1">Aucun paramètre configuré</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
