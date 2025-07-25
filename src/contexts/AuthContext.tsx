import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../lib/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

const CACHE_KEY = 'crm_auth_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface CachedAuth extends AuthUser {
  timestamp: number;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCachedAuth = useCallback((): AuthUser | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cachedData: CachedAuth = JSON.parse(cached);
      
      if (Date.now() - cachedData.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timestamp, ...user } = cachedData;
      return user;
    } catch (err) {
      console.warn('Erreur lecture cache auth:', err);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  const setCachedAuth = useCallback((user: AuthUser) => {
    try {
      const cacheData: CachedAuth = {
        ...user,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.warn('Erreur sauvegarde cache auth:', err);
    }
  }, []);

  const clearAuthCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn('Erreur nettoyage cache:', err);
    }
  }, []);

  const loadUserProfile = useCallback(async (userId: string, email: string) => {
    try {
      setError(null);
      
      // Créer un utilisateur de base immédiatement
      const basicUser: AuthUser = { 
        id: userId, 
        email,
        profile: undefined 
      };
      
      // Charger le profil en arrière-plan avec un timeout plus long
      try {
        await Promise.race([
          (async () => {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, email, full_name, role, created_at')
              .eq('id', userId)
              .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
              console.warn('Erreur profil (non-critique):', profileError);
              // Ne pas faire d'erreur, continuer avec l'utilisateur de base
              return;
            }

            if (profile) {
              const authUserWithProfile: AuthUser = {
                id: userId,
                email,
                profile: {
                  ...profile,
                  updated_at: profile.created_at
                },
              };
              setUser(authUserWithProfile);
              setCachedAuth(authUserWithProfile);
            }
          })(),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Timeout profil'));
            }, 10000); // Augmenté à 10 secondes
          })
        ]);
      } catch (profileError) {
        // En cas d'erreur de profil, continuer avec l'utilisateur de base
        console.warn('Profil non chargé, utilisation des données de base:', profileError);
        setUser(basicUser);
        setCachedAuth(basicUser);
      }
      
    } catch (error) {
      console.error('Error loading user:', error);
      // En dernier recours, créer un utilisateur minimal
      const fallbackUser: AuthUser = { 
        id: userId, 
        email,
        profile: undefined 
      };
      setUser(fallbackUser);
      setCachedAuth(fallbackUser);
      // Ne pas setError ici pour éviter les re-renders en boucle
    } finally {
      setLoading(false);
    }
  }, [setCachedAuth]);

  const validateSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearAuthCache();
        setUser(null);
      }
    } catch (err) {
      console.warn('Erreur de validation de session:', err);
    }
  }, [clearAuthCache]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        setError(null);
        
        const cached = getCachedAuth();
        if (cached && mounted) {
          setUser(cached);
          setLoading(false);
          validateSession();
          return;
        }

        await Promise.race([
          (async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.warn('Erreur de session:', sessionError);
              clearAuthCache();
              if (mounted) {
                setUser(null);
                setLoading(false);
              }
              return;
            }

            if (session?.user && mounted) {
              await loadUserProfile(session.user.id, session.user.email || '');
            } else if (mounted) {
              setUser(null);
              setLoading(false);
            }
          })(),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Connexion trop lente'));
            }, 12000); // Augmenté à 12 secondes
          })
        ]);
      } catch (err) {
        console.error('Erreur d\'initialisation auth:', err);
        if (mounted) {
          clearAuthCache();
          // Ne pas setError pour éviter les boucles de re-render
          console.warn('Auth init failed, continuing without error display');
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        try {
          setError(null);
          
          if (event === 'SIGNED_IN' && session?.user) {
            await loadUserProfile(session.user.id, session.user.email || '');
          } else if (event === 'SIGNED_OUT') {
            clearAuthCache();
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token rafraîchi');
          }
          
          if (mounted) {
            setLoading(false);
          }
        } catch (err) {
          console.error('Erreur dans onAuthStateChange:', err);
          if (mounted) {
            clearAuthCache();
            // Ne pas setError pour éviter les boucles de re-render
            console.warn('Auth state change failed, continuing without error display');
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getCachedAuth, clearAuthCache, loadUserProfile, validateSession]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error instanceof Error ? error.message : 'Erreur de connexion');
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'inscription');
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      clearAuthCache();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error.message : 'Erreur de déconnexion');
      clearAuthCache();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
