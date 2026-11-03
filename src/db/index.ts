// TODO: Configurar expo-sqlite aquí
// 1. Inicializar la base de datos (e.g., const db = SQLite.openDatabaseSync('transporte.db');)
// 2. Crear tablas para cachear Recorridos, Horarios, Favoritos si no hay conexión
// 3. Proveer funciones para guardar y leer de la base de datos local
// 4. Usar expo-sqlite/kv-store para preferencias menores si es necesario

// Se mantiene por compatibilidad: la base se abre sola al importar este archivo.
export const initDb = () => {};


import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("transporte.db");

// Una sola tabla genérica: cualquier respuesta de la API se guarda como JSON bajo una clave.
db.execSync(`
  CREATE TABLE IF NOT EXISTS cache (
    clave TEXT PRIMARY KEY NOT NULL,
    datos TEXT NOT NULL,
    guardadoEn INTEGER NOT NULL
  );
`);

export function guardarEnCache(clave: string, datos: unknown): void {
  db.runSync(
    "INSERT OR REPLACE INTO cache (clave, datos, guardadoEn) VALUES (?, ?, ?)",
    [clave, JSON.stringify(datos), Date.now()]
  );
}

export function leerDeCache<T>(clave: string): { datos: T; guardadoEn: Date } | null {
  const fila = db.getFirstSync<{ datos: string; guardadoEn: number }>(
    "SELECT datos, guardadoEn FROM cache WHERE clave = ?",
    [clave]
  );
  if (!fila) return null;
  return { datos: JSON.parse(fila.datos) as T, guardadoEn: new Date(fila.guardadoEn) };
}