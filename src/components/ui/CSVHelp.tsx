import { useState } from 'react';
import { Button } from './Button';

export function CSVHelp() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="mb-4"
      >
        💡 Aide pour le format CSV
      </Button>
    );
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-medium text-blue-900">Guide du format CSV</h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </Button>
      </div>

      <div className="space-y-4 text-sm text-blue-800">
        <div>
          <h4 className="font-semibold mb-2">✅ Format recommandé :</h4>
          <ul className="space-y-1 ml-4">
            <li>• Première ligne : noms des colonnes</li>
            <li>• Séparateur : virgule (,)</li>
            <li>• Encodage : UTF-8</li>
            <li>• Maximum : 10 000 lignes, 50MB</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">📝 Exemple correct :</h4>
          <div className="bg-white p-2 rounded border font-mono text-xs">
            nom,email,telephone<br/>
            "Jean Dupont",jean@example.com,0123456789<br/>
            "Marie, Martin",marie@example.com,0987654321
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">⚠️ Problèmes courants :</h4>
          <ul className="space-y-1 ml-4">
            <li>• <strong>Virgules dans les données :</strong> utilisez des guillemets "valeur, avec virgule"</li>
            <li>• <strong>Guillemets dans les données :</strong> échappez avec "" (double guillemet)</li>
            <li>• <strong>Caractères spéciaux :</strong> sauvegardez en UTF-8 depuis Excel</li>
            <li>• <strong>Lignes vides :</strong> évitez les lignes vides entre les données</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">🔧 Depuis Excel :</h4>
          <ol className="space-y-1 ml-4">
            <li>1. Fichier → Enregistrer sous</li>
            <li>2. Format : CSV UTF-8 (délimité par des virgules)</li>
            <li>3. Vérifiez l'aperçu avant d'importer</li>
          </ol>
        </div>

        <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
          <p className="font-semibold text-yellow-800">💡 Conseil :</p>
          <p className="text-yellow-700">
            Testez d'abord avec un petit fichier (quelques lignes) pour vérifier le format 
            avant d'importer un gros volume de données.
          </p>
        </div>
      </div>
    </div>
  );
}
