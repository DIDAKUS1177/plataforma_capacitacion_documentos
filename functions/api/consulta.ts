/**
 * POST /api/consulta — el estado de un reporte del buzón.
 *
 * Pide el número Y el correo con el que se reportó, y los dos tienen que
 * coincidir. Los números son consecutivos (MEJ-0001, MEJ-0002…): si bastara el
 * número, cualquiera recorrería los reportes de todos, y ahí están el nombre y
 * el correo de quien reportó además de lo que escribió.
 *
 * Va por POST y no por GET para que el correo no quede en la URL, que se
 * guarda en historiales y registros de acceso.
 */

import type { Env } from "./_lib/entorno";
import { leerValores, COL_MEJORA, HOJA_MEJORAS } from "./_lib/sheets";
import { fallaServidor, json, leerJson, malaPeticion, ok } from "./_lib/http";

/**
 * El mismo mensaje para "no existe" y para "el correo no coincide". Uno
 * distinto para cada caso confirmaría qué números existen, que es justo lo que
 * se quiere evitar.
 */
const NO_ENCONTRADO = "No encontramos un reporte con ese número y ese correo.";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const datos = await leerJson<{ id?: string; correo?: string }>(request);
  if (!datos) return malaPeticion("No llegó información. Intenta otra vez.");

  const id = (datos.id || "").trim().toUpperCase();
  const correo = (datos.correo || "").trim().toLowerCase();

  if (!/^MEJ-\d{4,}$/.test(id)) {
    return malaPeticion('El número va con el formato "MEJ-0007".');
  }
  if (!correo) return malaPeticion("Escribe el correo con el que reportaste.");

  try {
    const filas = await leerValores(env, `${HOJA_MEJORAS}!A2:N`);
    const fila = filas.find(
      (f) =>
        (f[COL_MEJORA.id] || "").trim().toUpperCase() === id &&
        (f[COL_MEJORA.correo] || "").trim().toLowerCase() === correo,
    );

    if (!fila) return json({ ok: false, mensaje: NO_ENCONTRADO }, 404);

    const v = (i: number) => (fila[i] || "").trim();
    const respuesta = v(COL_MEJORA.respuesta);

    return ok({
      id: v(COL_MEJORA.id),
      fecha: v(COL_MEJORA.fecha),
      aplicacion: v(COL_MEJORA.aplicacion),
      tipo: v(COL_MEJORA.tipo),
      criticidad: v(COL_MEJORA.criticidad),
      descripcion: v(COL_MEJORA.descripcion),
      estado: v(COL_MEJORA.estado) || "Recibida",
      responsable: v(COL_MEJORA.responsable),
      respuesta,
      fechaRespuesta: v(COL_MEJORA.fechaRespuesta),
      // Para que la pantalla diga "todavía sin respuesta" en vez de dejar un
      // hueco que parece un error.
      respondido: !!respuesta,
    });
  } catch (e) {
    return fallaServidor(e);
  }
};
