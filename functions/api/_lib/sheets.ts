/** Lectura y escritura en Google Sheets vía API REST. */

import { obtenerToken } from "./google";
import { exigir, type Env } from "./entorno";

const SCOPES_SHEETS = ["https://www.googleapis.com/auth/spreadsheets"];
const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

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

  const respuesta = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: filas }),
  });

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
  const respuesta = await fetch(`${BASE}/${id}/values/${encodeURIComponent(rango)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!respuesta.ok) {
    throw new Error(`No se pudo leer "${rango}": ${await respuesta.text()}`);
  }
  const datos = (await respuesta.json()) as { values?: string[][] };
  return datos.values || [];
}

/**
 * ¿Ya hay una constancia de esta cédula para este curso?
 * Pasa seguido: se cae la señal, el inspector recarga y vuelve a enviar.
 * Devuelve la fecha del registro previo, o null.
 */
export async function buscarConstanciaPrevia(
  env: Env,
  cedula: string,
  cursoCodigo: string,
): Promise<string | null> {
  // Solo las columnas que hacen falta: fecha (A), curso (B) y cédula (F).
  const filas = await leerValores(env, `${HOJA_CONSTANCIAS}!A2:F`);
  for (let i = filas.length - 1; i >= 0; i--) {
    const fila = filas[i];
    if (fila[5] === cedula && fila[1] === cursoCodigo) {
      return String(fila[0] || "").slice(0, 10);
    }
  }
  return null;
}

/**
 * Consecutivo MEJ-0001 a partir de las filas existentes.
 *
 * No hay candado como el de Apps Script: dos envíos simultáneos podrían leer
 * el mismo número. Se asume tolerable (son ~45 inspectores reportando de vez
 * en cuando) y el id no es llave de nada río abajo — la fila igual queda
 * completa. Si algún día importa, hay que mover el consecutivo a un KV.
 */
export async function siguienteIdMejora(env: Env): Promise<string> {
  const filas = await leerValores(env, `${HOJA_MEJORAS}!A2:A`);
  return "MEJ-" + String(filas.length + 1).padStart(4, "0");
}
