import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { parseCSV } from '../lib/utils';
import Papa from 'papaparse';

interface CSVPreview {
  columns: string[];
  data: Record<string, unknown>[];
}

interface UseCSVImportReturn {
  file: File | null;
  importName: string;
  loading: boolean;
  success: boolean;
  error: string;
  preview: CSVPreview | null;
  progress: number; // Pourcentage d'avancement
  setImportName: (name: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleImport: () => Promise<void>;
  resetForm: () => void;
}

export function useCSVImport(): UseCSVImportReturn {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<CSVPreview | null>(null);
  const [progress, setProgress] = useState(0); // Pourcentage d'avancement

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validation du fichier
    if (selectedFile.size === 0) {
      setError('Le fichier sélectionné est vide');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB max
      setError('Le fichier est trop volumineux (maximum 50MB)');
      return;
    }

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier CSV valide');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess(false);
    setImportName(selectedFile.name.replace('.csv', ''));

    // Preview the CSV with enhanced error handling
    try {
      setLoading(true);
      const text = await selectedFile.text();
      
      // Validation du contenu
      if (!text.trim()) {
        throw new Error('Le fichier CSV est vide');
      }

      // Détecter l'encodage (basique)
      if (text.includes('�')) {
        throw new Error('Le fichier semble avoir un problème d\'encodage. Assurez-vous qu\'il est en UTF-8');
      }

      const parsed = parseCSV(text);      
      // Validation des données parsées
      if (parsed.columns.length === 0) {
        throw new Error('Aucune colonne détectée dans le fichier');
      }

      if (parsed.data.length === 0) {
        throw new Error('Aucune ligne de données trouvée');
      }

      // Vérifier que les colonnes ne sont pas toutes vides
      const hasData = parsed.columns.some(col => 
        parsed.data.some(row => row[col] && String(row[col]).trim() !== '')
      );

      if (!hasData) {
        throw new Error('Aucune donnée valide trouvée dans le fichier');
      }

      setPreview({
        columns: parsed.columns,
        data: parsed.data.slice(0, 5), // Only show first 5 rows for performance
      });
    } catch (err) {
      console.error('Error parsing CSV:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur de lecture du fichier';
      
      // Messages d'erreur plus spécifiques
      if (errorMessage.includes('quotes') || errorMessage.includes('guillemets')) {
        setError('Problème de formatage CSV : vérifiez que les guillemets sont correctement échappés');
      } else if (errorMessage.includes('column') || errorMessage.includes('colonne')) {
        setError('Problème avec les colonnes : ' + errorMessage);
      } else if (errorMessage.includes('ligne') || errorMessage.includes('Ligne')) {
        setError('Erreur de format : ' + errorMessage);
      } else if (errorMessage.includes('encodage')) {
        setError(errorMessage + '. Essayez de sauvegarder le fichier en UTF-8 depuis Excel ou votre éditeur');
      } else {
        setError(errorMessage);
      }
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file || !user || !importName.trim()) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }
    setLoading(true);
    setError('');
    setProgress(0);
    // Optimisation : parsing synchrone pour les petits fichiers (<1000 lignes)
    const fileText = await file.text();
    let columns: string[] = [];
    let data: Record<string, unknown>[] = [];
    await new Promise<void>((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(fileText, {
        header: true,
        skipEmptyLines: true,
        worker: false,
        complete: (results) => {
          columns = results.meta.fields || [];
          data = results.data;
          resolve();
        },
        error: (err) => {
          reject(err);
        }
      });
    });
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
        user_id: user.id,
        name: importName.trim(),
        filename: file.name,
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
      setLoading(false);
      return;
    }
    setSuccess(true);
    setFile(null);
    setImportName('');
    setPreview(null);
    setProgress(100);
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
    setLoading(false);
  }, [file, user, importName]);

  const resetForm = useCallback(() => {
    setFile(null);
    setImportName('');
    setLoading(false);
    setSuccess(false);
    setError('');
    setPreview(null);
    setProgress(0);
  }, []);

  return {
    file,
    importName,
    loading,
    success,
    error,
    preview,
    progress,
    setImportName,
    handleFileChange,
    handleImport,
    resetForm,
  };
}
