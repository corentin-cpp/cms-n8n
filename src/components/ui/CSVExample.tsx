import { Button } from './Button';

export function CSVExample() {
  const downloadExample = () => {
    const csvContent = `nom,email,telephone,entreprise,poste
"Jean Dupont",jean.dupont@example.com,0123456789,"Entreprise ABC","Directeur Commercial"
"Marie Martin",marie.martin@example.com,0987654321,"Société XYZ","Responsable Marketing"
"Pierre, Durand",pierre.durand@example.com,0147258369,"Startup Tech","Développeur Senior"
"Sophie ""Super"" Laurent",sophie.laurent@example.com,0192837465,"Conseil & Co","Consultante"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'exemple-import.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="mb-4">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={downloadExample}
        className="flex items-center gap-2"
      >
        📥 Télécharger un exemple de fichier CSV
      </Button>
      <p className="text-xs text-gray-400 mt-1">
        Utilisez ce fichier comme modèle pour vos imports
      </p>
    </div>
  );
}
