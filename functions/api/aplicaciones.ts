/**
 * GET /api/aplicaciones — lista para el desplegable del buzón de mejoras.
 *
 * Lee el Listado Maestro (SOLO LECTURA) si está configurado. Si no, o si la
 * lectura falla, devuelve la lista de respaldo: un desplegable vacío rompería
 * el formulario que más importa que nunca falle — si falla una vez, el
 * inspector no vuelve a reportar.
 */

import type { Env } from "./_lib/entorno";
import { leerValores } from "./_lib/sheets";
import { ok } from "./_lib/http";

const OTRA = "Otra / no aparece en la lista";

const RESPALDO = [
  "APP-001 Espesores UT",
  "APP-002 GRP Visual VT",
  "APP-003 Recipientes 510 VT",
  "APP-004 Caracterización de Materiales PMI",
  "APP-005 C-Scan RP AUT",
  "APP-006 GRP RP VT",
  "APP-007 Formato PCM",
  "APP-008 Válvulas VT",
  "APP-009 Piernas Muertas UT",
  "APP-011 Tubería 570 VT",
  "APP-012 Scan C Fondo de Tanques",
  "APP-013 Scan C Líneas",
  "APP-015 Inspección ACFM",
  "APP-016 Trampas VT",
  "APP-017 Scan C Tanques UT",
  "APP-018 Tanques 653 VT",
  "APP-019 Riesgo de Ductos RBI",
  "APP-021 Líquidos Penetrantes PT",
  "APP-022 Partículas Magnéticas MT",
  "APP-023 Ondas Guiadas",
  "APP-025 Tanques Fuera de Servicio",
  "APP-029 Domo Geodésico VT",
  "APP-030 Inspección QR END",
  "APP-032 Visual 510 VT",
  "APP-033 Reporte de Incidentes RI",
  "APP-034 VT Soldadas",
  "APP-035 Termografía",
  "APP-036 GRP / API 510",
  "ADEMINCOL Central (plataforma de reportes)",
  OTRA,
];

// Caché en memoria del isolate. La cuota de lectura de Sheets es de 60 por
// minuto y la comparte con los reportes de ADEMINCOL Central.
const CACHE_MS = 6 * 60 * 60 * 1000;
let cache: { apps: string[]; vence: number } | null = null;

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (cache && cache.vence > Date.now()) return ok(cache.apps);

  let apps = RESPALDO;

  if (env.LISTADO_MAESTRO_ID) {
    try {
      const hoja = env.LISTADO_MAESTRO_HOJA || "Listado Maestro";
      const filas = await leerValores(env, `${hoja}!A1:Z`, env.LISTADO_MAESTRO_ID);
      const leidas = extraerNombres(filas);
      if (leidas.length) apps = [...leidas, OTRA];
    } catch (e) {
      console.error("No se pudo leer el Listado Maestro, se usa el respaldo:", e);
    }
  }

  cache = { apps, vence: Date.now() + CACHE_MS };
  return ok(apps);
};

/** Busca la columna "nombre" en los encabezados y devuelve sus valores. */
function extraerNombres(filas: string[][]): string[] {
  if (!filas.length) return [];
  const encabezados = filas[0].map((c) => String(c).toLowerCase().trim());
  const col = encabezados.indexOf("nombre");
  if (col < 0) return [];
  return filas
    .slice(1)
    .map((f) => String(f[col] || "").trim())
    .filter(Boolean);
}
