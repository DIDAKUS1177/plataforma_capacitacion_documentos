/**
 * GET /api/config — lo que el navegador necesita saber del servidor.
 *
 * Aquí NO va nada secreto: solo el dominio corporativo (para avisar del correo
 * mal escrito antes de enviar) y si se exige firma dibujada.
 */

import type { Env } from "./_lib/entorno";
import { ok } from "./_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return ok({
    dominio: env.DOMINIO_CORPORATIVO || "",
    exigeFirma: String(env.EXIGE_FIRMA || "") === "true",
  });
};
