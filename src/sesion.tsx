// Sesión del usuario: quién está logueado y cómo se guarda el token.
//
// - El token vive en expo-secure-store (almacenamiento cifrado), nunca en kv-store.
// - Si hay un token guardado al abrir la app, se pide huella o rostro antes de usarlo
//   (expo-local-authentication). Si el dispositivo no tiene biometría, el token se descarta
//   y la persona vuelve a ingresar con email y contraseña: esa es la alternativa.
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ErrorApi, configurarSesion } from "@/servicios/cliente";
import {
  ingresar as ingresarEnApi,
  obtenerMiCuenta,
  registrarse as registrarseEnApi,
} from "@/servicios/cuenta";
import type { Sesion } from "@/tipos/api";
import type { Usuario } from "@/tipos/types";

const CLAVE_TOKEN = "token-de-sesion";

/**
 * - iniciando: leyendo el token guardado.
 * - bloqueada: hay un token guardado y falta la huella o el rostro.
 * - sin_sesion: nadie ingresó (la app se puede usar igual: líneas, paradas y avisos son públicos).
 * - con_sesion: hay un usuario.
 */
type Estado = "iniciando" | "bloqueada" | "sin_sesion" | "con_sesion";

interface ValorSesion {
  estado: Estado;
  usuario: Usuario | null;
  ingresar: (email: string, contrasena: string) => Promise<void>;
  registrarse: (
    nombre: string,
    email: string,
    contrasena: string,
  ) => Promise<void>;
  /** Pide la huella y, si coincide, abre la sesión guardada. Devuelve un mensaje si falla. */
  desbloquear: () => Promise<string | null>;
  salir: () => Promise<void>;
  /** Para cuando un cambio (por ejemplo, un favorito) devuelve el usuario actualizado. */
  reemplazarUsuario: (usuario: Usuario) => void;
}

const ContextoSesion = createContext<ValorSesion | null>(null);

export function useSesion(): ValorSesion {
  const valor = useContext(ContextoSesion);
  if (!valor)
    throw new Error("useSesion tiene que usarse dentro de SesionProvider");
  return valor;
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // El cliente HTTP lee el token de acá cada vez que hace un pedido.
  const tokenEnMemoria = useRef<string | null>(null);

  async function salir() {
    tokenEnMemoria.current = null;
    setUsuario(null);
    await SecureStore.deleteItemAsync(CLAVE_TOKEN);
    setEstado("sin_sesion");
  }

  // Al abrir la app: ¿hay una sesión guardada?
  useEffect(() => {
    configurarSesion({ token: () => tokenEnMemoria.current, alVencer: salir });

    async function revisarSesionGuardada() {
      const tokenGuardado = await SecureStore.getItemAsync(CLAVE_TOKEN);
      if (!tokenGuardado) {
        setEstado("sin_sesion");
        return;
      }
      const hayBiometria =
        (await LocalAuthentication.hasHardwareAsync()) &&
        (await LocalAuthentication.isEnrolledAsync());
      if (hayBiometria) {
        setEstado("bloqueada");
      } else {
        await salir();
      }
    }
    revisarSesionGuardada();
  }, []);

  async function abrirSesion(sesion: Sesion) {
    await SecureStore.setItemAsync(CLAVE_TOKEN, sesion.token);
    tokenEnMemoria.current = sesion.token;
    setUsuario(sesion.usuario);
    setEstado("con_sesion");
  }

  async function ingresar(email: string, contrasena: string) {
    const { datos } = await ingresarEnApi({ email, contrasena });
    await abrirSesion(datos);
  }

  async function registrarse(
    nombre: string,
    email: string,
    contrasena: string,
  ) {
    const { datos } = await registrarseEnApi({ nombre, email, contrasena });
    await abrirSesion(datos);
  }

  async function desbloquear(): Promise<string | null> {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirmá que sos vos para ingresar",
      cancelLabel: "Cancelar",
    });
    if (!resultado.success) return "No pudimos verificar tu identidad.";

    const tokenGuardado = await SecureStore.getItemAsync(CLAVE_TOKEN);
    if (!tokenGuardado) {
      setEstado("sin_sesion");
      return null;
    }
    tokenEnMemoria.current = tokenGuardado;
    try {
      const { datos } = await obtenerMiCuenta();
      setUsuario(datos);
      setEstado("con_sesion");
      return null;
    } catch (error) {
      tokenEnMemoria.current = null;
      if (error instanceof ErrorApi && error.estado === 401) {
        // El token venció: hay que volver a ingresar con la contraseña.
        await salir();
        return null;
      }
      return error instanceof ErrorApi
        ? error.message
        : "Algo salió mal. Intentá de nuevo.";
    }
  }

  return (
    <ContextoSesion.Provider
      value={{
        estado,
        usuario,
        ingresar,
        registrarse,
        desbloquear,
        salir,
        reemplazarUsuario: setUsuario,
      }}
    >
      {children}
    </ContextoSesion.Provider>
  );
}

