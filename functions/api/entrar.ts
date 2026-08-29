/**
 * POST /api/entrar — { correo, cedula } → los datos de esa persona.
 *
 * El correo es el usuario y la cédula la clave. Los dos tienen que coincidir en
 * la MISMA fila de la hoja `personal`: no basta con que ambos existan.
 *
 * Antes esto era GET /api/persona?cedula=, que devolvía nombre y correo con
 * solo la cédula. Cualquiera podía recorrer números y sacar el directorio de la
 * empresa. Este endpoint cierra eso: sin el correo correcto no devuelve nada.
 *
 * El mensaje de error es UNO SOLO para los tres casos —correo que no existe,
 * cédula que no coincide, o ninguno de los dos—, para no confirmar qué correos
 * están en el listado.
 *
 * Lo que no hace, y hay que decirlo: esto no resiste un ataque de fuerza bruta.
 * Una cédula son de 7 a 10 dígitos y no hay bloqueo por intentos. Sigue siendo
 * identificación, no autenticación; el valor de la constancia lo sostiene la
 * declaración del final. Ver docs/decisiones/2026-08-28-entrada-con-cedula.md.
 */

import type { Env } from "./_lib/entorno";
import { leerValores } from "./_lib/sheets";
import { fallaServidor, malaPeticion, ok } from "./_lib/http";
import { titulo } from "./_lib/texto";
import { esCedulaAdmin } from "./_lib/admin";

const HOJA = "personal";

/** Columnas de la hoja `personal`. Ver scripts/importar_personal.py. */
const COL = { cedula: 0, nombre: 1, correo: 2, cargo: 3, area: 5 };

// El listado cambia cuando Talento Humano lo actualiza, o sea casi nunca. Se
// cachea para no gastar la cuota de lectura del Sheet en cada intento.
const CACHE_MS = 6 * 60 * 60 * 1000;
let cache: { filas: string[][]; vence: number } | null = null;

/** Mismo texto para todos los fallos: no delata qué correos existen. */
const NO_COINCIDE =
  "El correo y la cédula no coinciden con ningún registro. " +
  "Revísalos, o entra sin registro si no apareces en el listado de personal.";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let cuerpo: { correo?: string; cedula?: string };
  try {
    cuerpo = await request.json();
  } catch {
    return malaPeticion("No se entendió la petición.");
  }

  const correo = (cuerpo.correo || "").trim().toLowerCase();
  const cedula = (cuerpo.cedula || "").replace(/\D/g, "");

  if (!correo || !cedula) {
    return malaPeticion("Escribe tu correo y tu cédula.");
  }

  try {
    if (!cache || cache.vence <= Date.now()) {
      cache = {
        filas: await leerValores(env, `${HOJA}!A2:H`),
        vence: Date.now() + CACHE_MS,
      };
    }

    // La coincidencia es por las DOS columnas a la vez, en la misma fila.
    const fila = cache.filas.find(
      (f) =>
        (f[COL.correo] || "").trim().toLowerCase() === correo &&
        (f[COL.cedula] || "").replace(/\D/g, "") === cedula,
    );

    if (!fila) return ok({ encontrada: false, mensaje: NO_COINCIDE });

    return ok({
      encontrada: true,
      cedula,
      // Solo para decidir si se pinta la pestaña. No da acceso a nada: quien
      // se lo ponga a mano en la sesión verá la pestaña y un 404 detrás.
      esAdmin: esCedulaAdmin(env, cedula),
      // Si hay que pedir la segunda clave. Se dice ÚNICAMENTE a quien ya es
      // admin: al resto no le llega ni la palabra "clave".
      exigeClaveAdmin: esCedulaAdmin(env, cedula) && !!env.CLAVE_ADMIN,
      nombre: titulo(fila[COL.nombre] || ""),
      correo: (fila[COL.correo] || "").trim().toLowerCase(),
      cargo: titulo(fila[COL.cargo] || ""),
      area: titulo(fila[COL.area] || ""),
    });
  } catch (e) {
    return fallaServidor(e);
  }
};
