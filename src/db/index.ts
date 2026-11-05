import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("transporte.db");

db.execSync(`
  -- Tabla genérica: cualquier respuesta de la API se guarda como JSON bajo una clave
  CREATE TABLE IF NOT EXISTS cache (
    clave TEXT PRIMARY KEY NOT NULL,
    datos TEXT NOT NULL,
    guardadoEn INTEGER NOT NULL
  );

  -- Reportes hechos sin conexión, para mandarlos cuando vuelva la red
  CREATE TABLE IF NOT EXISTS cola_reportes (
    id TEXT PRIMARY KEY NOT NULL,
    reporte TEXT NOT NULL,
    fotoLocal TEXT
  );
`);

// ---------- Caché ----------

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

// ---------- Cola de reportes ----------

export function encolarReporte(id: string, reporte: unknown, fotoLocal: string | null): void {
  db.runSync("INSERT OR REPLACE INTO cola_reportes (id, reporte, fotoLocal) VALUES (?, ?, ?)", [
    id,
    JSON.stringify(reporte),
    fotoLocal,
  ]);
}

export function leerColaReportes<T>(): { id: string; reporte: T; fotoLocal: string | null }[] {
  const filas = db.getAllSync<{ id: string; reporte: string; fotoLocal: string | null }>(
    "SELECT id, reporte, fotoLocal FROM cola_reportes"
  );
  return filas.map((f) => ({ id: f.id, reporte: JSON.parse(f.reporte) as T, fotoLocal: f.fotoLocal }));
}

export function quitarDeColaReportes(id: string): void {
  db.runSync("DELETE FROM cola_reportes WHERE id = ?", [id]);
}

// Se mantiene por compatibilidad: la base se abre sola al importar este archivo.
export const initDb = () => {};