import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { LoadingState } from '../components/ui/LoadingSpinner';
import { ErrorNotification } from '../components/ui/ErrorNotification';
import { useDataView } from '../hooks/useDataView';
import { formatDate } from '../lib/utils';
import { CSVImport } from '../lib/types';
import { Database, Eye, Trash2, Download, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export function DataView() {
  const {
    imports,
    selectedImport,
    loading,
    error,
    currentPage,
    totalPages,
    searchTerm,
    setSelectedImport,
    setCurrentPage,
    setSearchTerm,
    refreshImports,
    deleteImport,
  } = useDataView();
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'import "${name}" ?`)) return;

    setDeleting(id);
    try {
      setLocalError(null);
      await deleteImport(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de suppression';
      setLocalError(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = (importData: CSVImport) => {
    try {
      // Convertir les données en CSV
      const csvContent = [
        importData.columns.join(','),
        ...importData.data.map(row => 
          importData.columns.map(col => {
            const value = row[col] || '';
            // Échapper les guillemets et virgules
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${importData.name}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setLocalError('Erreur lors de l\'export');
    }
  };

  const handleRefresh = async () => {
    try {
      setLocalError(null);
      await refreshImports();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de rafraîchissement';
      setLocalError(errorMessage);
    }
  };

  // Pagination des éléments affichés
  const startIndex = (currentPage - 1) * 50;
  const endIndex = startIndex + 50;
  const paginatedImports = imports.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingState message="Chargement des données..." />;
  }

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
          <h1 className="text-2xl font-bold text-white mb-2">Visualisation des données</h1>
          <p className="text-gray-400">
            Consultez et gérez vos imports CSV
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des imports */}
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Imports CSV</h3>
              <span className="text-sm text-gray-400">
                {imports.length} import{imports.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Barre de recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un import..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset à la première page lors de la recherche
                }}
                className="pl-10"
              />
            </div>

            {paginatedImports.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">
                  {searchTerm ? 'Aucun import trouvé' : 'Aucun import disponible'}
                </p>
                {!searchTerm && (
                  <p className="text-gray-500 text-sm">
                    Importez un fichier CSV pour commencer
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {paginatedImports.map((importData) => (
                    <div
                      key={importData.id}
                      onClick={() => setSelectedImport(importData)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedImport?.id === importData.id
                          ? 'bg-[#24B2A4]/10 border border-[#24B2A4]/30'
                          : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">
                            {importData.name}
                          </h4>
                          <p className="text-sm text-gray-400 truncate">
                            {importData.filename}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                              {importData.data.length} lignes
                            </span>
                            <span className="text-xs text-gray-500">
                              {importData.columns.length} colonnes
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExport(importData);
                            }}
                            className="p-1"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(importData.id, importData.name);
                            }}
                            disabled={deleting === importData.id}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        {/* Détails de l'import */}
        <div className="lg:col-span-2">
          {selectedImport ? (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedImport.name}</h3>
                  <p className="text-gray-400 text-sm">
                    Importé le {formatDate(selectedImport.created_at)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport(selectedImport)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {selectedImport.data.length}
                  </div>
                  <div className="text-sm text-gray-400">Lignes</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {selectedImport.columns.length}
                  </div>
                  <div className="text-sm text-gray-400">Colonnes</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {((JSON.stringify(selectedImport.data).length) / 1024).toFixed(1)} KB
                  </div>
                  <div className="text-sm text-gray-400">Taille</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedImport.columns.map((column, index) => (
                        <TableHeaderCell key={index}>{column}</TableHeaderCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedImport.data.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        {selectedImport.columns.map((column, colIndex) => (
                          <TableCell key={colIndex}>
                            <div className="max-w-xs truncate">
                              {String(row[column] || '')}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedImport.data.length > 10 && (
                <p className="text-sm text-gray-500 mt-4">
                  Affichage des 10 premières lignes sur {selectedImport.data.length} total
                </p>
              )}
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-96">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Sélectionnez un import
                </h3>
                <p className="text-gray-400">
                  Choisissez un import dans la liste pour voir ses données
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
