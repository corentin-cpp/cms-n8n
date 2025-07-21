import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { LoadingState, LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorNotification } from '../components/ui/ErrorNotification';
import { SuccessNotification } from '../components/ui/SuccessNotification';
import { Modal } from '../components/ui/Modal';
import { AutomationForm } from '../components/automations/AutomationForm';
import { AutomationDetails } from '../components/automations/AutomationDetails';
import { useAutomations } from '../hooks/useAutomations';
import { formatDate } from '../lib/utils';
import { Automation } from '../lib/types';
import { Play, Pause, Activity, AlertCircle, CheckCircle, RefreshCw, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Papa from 'papaparse';
import { json2csv } from 'json-2-csv';

export function Automations() {
  const {
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
  } = useAutomations();
  const { user } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false)
  const [messageImport, setMessageImport] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const handleExecuteAutomation = async (automation: Automation) => {
    try {
      await executeAutomation(automation);
      setLocalError(null);
      setSuccessMessage(`Automatisation "${automation.name}" exécutée avec succès`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d\'exécution';
      setLocalError(errorMessage);
    }
  };

  const handleToggleAutomation = async (automation: Automation) => {
    try {
      setLocalError(null);
      await toggleAutomation(automation);
      const action = automation.is_active ? 'désactivée' : 'activée';
      setSuccessMessage(`Automatisation "${automation.name}" ${action} avec succès`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de basculement';
      setLocalError(errorMessage);
    }
  };

  const handleCreateAutomation = async (automationData: Partial<Automation>) => {
    setFormLoading(true);
    try {
      setLocalError(null);
      await createAutomation(automationData);
      setShowForm(false);
      setSuccessMessage('Automatisation créée avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de création';
      setLocalError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateAutomation = async (automationData: Partial<Automation>) => {
    if (!editingAutomation) return;

    setFormLoading(true);
    try {
      setLocalError(null);
      await updateAutomation(editingAutomation.id, automationData);
      setEditingAutomation(null);
      setShowForm(false);
      setSuccessMessage('Automatisation mise à jour avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de mise à jour';
      setLocalError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAutomation = async (automation: Automation) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'automatisation "${automation.name}" ?`)) {
      return;
    }

    try {
      setLocalError(null);
      await deleteAutomation(automation.id);
      if (selectedAutomation?.id === automation.id) {
        setSelectedAutomation(null);
      }
      setSuccessMessage('Automatisation supprimée avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de suppression';
      setLocalError(errorMessage);
    }
  };

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAutomation(null);
  };

  const handleImportCsv = () => {
    setShowImportModal(true);
  }

  const handleImportSubmit = async () => {
    console.log('Importing execution data:', executionId);
    //Convert json to csv
    const { data: parseData, error: parseError } = await supabase
      .from('automation_executions')
      .select('*').eq('id', executionId);
    if (parseError) {
      setError(`Erreur lors de la récupération des données d'exécution : ${parseError.message}`);
      return;
    }

    console.log('Parsed data:', parseData);

    let columns: string[] = [];
    let data: Record<string, unknown>[] = [];


    try {
      const csv = json2csv(parseData[0]?.execution_data ?? []);

      await new Promise<void>((resolve, reject) => {
        Papa.parse<Record<string, unknown>>(csv, {
          header: true,
          skipEmptyLines: true,
          worker: false,
          complete: (results) => {
            columns = results.meta.fields || [];
            data = results.data;
            resolve();
          },
          error: (err: unknown) => {
            reject(err);
          }
        });
      });
    } catch (err) {
      setError(`Erreur lors de la conversion des données en CSV : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      return;
    }
    
    const totalRows = data.length;
    const validRows = data.filter(row => Object.values(row).some(value => value && String(value).trim() !== ''));
    // Limite de lignes
    if (totalRows > 10000) {
      setError('Le fichier contient trop de lignes (maximum 10 000). Divisez-le en plusieurs fichiers plus petits');
      setLoading(false);
      return;
    }
    if (columns.length === 0) {
      setError('Aucune colonne détectée');
      setLoading(false);
      return;
    }
    if (validRows.length === 0) {
      setError('Aucune ligne contenant des données valides trouvée');
      setLoading(false);
      return;
    }
    if (validRows.length < totalRows * 0.5) {
      setError(`Trop de lignes vides ou invalides (${totalRows - validRows.length} sur ${totalRows}). Vérifiez le format de votre fichier`);
      setLoading(false);
      return;
    }
    // Enregistrement en base
    const { error: insertError } = await supabase
      .from('csv_imports')
      .insert({
        user_id: user?.id,
        name: Date.now().toString() + "_converter",
        filename: Date.now().toString() + "_converter",
        columns,
        data: validRows,
      });
    if (insertError) {
      console.error('Database error:', insertError);
      if (insertError.code === '23505') {
        setError('Un import avec ce nom existe déjà. Choisissez un autre nom');
      } else if (insertError.message.includes('permission')) {
        setError('Vous n\'avez pas les permissions pour effectuer cet import');
      } else {
        setError(`Erreur de base de données : ${insertError.message}`);
      }
      setMessageImport("Import terminé sans erreurs");
      return;
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-400" />;
      default:
        return null;
    }
  };

  if (loadingPage) {
    return <LoadingState message="Chargement des automatisations..." />;
  }

  // Supprimé le return conditionnel qui causait le rafraîchissement

  return (
    <div className="space-y-6">
      {(errorPage || localError) && (
        <ErrorNotification
          error={errorPage || localError || ''}
          onClose={() => setLocalError(null)}
        />
      )}

      {successMessage && (
        <SuccessNotification
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Automatisations</h1>
          <p className="text-gray-400">
            Gérez et supervisez vos automatisations N8N
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle automatisation
          </Button>
        </div>
      </div>

      {selectedAutomation ? (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedAutomation(null)}>
              ← Retour à la liste
            </Button>
          </div>
          <AutomationDetails
            automation={selectedAutomation}
            onEdit={() => handleEdit(selectedAutomation)}
            onExecute={() => handleExecuteAutomation(selectedAutomation)}
            onToggle={() => handleToggleAutomation(selectedAutomation)}
            executing={executing === selectedAutomation.id}
          />
        </div>
      ) : (
        <>
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Automatisations disponibles
            </h3>

            {automations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 mb-4">Aucune automatisation configurée</p>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer votre première automatisation
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Nom</TableHeaderCell>
                    <TableHeaderCell>Méthode</TableHeaderCell>
                    <TableHeaderCell>Statut</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map((automation) => (
                    <TableRow key={automation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{automation.name}</div>
                          <div className="text-sm text-gray-400 max-w-md truncate">
                            {automation.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${automation.webhook_method === 'GET' ? 'bg-green-900 text-green-300' :
                          automation.webhook_method === 'POST' ? 'bg-blue-900 text-blue-300' :
                            automation.webhook_method === 'PUT' ? 'bg-yellow-900 text-yellow-300' :
                              automation.webhook_method === 'DELETE' ? 'bg-red-900 text-red-300' :
                                'bg-purple-900 text-purple-300'
                          }`}>
                          {automation.webhook_method}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${automation.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {automation.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAutomation(automation)}
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleExecuteAutomation(automation)}
                            disabled={executing === automation.id || !automation.is_active}
                            title="Exécuter"
                          >
                            {executing === automation.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(automation)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAutomation(automation)}
                            title={automation.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {automation.is_active ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAutomation(automation)}
                            className="text-red-400 hover:text-red-300"
                            title="Supprimer"
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

          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Exécutions récentes
            </h3>

            {executions.length === 0 ? (
              <p className="text-gray-400">Aucune exécution récente</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Automatisation</TableHeaderCell>
                    <TableHeaderCell>Statut</TableHeaderCell>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Result</TableHeaderCell>
                    <TableHeaderCell>Erreur</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <div className="font-medium text-white">
                          {execution.automations.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(execution.status)}
                          <span className="capitalize">{execution.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-400">
                          {formatDate(execution.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <>
                          <div className="text-red-400 max-w-md truncate">
                            <Button onClick={() => {
                              setExecutionId(execution.id);
                              handleImportCsv();
                            }}>
                              Ajouter en CSV
                            </Button>
                          </div>
                        </>
                      </TableCell>
                      <TableCell>
                        <div className="text-red-400 max-w-md truncate">
                          {execution.error_message || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* Modal d'import CSV */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import CSV"
        size="lg"
      >
        {loading && (
          <LoadingSpinner size='sm' />
        )}
        <div className="space-y-4">
          {error && (
            <p className='text-red'>{error}</p>
          )}
          {messageImport && (
            <p className='text-green'>{messageImport}</p>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowImportModal(false)}
            >
              Annuler
            </Button>
            <Button variant="primary" onClick={handleImportSubmit}>
              Importer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal pour le formulaire d'automatisation */}
      <Modal
        isOpen={showForm}
        onClose={handleCancelForm}
        title={editingAutomation ? 'Modifier l\'automatisation' : 'Nouvelle automatisation'}
        size="xl"
      >
        <AutomationForm
          automation={editingAutomation || undefined}
          onSave={editingAutomation ? handleUpdateAutomation : handleCreateAutomation}
          onCancel={handleCancelForm}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}