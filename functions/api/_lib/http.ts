/** Ayudas comunes de las funciones: respuestas JSON y fecha de Colombia. */

import type { Resultado } from "../../../shared/tipos";

export function json<T>(cuerpo: Resultado<T>, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function ok<T>(datos?: T, mensaje?: string): Response {
  return json({ ok: true, datos, mensaje });
}

/**
 * 400 con el motivo. Se usa para errores del usuario (campo mal escrito), no
 * para fallas del servidor: esas van con 500 y mensaje genérico.
 */
export function malaPeticion(mensaje: string): Response {
  return json({ ok: false, mensaje }, 400);
}

export function fallaServidor(e: unknown): Response {
  console.error(e);
  return json(
    { ok: false, mensaje: "No se pudo guardar. Intenta otra vez en un momento." },
    500,
  );
}

/**
 * Fecha y hora de Bogotá en formato yyyy-MM-dd HH:mm:ss.
 *
 * El runtime corre en UTC. Sin esto, un registro de las 8 p.m. en Colombia
 * queda con la fecha del día siguiente y las auditorías no cuadran.
 */
export function fechaBogota(fecha = new Date()): string {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(fecha);
  // "sv-SE" ya entrega "2026-08-21 14:03:11".
  return partes.replace("T", " ");
}

export function fechaLegible(fecha = new Date()): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
    timeStyle: "short",
  }).format(fecha);
}

/** Lee el JSON del cuerpo sin reventar si viene vacío o mal formado. */
export async function leerJson<T>(peticion: Request): Promise<T | null> {
  try {
    return (await peticion.json()) as T;
  } catch {
    return null;
  }
}
