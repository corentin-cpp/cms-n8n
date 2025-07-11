import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function parseCSV(csvText: string): { columns: string[]; data: Record<string, unknown>[] } {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('Le contenu du fichier CSV est vide ou invalide');
  }

  // Nettoyer le texte et diviser en lignes
  const lines = csvText.trim().split(/\r?\n/);
  
  if (lines.length === 0) {
    throw new Error('Le fichier CSV est vide');
  }
  
  if (lines.length === 1) {
    throw new Error('Le fichier CSV doit contenir au moins une ligne de données en plus de l\'en-tête');
  }

  // Parser les colonnes (en-tête)
  const headerLine = lines[0];
  if (!headerLine.trim()) {
    throw new Error('La ligne d\'en-tête est vide');
  }

  const columns = parseCSVLine(headerLine);
  
  if (columns.length === 0) {
    throw new Error('Aucune colonne trouvée dans l\'en-tête');
  }

  // Vérifier les doublons dans les colonnes
  const uniqueColumns = new Set(columns);
  if (uniqueColumns.size !== columns.length) {
    throw new Error('Les noms de colonnes doivent être uniques');
  }

  // Parser les données
  const data: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Ignorer les lignes vides
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      const row: Record<string, unknown> = {};
      
      columns.forEach((col, index) => {
        row[col] = values[index] || '';
      });
      
      data.push(row);
    } catch (error) {
      errors.push(`Ligne ${i + 1}: ${error instanceof Error ? error.message : 'Erreur de parsing'}`);
    }
  }

  // Si plus de 10% des lignes ont des erreurs, arrêter le processus
  if (errors.length > 0 && errors.length / lines.length > 0.1) {
    throw new Error(`Trop d'erreurs de parsing: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
  }

  if (data.length === 0) {
    throw new Error('Aucune ligne de données valide trouvée');
  }

  return { columns, data };
}

// Fonction utilitaire pour parser une ligne CSV en gérant les guillemets et virgules
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Guillemet échappé ""
        current += '"';
        i += 2;
      } else {
        // Début ou fin de guillemets
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Séparateur de colonne
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Ajouter la dernière valeur
  result.push(current.trim());

  return result;
}