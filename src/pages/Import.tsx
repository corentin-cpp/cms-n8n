import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorNotification } from '../components/ui/ErrorNotification';
import { SuccessNotification } from '../components/ui/SuccessNotification';
//import { CSVHelp } from '../components/ui/CSVHelp';
//import { CSVExample } from '../components/ui/CSVExample';
import { useCSVImport } from '../hooks/useCSVImport';
import { Upload, FileText, CheckCircle } from 'lucide-react';
 
export function Import() {
    //const [showHelp, setShowHelp] = useState(false);
  const {
    file,
    importName,
    loading,
    success,
    error,
    preview,
    setImportName,
    handleFileChange,
    handleImport,
    resetForm,
  } = useCSVImport();

  return (
    <div className="space-y-6">
      {error && (
        <ErrorNotification
          error={error}
          onClose={() => {}}
        />
      )}

      {success && (
        <SuccessNotification
          message="Import CSV réalisé avec succès !"
          onClose={() => {}}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Import CSV</h1>
        <p className="text-gray-400">
          Importez vos données depuis un fichier CSV
        </p>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">
          Sélectionner un fichier
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de l'import
            </label>
            <Input
              type="text"
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              placeholder="Nom de votre import"
              className="w-full"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fichier CSV
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {loading ? (
                    <>
                      <LoadingSpinner size="md" className="mb-2" />
                      <p className="text-sm text-gray-400">Analyse du fichier...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500">CSV uniquement (max 10 000 lignes)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          {file && (
            <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">{file.name}</span>
              <span className="text-gray-500 text-sm">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
        </div>
      </Card>

      {preview && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Aperçu des données
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {preview.columns.map((column, index) => (
                    <th key={index} className="text-left p-2 text-gray-300 font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.data.map((row, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    {preview.columns.map((column, colIndex) => (
                      <td key={colIndex} className="p-2 text-gray-400">
                        {String(row[column] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <p className="text-gray-500 text-sm">
              Aperçu des 5 premières lignes. Total: {preview.data.length}+ lignes
            </p>
            <div className="text-sm text-gray-400">
              <span className="font-medium">{preview.columns.length}</span> colonnes détectées
            </div>
          </div>
        </Card>
      )}

      {file && preview && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Confirmer l'import</h3>
              <p className="text-gray-400 text-sm">
                Prêt à importer {file.name} avec {preview.columns.length} colonnes
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={resetForm}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={loading || !importName.trim()}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Importation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Importer
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
