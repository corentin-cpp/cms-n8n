import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorNotification } from '../components/ui/ErrorNotification';
import { SuccessNotification } from '../components/ui/SuccessNotification';
import { useCSVImport } from '../hooks/useCSVImport';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export function Import() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ columns: string[]; data: Record<string, any>[] } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv') {
      setError('Veuillez sélectionner un fichier CSV');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess(false);
    setImportName(selectedFile.name.replace('.csv', ''));

    // Preview the CSV
    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setPreview({
        columns: parsed.columns,
        data: parsed.data.slice(0, 5), // Only show first 5 rows
      });
    } catch (err: any) {
      setError(err.message);
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!file || !user || !importName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      const { error: insertError } = await supabase
        .from('csv_imports')
        .insert({
          user_id: user.id,
          name: importName.trim(),
          filename: file.name,
          columns: parsed.columns,
          data: parsed.data,
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setFile(null);
      setImportName('');
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Import CSV</h1>
        <p className="text-gray-400">
          Importez vos données CSV pour les utiliser dans vos automatisations
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de l'import
            </label>
            <Input
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              placeholder="Mon import de données"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fichier CSV
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-gray-400">
                  {file ? file.name : 'Cliquez pour sélectionner un fichier CSV'}
                </span>
              </label>
            </div>
          </div>

          {preview && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Aperçu des données
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {preview.columns.map((col, index) => (
                        <th key={index} className="text-left p-2 text-gray-300">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.data.map((row, index) => (
                      <tr key={index} className="border-b border-gray-800">
                        {preview.columns.map((col, colIndex) => (
                          <td key={colIndex} className="p-2 text-gray-400">
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Aperçu des 5 premières lignes sur {preview.data.length} total
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Import réussi ! Vous pouvez maintenant visualiser vos données.
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleImport}
              disabled={!file || !importName.trim() || loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Import en cours...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Importer</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}