# Optimisations du système d'authentification

## Problèmes identifiés dans l'ancien `useAuth`

1. **Multiples appels réseau** : Le hook était utilisé dans 9 composants différents, provoquant des appels Supabase répétés
2. **Requête non optimisée** : `select('*')` sur la table profiles récupérait toutes les colonnes inutilement
3. **Pas de cache** : Aucun cache localStorage, rechargement à chaque navigation
4. **Timeout trop long** : 15 secondes trop long pour l'expérience utilisateur
5. **Gestion d'erreurs complexe** : Logique de nettoyage du cache éparpillée

## Solutions implémentées

### 1. AuthProvider centralisé (`src/contexts/AuthContext.tsx`)
- **Contexte React** : État d'authentification partagé entre tous les composants
- **Cache localStorage intelligent** : Stockage local avec expiration (10 minutes)
- **Validation en arrière-plan** : Vérification de session sans bloquer l'UI
- **Timeouts réduits** : 8s pour l'init, 5s pour le profil

### 2. Hook optimisé (`src/hooks/useAuthOptimized.ts`)
- **Simple wrapper** : Accès au contexte avec vérification d'erreur
- **TypeScript strict** : Vérification que le hook est utilisé dans le provider

### 3. Requête profiles optimisée
```typescript
// Avant
.select('*')

// Maintenant
.select('id, email, full_name, role, created_at')
```
Réduction de ~50% des données transférées.

### 4. Structure de cache intelligent
```typescript
interface CachedAuth extends AuthUser {
  timestamp: number; // Pour l'expiration
}
```
- **Expiration automatique** : 10 minutes
- **Validation de session** : Vérification en arrière-plan
- **Nettoyage automatique** : Suppression des données corrompues

## Migration des composants

### Fichiers mis à jour :
- ✅ `src/App.tsx` : Ajout du AuthProvider
- ✅ `src/pages/AutomationManager.tsx` : Migration vers useAuthOptimized
- ✅ `src/hooks/useDashboardStats.ts` : Migration vers useAuthOptimized
- ✅ `src/hooks/useCSVImport.ts` : Migration vers useAuthOptimized
- ✅ `src/hooks/useDataView.ts` : Migration vers useAuthOptimized
- ✅ `src/hooks/useAutomations.ts` : Migration vers useAuthOptimized

## Performances attendues

### Réduction de la latence :
- **Premier chargement** : 8s max (vs 15s avant)
- **Navigation suivante** : Instantané grâce au cache
- **Requête profil** : 5s max (vs 15s avant)

### Réduction du trafic réseau :
- **Cache 10min** : Évite les rechargements inutiles
- **Requête optimisée** : ~50% moins de données
- **Session partagée** : 1 seul appel auth pour toute l'app

## Utilisation

### Dans App.tsx (racine) :
```tsx
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

### Dans les composants :
```tsx
import { useAuth } from './hooks/useAuthOptimized';

function MonComposant() {
  const { user, loading, error } = useAuth();
  // ...
}
```

## Notes techniques

- **Cache localStorage** : Expiration automatique, nettoyage des données corrompues
- **TypeScript strict** : Vérifications de type pour éviter les erreurs
- **React best practices** : useCallback pour éviter les re-renders inutiles
- **Gestion d'erreurs robuste** : Fallback utilisateur basique si le profil échoue
