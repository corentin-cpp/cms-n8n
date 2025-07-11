import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { CSVImport } from '../lib/types';

interface UseDataViewReturn {
  imports: CSVImport[];
  selectedImport: CSVImport | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  setSelectedImport: (importData: CSVImport | null) => void;
  setCurrentPage: (page: number) => void;
  setSearchTerm: (term: string) => void;
  refreshImports: () => Promise<void>;
  deleteImport: (id: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 50;

export function useDataView(): UseDataViewReturn {
  const { user } = useAuth();
  const [imports, setImports] = useState<CSVImport[]>([]);
  const [selectedImport, setSelectedImport] = useState<CSVImport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const loadImports = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('csv_imports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setImports(data || []);
    } catch (err) {
      console.error('Error loading imports:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshImports = useCallback(async () => {
    await loadImports();
  }, [loadImports]);

  const deleteImport = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('csv_imports')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Mettre à jour l'état local
      setImports(prev => prev.filter(imp => imp.id !== id));
      
      // Si l'import supprimé était sélectionné, le désélectionner
      if (selectedImport?.id === id) {
        setSelectedImport(null);
      }

    } catch (err) {
      console.error('Error deleting import:', err);
      setError(err instanceof Error ? err.message : 'Erreur de suppression');
      throw err;
    }
  }, [user, selectedImport]);

  useEffect(() => {
    if (user) {
      loadImports();
    }
  }, [user, loadImports]);

  // Filtrer les données selon le terme de recherche
  const filteredImports = imports.filter(imp =>
    imp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    imp.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer la pagination pour les données filtrées
  const totalPages = Math.ceil(filteredImports.length / ITEMS_PER_PAGE);
  
  // S'assurer que la page courante est valide
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  return {
    imports: filteredImports,
    selectedImport,
    loading,
    error,
    currentPage: validCurrentPage,
    totalPages,
    searchTerm,
    setSelectedImport,
    setCurrentPage,
    setSearchTerm,
    refreshImports,
    deleteImport,
  };
}
