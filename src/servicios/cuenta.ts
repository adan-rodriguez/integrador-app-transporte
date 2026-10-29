import type { Sesion } from '@/tipos/api';
import type { Tema, Usuario } from '@/tipos/types';
import { pedirDatos, pedirSinCuerpo } from './cliente';

export function registrarse(datos: { nombre: string; email: string; contrasena: string }) {
  return pedirDatos<Sesion, null>('/auth/registro', { metodo: 'POST', cuerpo: datos, conSesion: false });
}

export function ingresar(datos: { email: string; contrasena: string }) {
  return pedirDatos<Sesion, null>('/auth/ingreso', { metodo: 'POST', cuerpo: datos, conSesion: false });
}

export function obtenerMiCuenta() {
  return pedirDatos<Usuario, null>('/yo');
}

export function actualizarMiCuenta(cambios: { nombre?: string; avisosActivos?: boolean; tema?: Tema }) {
  return pedirDatos<Usuario, null>('/yo', { metodo: 'PATCH', cuerpo: cambios });
}

// Favoritos. Agregar es idempotente y devuelve el Usuario actualizado; quitar responde 204.
export function agregarLineaFavorita(lineaId: string) {
  return pedirDatos<Usuario, null>(`/yo/lineas-favoritas/${encodeURIComponent(lineaId)}`, { metodo: 'PUT' });
}

export function quitarLineaFavorita(lineaId: string) {
  return pedirSinCuerpo(`/yo/lineas-favoritas/${encodeURIComponent(lineaId)}`, { metodo: 'DELETE' });
}

export function agregarParadaFavorita(paradaId: string) {
  return pedirDatos<Usuario, null>(`/yo/paradas-favoritas/${encodeURIComponent(paradaId)}`, { metodo: 'PUT' });
}

export function quitarParadaFavorita(paradaId: string) {
  return pedirSinCuerpo(`/yo/paradas-favoritas/${encodeURIComponent(paradaId)}`, { metodo: 'DELETE' });
}

