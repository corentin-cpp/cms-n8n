import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/LoadingSpinner';
import { ErrorNotification } from '../components/ui/ErrorNotification';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { Database, FileUp, Settings, Activity, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useState } from 'react';

export function Dashboard() {
  const { stats, loading, error, refreshStats } = useDashboardStats();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setLocalError(null);
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de rafraîchissement';
      setLocalError(errorMessage);
    }
  };

  if (loading) {
    return <LoadingState message="Chargement du tableau de bord..." />;
  }

  const statCards = [
    {
      title: 'Imports CSV',
      value: stats.csvImports,
      icon: FileUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Automatisations',
      value: stats.automations,
      icon: Settings,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Automatisations Actives',
      value: stats.activeAutomations,
      icon: Activity,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Exécutions (24h)',
      value: stats.recentExecutions,
      icon: Database,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {(error || localError) && (
        <ErrorNotification
          error={error || localError || ''}
          onClose={() => setLocalError(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Tableau de bord</h1>
          <p className="text-gray-400">
            Vue d'ensemble de votre plateforme CRM et automatisations
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Activité récente
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div>
                <p className="text-white text-sm">Système opérationnel</p>
                <p className="text-gray-400 text-xs">Tous les services fonctionnent normalement</p>
              </div>
            </div>
            {stats.recentExecutions > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">{stats.recentExecutions} exécutions récentes</p>
                  <p className="text-gray-400 text-xs">Dernières 24 heures</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Actions rapides
          </h3>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white">
              <FileUp className="w-4 h-4 mr-3" />
              Importer des données CSV
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white">
              <Settings className="w-4 h-4 mr-3" />
              Gérer les automatisations
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white">
              <Database className="w-4 h-4 mr-3" />
              Voir les données
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}