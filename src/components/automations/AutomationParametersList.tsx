import { useState } from 'react';
import { Automation } from '../../lib/types';
import { AutomationParameters } from './AutomationParameters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Settings, ChevronDown, ChevronRight } from 'lucide-react';

interface AutomationParametersListProps {
  automations: Automation[];
}

export function AutomationParametersList({ automations }: AutomationParametersListProps) {
  const [expandedAutomation, setExpandedAutomation] = useState<string | null>(null);

  const toggleAutomation = (automationId: string) => {
    setExpandedAutomation(
      expandedAutomation === automationId ? null : automationId
    );
  };

  if (automations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Aucune automatisation
        </h3>
        <p className="text-gray-400">
          Créez d'abord des automatisations pour pouvoir gérer leurs paramètres.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Paramètres des automatisations
        </h2>
        <p className="text-gray-400">
          Gérez les paramètres spécifiques à chaque automatisation.
        </p>
      </div>

      <div className="space-y-3">
        {automations.map((automation) => (
          <Card key={automation.id} className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">
                      {automation.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {automation.description || 'Aucune description'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        automation.is_active
                          ? 'bg-green-900/30 border border-green-700 text-green-300'
                          : 'bg-gray-700 border border-gray-600 text-gray-300'
                      }`}
                    >
                      {automation.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => toggleAutomation(automation.id)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  {expandedAutomation === automation.id ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span>Paramètres</span>
                </Button>
              </div>
            </div>

            {expandedAutomation === automation.id && (
              <div className="border-t border-gray-700 bg-gray-800/50">
                <div className="p-6">
                  <AutomationParameters
                    automationId={automation.id}
                    automationName={automation.name}
                  />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
