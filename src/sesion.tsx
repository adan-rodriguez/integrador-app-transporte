import { ErrorApi, configurarSesion } from "@/servicios/cliente";
import {
  ingresar as ingresarEnApi,
  obtenerMiCuenta,
  registrarse as registrarseEnApi,
} from "@/servicios/cuenta";
import type { Sesion } from "@/tipos/api";
import type { Usuario } from "@/tipos/types";
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

const CLAVE_TOKEN = "token-de-sesion";
const CLAVE_INFO_USUARIO = "info-usuario-recordado";

export interface InfoUsuarioRecordado {
  nombre: string;
  email: string;
}

type Estado = "iniciando" | "bloqueada" | "sin_sesion" | "con_sesion";

interface ValorSesion {
  estado: Estado;
  usuario: Usuario | null;
  usuarioRecordado: InfoUsuarioRecordado | null;
  tieneSeguridadLocal: boolean;
  ingresar: (email: string, contrasena: string) => Promise<void>;
  registrarse: (
    nombre: string,
    email: string,
    contrasena: string,
  ) => Promise<void>;
  desbloquear: () => Promise<string | null>;
  continuarSinSesion: () => void;
  salir: () => Promise<void>;
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
  const [usuarioRecordado, setUsuarioRecordado] =
    useState<InfoUsuarioRecordado | null>(null);
  const [tieneSeguridadLocal, setTieneSeguridadLocal] = useState(false);
  const tokenEnMemoria = useRef<string | null>(null);

  function continuarSinSesion() {
    setEstado("sin_sesion");
  }

  async function salir() {
    tokenEnMemoria.current = null;
    setUsuario(null);
    setUsuarioRecordado(null);
    await SecureStore.deleteItemAsync(CLAVE_TOKEN);
    await SecureStore.deleteItemAsync(CLAVE_INFO_USUARIO);
    setEstado("sin_sesion");
  }

  useEffect(() => {
    configurarSesion({ token: () => tokenEnMemoria.current, alVencer: salir });

    async function revisarSesionGuardada() {
      const tokenGuardado = await SecureStore.getItemAsync(CLAVE_TOKEN);
      if (!tokenGuardado) {
        setEstado("sin_sesion");
        return;
      }

      const infoRaw = await SecureStore.getItemAsync(CLAVE_INFO_USUARIO);
      if (infoRaw) {
        try {
          setUsuarioRecordado(JSON.parse(infoRaw));
        } catch {}
      }

      try {
        const nivel = await LocalAuthentication.getEnrolledLevelAsync();
        const tieneSeguridad = nivel !== LocalAuthentication.SecurityLevel.NONE;
        setTieneSeguridadLocal(tieneSeguridad);
      } catch {
        setTieneSeguridadLocal(false);
      }

      setEstado("bloqueada");
    }
    revisarSesionGuardada();
  }, []);

  async function abrirSesion(sesion: Sesion) {
    await SecureStore.setItemAsync(CLAVE_TOKEN, sesion.token);
    const info: InfoUsuarioRecordado = {
      nombre: sesion.usuario.nombre,
      email: sesion.usuario.email,
    };
    await SecureStore.setItemAsync(CLAVE_INFO_USUARIO, JSON.stringify(info));
    tokenEnMemoria.current = sesion.token;
    setUsuario(sesion.usuario);
    setUsuarioRecordado(info);
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
    try {
      const nivel = await LocalAuthentication.getEnrolledLevelAsync();
      if (nivel === LocalAuthentication.SecurityLevel.NONE) {
        return "No hay un método de seguridad configurado en este dispositivo.";
      }

      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirmá tu identidad para ingresar",
      });
      if (!resultado.success) return "No pudimos verificar tu identidad.";
    } catch {
      return "No se pudo iniciar la autenticación del dispositivo.";
    }

    const tokenGuardado = await SecureStore.getItemAsync(CLAVE_TOKEN);
    if (!tokenGuardado) {
      setEstado("sin_sesion");
      return null;
    }
    tokenEnMemoria.current = tokenGuardado;
    try {
      const { datos } = await obtenerMiCuenta();
      setUsuario(datos);
      const info: InfoUsuarioRecordado = {
        nombre: datos.nombre,
        email: datos.email,
      };
      await SecureStore.setItemAsync(CLAVE_INFO_USUARIO, JSON.stringify(info));
      setUsuarioRecordado(info);
      setEstado("con_sesion");
      return null;
    } catch (error) {
      tokenEnMemoria.current = null;
      if (error instanceof ErrorApi && error.estado === 401) {
        await salir();
        return null;
      }
      return error instanceof ErrorApi
        ? error.message
        : "Algo salió mal. Intentá de nuevo.";
    }
  }

  function reemplazarUsuario(nuevo: Usuario) {
    setUsuario(nuevo);
    const info: InfoUsuarioRecordado = {
      nombre: nuevo.nombre,
      email: nuevo.email,
    };
    setUsuarioRecordado(info);
    SecureStore.setItemAsync(CLAVE_INFO_USUARIO, JSON.stringify(info)).catch(
      () => {},
    );
  }

  return (
    <ContextoSesion.Provider
      value={{
        estado,
        usuario,
        usuarioRecordado,
        tieneSeguridadLocal,
        ingresar,
        registrarse,
        desbloquear,
        continuarSinSesion,
        salir,
        reemplazarUsuario,
      }}
    >
      {children}
    </ContextoSesion.Provider>
  );
}
