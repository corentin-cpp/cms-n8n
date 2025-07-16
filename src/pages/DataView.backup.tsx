import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuthOptimized';
import { formatDate } from '../lib/utils';
import { CSVImport } from '../lib/types';
import { Database, Eye, Trash2, Download } from 'lucide-react';

export function DataView() {
  const { user } = useAuth();
  const [imports, setImports] = useState<CSVImport[]>([]);
  const [selectedImport, setSelectedImport] = useState<CSVImport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadImports();
    }
  }, [user]);

  const loadImports = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('csv_imports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error) {
      console.error('Error loading imports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet import ?')) return;

    try {
      const { error } = await supabase
        .from('csv_imports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setImports(imports.filter(imp => imp.id !== id));
      if (selectedImport?.id === id) {
        setSelectedImport(null);
      }
    } catch (error) {
      console.error('Error deleting import:', error);
    }
  };

  const exportToCSV = (csvImport: CSVImport) => {
    const csvContent = [
      csvImport.columns.join(','),
      ...csvImport.data.map(row => 
        csvImport.columns.map(col => `"${row[col] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${csvImport.name}.csv`;
    link.click();
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
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Données CSV</h1>
        <p className="text-gray-400">
          Visualisez et gérez vos imports de données CSV
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Imports disponibles
          </h3>
          
          {imports.length === 0 ? (
            <p className="text-gray-400">Aucun import disponible</p>
          ) : (
            <div className="space-y-2">
              {imports.map((csvImport) => (
                <div
                  key={csvImport.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedImport?.id === csvImport.id
                      ? 'border-[#24B2A4] bg-[#24B2A4]/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedImport(csvImport)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{csvImport.name}</p>
                      <p className="text-sm text-gray-400">
                        {csvImport.data.length} lignes
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(csvImport.created_at)}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToCSV(csvImport);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(csvImport.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          {selectedImport ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  {selectedImport.name}
                </h3>
                <div className="text-sm text-gray-400">
                  {selectedImport.data.length} lignes • {selectedImport.columns.length} colonnes
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedImport.columns.map((col) => (
                        <TableHeaderCell key={col}>{col}</TableHeaderCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedImport.data.map((row, index) => (
                      <TableRow key={index}>
                        {selectedImport.columns.map((col) => (
                          <TableCell key={col}>{row[col] || ''}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                Sélectionnez un import pour visualiser les données
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}