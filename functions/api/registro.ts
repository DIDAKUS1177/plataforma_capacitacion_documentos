/**
 * POST /api/registro — deja constancia de que alguien EMPEZÓ la capacitación.
 *
 * Se escribe antes de que vea nada. Así queda rastro de los que empiezan y no
 * terminan, que es justo lo que no se veía cuando el único registro era la
 * constancia final.
 *
 * No bloquea: si esta escritura falla, el inspector igual puede seguir el curso
 * y lo que cuenta como evidencia —la constancia— se escribe al final.
 */

import type { DatosRegistro } from "../../shared/tipos";
import { validarRegistro } from "../../shared/validacion";
import type { Env } from "./_lib/entorno";
import { normalizarCedula } from "../../shared/validacion";
import { agregarFila, HOJA_INICIOS } from "./_lib/sheets";
import { fallaServidor, fechaBogota, leerJson, malaPeticion, ok } from "./_lib/http";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const datos = await leerJson<DatosRegistro>(request);
  if (!datos) return malaPeticion("No llegó información. Intenta otra vez.");

  const problema = validarRegistro(datos, env.DOMINIO_CORPORATIVO || "");
  if (problema) return malaPeticion(problema);

  try {
    await agregarFila(env, HOJA_INICIOS, [
      fechaBogota(),
      datos.nombre.trim(),
      normalizarCedula(datos.cedula),
      datos.correo.trim().toLowerCase(),
      datos.cargo.trim(),
      datos.areaUn.trim(),
      datos.appId,
      datos.appNombre,
      datos.tecnica,
      datos.cursoCodigo,
      datos.cursoVersion,
      (request.headers.get("user-agent") || "").slice(0, 200),
    ]);
    return ok({ registrado: true });
  } catch (e) {
    return fallaServidor(e);
  }
};
