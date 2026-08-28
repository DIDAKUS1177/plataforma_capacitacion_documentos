/**
 * GET /api/persona?cedula=... — datos del listado de personal, para
 * autocompletar el registro.
 *
 * Devuelve lo que el formulario necesita y nada más: nombre, correo, cargo y
 * área. Ni categoría, ni lugar de trabajo, ni el correo personal (ese ni
 * siquiera se importa).
 *
 * Si la cédula no está en el listado, responde `encontrada: false` y la persona
 * llena los campos a mano. No se bloquea a nadie: un contratista nuevo tiene
 * que poder capacitarse el mismo día que llega.
 */

import type { Env } from "./_lib/entorno";
import { leerValores } from "./_lib/sheets";
import { fallaServidor, malaPeticion, ok } from "./_lib/http";
import { titulo } from "./_lib/texto";

const HOJA = "personal";

/** Columnas de la hoja `personal`. Ver scripts/importar_personal.py. */
const COL = { cedula: 0, nombre: 1, correo: 2, cargo: 3, area: 5 };

// El listado cambia cuando RR. HH. lo actualiza, o sea casi nunca. Se cachea
// para no gastar la cuota de lectura en cada tecla del formulario.
const CACHE_MS = 6 * 60 * 60 * 1000;
let cache: { filas: string[][]; vence: number } | null = null;

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const cedula = (new URL(request.url).searchParams.get("cedula") || "").replace(/\D/g, "");
  if (cedula.length < 6) return malaPeticion("Escribe la cédula completa.");

  try {
    if (!cache || cache.vence <= Date.now()) {
      cache = {
        filas: await leerValores(env, `${HOJA}!A2:H`),
        vence: Date.now() + CACHE_MS,
      };
    }

    const fila = cache.filas.find(
      (f) => (f[COL.cedula] || "").replace(/\D/g, "") === cedula,
    );

    if (!fila) return ok({ encontrada: false });

    return ok({
      encontrada: true,
      nombre: titulo(fila[COL.nombre] || ""),
      correo: (fila[COL.correo] || "").trim().toLowerCase(),
      cargo: titulo(fila[COL.cargo] || ""),
      area: titulo(fila[COL.area] || ""),
    });
  } catch (e) {
    return fallaServidor(e);
  }
};
