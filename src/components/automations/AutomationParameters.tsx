import { useState } from 'react';
import { useAutomationSettings } from '../../hooks/useAutomationSettings';
import { Setting, SettingValue } from '../../hooks/useSettings';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AutomationParametersProps {
  automationId: string;
  automationName: string;
}

export function AutomationParameters({ automationId, automationName }: AutomationParametersProps) {
  const {
    linkedSettings,
    availableSettings,
    loading,
    error,
    linkSettingToAutomation,
    unlinkSettingFromAutomation,
    refreshAutomationSettings
  } = useAutomationSettings(automationId);

  const [selectedSettingId, setSelectedSettingId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLinkSetting = async () => {
    if (!selectedSettingId) return;

    try {
      setActionLoading(true);
      await linkSettingToAutomation(automationId, selectedSettingId);
      setSelectedSettingId('');
      setSuccessMessage('Paramètre lié avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la liaison:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkSetting = async (settingId: string) => {
    try {
      setActionLoading(true);
      await unlinkSettingFromAutomation(automationId, settingId);
      setSuccessMessage('Paramètre délié avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la suppression de la liaison:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const renderSettingValue = (value: SettingValue): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatSettingKey = (setting: Setting): string => {
    return `${setting.category}.${setting.key}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">
          Paramètres de l'automatisation : {automationName}
        </h3>
        <Button
          onClick={refreshAutomationSettings}
          variant="ghost"
          size="sm"
          disabled={loading}
        >
          Actualiser
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <p className="text-green-300 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Section des paramètres liés */}
      <Card className="p-6">
        <h4 className="text-base font-medium text-white mb-4">
          Paramètres actuellement liés ({linkedSettings.length})
        </h4>
        
        {linkedSettings.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Aucun paramètre n'est actuellement lié à cette automatisation.
          </p>
        ) : (
          <div className="space-y-3">
            {linkedSettings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-start justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm text-white">
                      {formatSettingKey(setting)}
                    </span>
                    {setting.description && (
                      <span className="text-xs text-gray-400">
                        - {setting.description}
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded border border-gray-600 overflow-x-auto">
                      {renderSettingValue(setting.value)}
                    </pre>
                  </div>
                </div>
                <Button
                  onClick={() => handleUnlinkSetting(setting.id)}
                  variant="danger"
                  size="sm"
                  disabled={actionLoading}
                  className="ml-3"
                >
                  Délier
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Section pour ajouter de nouveaux paramètres */}
      <Card className="p-6">
        <h4 className="text-base font-medium text-white mb-4">
          Ajouter un paramètre
        </h4>
        
        {availableSettings.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Tous les paramètres disponibles sont déjà liés à cette automatisation.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="setting-select" className="block text-sm font-medium text-gray-300 mb-2">
                Sélectionner un paramètre à lier
              </label>
              <select
                id="setting-select"
                value={selectedSettingId}
                onChange={(e) => setSelectedSettingId(e.target.value)}
                className="block w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-[#24B2A4] focus:border-[#24B2A4]"
              >
                <option value="">-- Choisir un paramètre --</option>
                {availableSettings.map((setting) => (
                  <option key={setting.id} value={setting.id}>
                    {formatSettingKey(setting)}
                    {setting.description && ` - ${setting.description}`}
                  </option>
                ))}
              </select>
            </div>

            {selectedSettingId && (
              <div className="mt-3">
                {(() => {
                  const selectedSetting = availableSettings.find(s => s.id === selectedSettingId);
                  if (!selectedSetting) return null;
                  
                  return (
                    <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <p className="text-sm text-blue-300 font-medium mb-2">
                        Aperçu du paramètre sélectionné :
                      </p>
                      <pre className="text-xs text-blue-200 bg-blue-900/30 p-2 rounded border border-blue-600 overflow-x-auto">
                        {renderSettingValue(selectedSetting.value)}
                      </pre>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleLinkSetting}
                disabled={!selectedSettingId || actionLoading}
                size="sm"
              >
                {actionLoading ? 'Liaison en cours...' : 'Lier le paramètre'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
