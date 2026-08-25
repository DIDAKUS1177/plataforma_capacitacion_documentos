/**
 * GET /api/verificar?id=... — comprueba una constancia contra el Sheet.
 *
 * Es PÚBLICO: lo abre quien escanee el QR, sin identificarse. Por eso devuelve
 * lo mínimo para confirmar que la capacitación existe y de quién es, y nada
 * más:
 *
 *   - la cédula va enmascarada (****6432): confirma a quien ya la conoce, sin
 *     revelársela a quien no;
 *   - no se devuelve el correo, ni el cargo, ni las respuestas de la evaluación;
 *   - el id es aleatorio de 64 bits, así que no se puede ir tanteando ids para
 *     recorrer el listado.
 */

import type { Env } from "./_lib/entorno";
import { leerValores, HOJA_CONSTANCIAS } from "./_lib/sheets";
import { fallaServidor, json, malaPeticion, ok } from "./_lib/http";

/** Posiciones en la hoja `constancias`. Ver scripts/init_sheet.py. */
const COL = {
  fecha: 0,
  cursoCodigo: 1,
  cursoNombre: 2,
  cursoVersion: 3,
  nombre: 4,
  cedula: 5,
  puntaje: 8,
  total: 9,
  aprobado: 10,
  appId: 15,
  appNombre: 16,
  tecnica: 17,
  // id_constancia es la columna Y: la 25.ª, índice 24.
  id: 24,
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const id = (new URL(request.url).searchParams.get("id") || "").trim();
  if (!/^[a-f0-9]{16}$/.test(id)) {
    return malaPeticion("El código de la constancia no tiene el formato esperado.");
  }

  try {
    const filas = await leerValores(env, `${HOJA_CONSTANCIAS}!A2:Y`);
    const fila = filas.find((f) => (f[COL.id] || "").trim() === id);

    if (!fila) {
      // 404 y no 400: la petición estaba bien formada, simplemente no existe.
      return json(
        { ok: false, mensaje: "No encontramos ninguna constancia con ese código." },
        404,
      );
    }

    return ok({
      nombre: fila[COL.nombre] || "",
      cedula: enmascarar(fila[COL.cedula] || ""),
      curso: fila[COL.cursoNombre] || "",
      cursoCodigo: fila[COL.cursoCodigo] || "",
      cursoVersion: fila[COL.cursoVersion] || "",
      formato: [fila[COL.appId], fila[COL.appNombre]].filter(Boolean).join(" — "),
      tecnica: fila[COL.tecnica] || "",
      fecha: (fila[COL.fecha] || "").slice(0, 10),
      resultado: `${fila[COL.puntaje] || "0"} de ${fila[COL.total] || "0"}`,
      aprobado: (fila[COL.aprobado] || "").toUpperCase().startsWith("S"),
    });
  } catch (e) {
    return fallaServidor(e);
  }
};

/** 1098765432 -> ****5432. Confirma sin revelar. */
function enmascarar(cedula: string): string {
  const limpia = cedula.replace(/\D/g, "");
  return limpia.length <= 4 ? "****" : "****" + limpia.slice(-4);
}
