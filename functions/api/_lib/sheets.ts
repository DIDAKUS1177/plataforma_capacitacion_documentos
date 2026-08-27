/** Lectura y escritura en Google Sheets vía API REST. */

import { obtenerToken } from "./google";
import { exigir, type Env } from "./entorno";

const SCOPES_SHEETS = ["https://www.googleapis.com/auth/spreadsheets"];
const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

/**
 * Sheets devuelve 429 (cuota) y 5xx (indisponible) de vez en cuando, sin
 * ninguna razón del lado nuestro. Visto en desarrollo: un 503 al leer, que
 * tumbaba el registro de una constancia — después de que el inspector hizo
 * media hora de curso. Se reintenta con espera creciente.
 *
 * Solo se reintenta lo transitorio: un 400 o un 403 son errores nuestros y
 * repetirlos no arregla nada.
 */
const ESPERAS_MS = [400, 1200, 2500];

async function conReintentos(
  peticion: () => Promise<Response>,
  queHacia: string,
): Promise<Response> {
  let ultima: Response | null = null;

  for (let intento = 0; intento <= ESPERAS_MS.length; intento++) {
    if (intento > 0) {
      await new Promise((listo) => setTimeout(listo, ESPERAS_MS[intento - 1]));
    }
    const respuesta = await peticion();
    if (respuesta.ok) return respuesta;

    const transitorio = respuesta.status === 429 || respuesta.status >= 500;
    if (!transitorio) return respuesta;

    ultima = respuesta;
    console.warn(
      `${queHacia}: HTTP ${respuesta.status}, reintento ${intento + 1} de ${ESPERAS_MS.length}`,
    );
  }
  return ultima as Response;
}

export const HOJA_INICIOS = "inicios";
export const HOJA_CONSTANCIAS = "constancias";
export const HOJA_RESPUESTAS = "respuestas_evaluacion";
export const HOJA_MEJORAS = "mejoras";

/** Agrega una fila al final de la hoja. Una sola llamada a la API. */
export async function agregarFila(env: Env, hoja: string, fila: unknown[]): Promise<void> {
  await agregarFilas(env, hoja, [fila]);
}

/**
 * Agrega varias filas de un golpe. Importa: la cuota es de 60 escrituras por
 * minuto y la comparte con los reportes de ADEMINCOL Central.
 */
export async function agregarFilas(env: Env, hoja: string, filas: unknown[][]): Promise<void> {
  if (!filas.length) return;
  const id = exigir(env, "SHEET_ID");
  const token = await obtenerToken(env, SCOPES_SHEETS);
  const url =
    `${BASE}/${id}/values/${encodeURIComponent(hoja)}!A1:append` +
    `?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const respuesta = await conReintentos(
    () =>
      fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: filas }),
      }),
    `escribir en "${hoja}"`,
  );

  if (!respuesta.ok) {
    throw new Error(`No se pudo escribir en "${hoja}": ${await respuesta.text()}`);
  }
}

/** Lee un rango. Devuelve [] si la hoja está vacía. */
export async function leerValores(
  env: Env,
  rango: string,
  idAlterno?: string,
): Promise<string[][]> {
  const id = idAlterno || exigir(env, "SHEET_ID");
  const token = await obtenerToken(env, SCOPES_SHEETS);
  const respuesta = await conReintentos(
    () =>
      fetch(`${BASE}/${id}/values/${encodeURIComponent(rango)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    `leer "${rango}"`,
  );

  if (!respuesta.ok) {
    throw new Error(`No se pudo leer "${rango}": ${await respuesta.text()}`);
  }
  const datos = (await respuesta.json()) as { values?: string[][] };
  return datos.values || [];
}

/**
 * ¿Ya hay una constancia de esta cédula para esta aplicación?
 * Pasa seguido: se cae la señal, el inspector recarga y vuelve a enviar.
 * Devuelve la fecha del registro previo, o null.
 *
 * Se compara contra la aplicación y no contra el código del curso: el mismo
 * inspector sí debe poder capacitarse en varias apps.
 */
export async function buscarConstanciaPrevia(
  env: Env,
  cedula: string,
  appId: string,
): Promise<string | null> {
  // Hasta la columna P, que es donde quedó app_id.
  const filas = await leerValores(env, `${HOJA_CONSTANCIAS}!A2:P`);
  for (let i = filas.length - 1; i >= 0; i--) {
    const fila = filas[i];
    if (fila[5] === cedula && fila[15] === appId) {
      return String(fila[0] || "").slice(0, 10);
    }
  }
  return null;
}

/**
 * Consecutivo MEJ-0001.
 *
 * Se calcula sobre el número MÁS ALTO que ya exista, no sobre la cantidad de
 * filas: si se borran filas viejas —limpiar datos de prueba, por ejemplo— la
 * cuenta por cantidad volvería atrás y repetiría números ya usados.
 *
 * No hay candado: dos envíos en el mismo instante podrían leer el mismo
 * número. Se asume tolerable con ~45 inspectores, y el id no es llave de nada
 * río abajo. Si algún día importa, el consecutivo va a un KV.
 */
export async function siguienteIdMejora(env: Env): Promise<string> {
  const filas = await leerValores(env, `${HOJA_MEJORAS}!A2:A`);

  let mayor = 0;
  for (const fila of filas) {
    const n = Number((fila[0] || "").trim().replace(/^MEJ-/i, ""));
    if (Number.isFinite(n) && n > mayor) mayor = n;
  }
  return "MEJ-" + String(mayor + 1).padStart(4, "0");
}

/**
 * Posiciones de la hoja `mejoras`. Se declaran aquí y no en cada endpoint para
 * que al agregar una columna haya un solo sitio que corregir. Ver
 * scripts/init_sheet.py.
 */
export const COL_MEJORA = {
  id: 0,
  fecha: 1,
  aplicacion: 2,
  tipo: 3,
  criticidad: 4,
  descripcion: 5,
  nombre: 6,
  correo: 7,
  estado: 8,
  responsable: 9,
  respuesta: 10,
  fechaRespuesta: 11,
  idChangelog: 12,
  notificadoEn: 13, // columna N
  whatsapp: 14, // columna O
};

/**
 * Escribe celdas sueltas en una sola llamada.
 *
 * `celdas` va como { "mejoras!N5": "2026-08-26 10:00:00", ... }. Se usa para
 * marcar avisos enviados sin reescribir la fila entera: el supervisor puede
 * estar editando otras columnas al mismo tiempo.
 */
export async function escribirCeldas(
  env: Env,
  celdas: Record<string, string>,
): Promise<void> {
  const rangos = Object.keys(celdas);
  if (!rangos.length) return;

  const id = exigir(env, "SHEET_ID");
  const token = await obtenerToken(env, SCOPES_SHEETS);

  const respuesta = await conReintentos(
    () =>
      fetch(`${BASE}/${id}/values:batchUpdate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          valueInputOption: "RAW",
          data: rangos.map((rango) => ({ range: rango, values: [[celdas[rango]]] })),
        }),
      }),
    `escribir ${rangos.length} celda(s)`,
  );

  if (!respuesta.ok) {
    throw new Error(`No se pudieron escribir las celdas: ${await respuesta.text()}`);
  }
}
