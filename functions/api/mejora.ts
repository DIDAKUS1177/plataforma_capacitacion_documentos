/** POST /api/mejora — registra una falla o una propuesta de mejora. */

import type { DatosMejora } from "../../shared/tipos";
import { validarMejora } from "../../shared/validacion";
import type { Env } from "./_lib/entorno";
import { agregarFila, HOJA_MEJORAS, siguienteIdMejora } from "./_lib/sheets";
import { fallaServidor, fechaBogota, leerJson, malaPeticion, ok } from "./_lib/http";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const datos = await leerJson<DatosMejora>(request);
  if (!datos) return malaPeticion("No llegó información. Intenta otra vez.");

  const problema = validarMejora(datos);
  if (problema) return malaPeticion(problema);

  try {
    const id = await siguienteIdMejora(env);

    await agregarFila(env, HOJA_MEJORAS, [
      id,
      fechaBogota(),
      datos.aplicacion.trim(),
      datos.tipo.trim(),
      (datos.criticidad || "").trim(),
      datos.descripcion.trim(),
      (datos.nombre || "").trim(),
      (datos.correo || "").trim().toLowerCase(),
      "Recibida", // estado — de aquí en adelante lo llena el supervisor
      "", // responsable
      "", // respuesta
      "", // fecha_respuesta
      "", // id_changelog
    ]);

    return ok({ id }, `Tu reporte quedó con el número ${id}.`);
  } catch (e) {
    return fallaServidor(e);
  }
};
