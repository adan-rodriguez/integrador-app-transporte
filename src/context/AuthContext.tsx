import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter, useSegments } from 'expo-router';

// TODO: Estos tipos deberían ir en src/tipos o usar el Usuario existente
interface AuthContextType {
  userToken: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Intentar recuperar el token de sesión guardado
    const loadSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('user_token');
        if (token) {
          // Si hay token, pedimos autenticación biométrica (reingreso)
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const auth = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Autenticación requerida',
              fallbackLabel: 'Usar contraseña',
            });
            if (auth.success) {
              setUserToken(token);
            } else {
              // Falló la autenticación, podríamos borrar el token o pedir login de nuevo
              setUserToken(null);
            }
          } else {
            // No tiene biometría configurada, entra directamente (o alternativa)
            setUserToken(token);
          }
        }
      } catch (e) {
        console.error('Error cargando sesión', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // Proteger las rutas
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';
    
    if (!userToken && !inAuthGroup) {
      // Redirigir al login si no hay token y no está en la pantalla de login
      router.replace('/login');
    } else if (userToken && inAuthGroup) {
      // Redirigir al inicio si ya tiene sesión y está en la pantalla de login
      router.replace('/(tabs)');
    }
  }, [userToken, segments, isLoading]);

  const signIn = async (token: string) => {
    await SecureStore.setItemAsync('user_token', token);
    setUserToken(token);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('user_token');
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

