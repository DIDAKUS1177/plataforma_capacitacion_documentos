/**
 * GET /api/aplicaciones — el catálogo de apps, leído del Listado Maestro de
 * Calidad ("Listado Maestro de Aplicaciones y Bases de Datos V2").
 *
 * SOLO LECTURA. Es el Sheet que el usuario mantiene a mano para el control de
 * calidad; esta plataforma no le escribe nada.
 *
 * Alimenta dos cosas con la misma fuente: el selector de "¿para qué aplicación
 * te capacitas?" y el desplegable del buzón de mejoras.
 *
 * ?todas=1 incluye las que están en estado "Out" (por defecto se ocultan: no
 * tiene sentido capacitar en una app dada de baja).
 */

import type { Aplicacion } from "../../shared/tipos";
import type { Env } from "./_lib/entorno";
import { leerValores } from "./_lib/sheets";
import { ok } from "./_lib/http";

// Ojo: el nombre de la hoja termina en espacio en el Sheet real.
const HOJA_POR_DEFECTO = "Listado Maestro ";
const ID_POR_DEFECTO = "1NH4KKN1_zJ7mqluN5h0TncbiLh6wAiYOU9yNKLiA9uA";

const COLUMNAS = {
  id: "id",
  nombre: "nombre de la app (nuevo)",
  tecnica: "tecnica",
  codigo: "codigo adc",
  version: "versión formato",
  estado: "estado",
};

/**
 * Respaldo mínimo por si el Listado Maestro no responde. Un selector vacío
 * dejaría al inspector sin poder capacitarse ni reportar nada.
 */
const RESPALDO: Aplicacion[] = [
  { id: "APP-001", nombre: "Medición de espesores tubería y accesorios", tecnica: "UT", codigo: "F-OPE-AP-159", version: "", estado: "Prototipo" },
  { id: "APP-004", nombre: "Caracterización de materiales", tecnica: "PMI / OCR", codigo: "F-OPE-C-105", version: "", estado: "Prototipo" },
  { id: "APP-022", nombre: "Partículas magnéticas", tecnica: "MT", codigo: "", version: "", estado: "Prototipo" },
  { id: "OTRA", nombre: "Otra / no aparece en la lista", tecnica: "", codigo: "", version: "", estado: "" },
];

// Caché en memoria del isolate: la cuota de lectura de Sheets es de 60 por
// minuto y la comparte con los reportes de ADEMINCOL Central.
const CACHE_MS = 6 * 60 * 60 * 1000;
let cache: { apps: Aplicacion[]; vence: number } | null = null;

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const todas = new URL(request.url).searchParams.get("todas") === "1";

  if (!cache || cache.vence <= Date.now()) {
    cache = { apps: await leerCatalogo(env), vence: Date.now() + CACHE_MS };
  }

  const apps = todas ? cache.apps : cache.apps.filter((a) => a.estado.toLowerCase() !== "out");
  return ok(apps);
};

async function leerCatalogo(env: Env): Promise<Aplicacion[]> {
  const id = env.LISTADO_MAESTRO_ID || ID_POR_DEFECTO;
  const hoja = env.LISTADO_MAESTRO_HOJA || HOJA_POR_DEFECTO;

  // El nombre real de la hoja TERMINA EN ESPACIO ("Listado Maestro "), y hay
  // paneles de configuración que recortan los espacios al guardar la variable
  // — Cloudflare, entre ellos. Depender de que sobreviva es fragil, así que se
  // intentan varias formas y, en último caso, la PRIMERA hoja del archivo:
  // ese Sheet tiene una sola.
  const rangos = [
    `${hoja}!A1:Z100`,
    `${hoja.trim()}!A1:Z100`,
    `${hoja.trim()} !A1:Z100`,
    "A1:Z100", // sin prefijo = primera hoja
  ];

  for (const rango of rangos) {
    try {
      const apps = mapear(await leerValores(env, rango, id));
      if (apps.length) return [...apps, RESPALDO[RESPALDO.length - 1]];
      console.warn(`El rango "${rango}" no trajo filas utilizables.`);
    } catch (e) {
      console.warn(`No se pudo leer "${rango}": ${(e as Error).message}`);
    }
  }

  console.error("Ningún rango del Listado Maestro funcionó; se usa el respaldo.");
  return RESPALDO;
}

/**
 * Los encabezados del Sheet están escritos a mano y cambian de mayúsculas y
 * espacios con el tiempo, así que se buscan normalizados en vez de por
 * posición fija.
 */
function mapear(filas: string[][]): Aplicacion[] {
  if (!filas.length) return [];

  const encabezados = filas[0].map((c) => String(c).toLowerCase().trim());
  const donde = (nombre: string) => encabezados.indexOf(nombre);
  const col = {
    id: donde(COLUMNAS.id),
    nombre: donde(COLUMNAS.nombre),
    tecnica: donde(COLUMNAS.tecnica),
    codigo: donde(COLUMNAS.codigo),
    version: donde(COLUMNAS.version),
    estado: donde(COLUMNAS.estado),
  };
  if (col.id < 0 || col.nombre < 0) return [];

  const valor = (fila: string[], indice: number) =>
    indice >= 0 && indice < fila.length ? String(fila[indice] || "").trim() : "";

  return filas
    .slice(1)
    .map((fila) => ({
      id: valor(fila, col.id),
      nombre: valor(fila, col.nombre),
      tecnica: valor(fila, col.tecnica),
      codigo: valor(fila, col.codigo),
      version: valor(fila, col.version),
      estado: valor(fila, col.estado),
    }))
    .filter((a) => a.id && a.nombre);
}
