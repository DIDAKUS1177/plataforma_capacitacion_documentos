/** Llamadas a las funciones del servidor (/api/*). */

import type { Aplicacion, DatosConstancia, DatosMejora, Resultado } from "../../shared/tipos";

export interface ConfigServidor {
  dominio: string;
  exigeFirma: boolean;
}

/** Error con el mensaje que se le puede mostrar tal cual al inspector. */
export class ErrorApi extends Error {}

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, opciones);
  } catch {
    // Sin conexión: pasa en campo todo el tiempo.
    throw new ErrorApi("Sin conexión. Revisa la señal e intenta otra vez.");
  }

  let cuerpo: Resultado<T>;
  try {
    cuerpo = (await respuesta.json()) as Resultado<T>;
  } catch {
    throw new ErrorApi("El servidor respondió algo inesperado. Intenta otra vez.");
  }

  if (!cuerpo.ok) throw new ErrorApi(cuerpo.mensaje || "No se pudo completar la operación.");
  return cuerpo.datos as T;
}

async function enviar<T>(ruta: string, datos: unknown): Promise<Resultado<T>> {
  const respuesta = await fetch(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }).catch(() => {
    throw new ErrorApi("Sin conexión. Revisa la señal e intenta otra vez.");
  });

  const cuerpo = (await respuesta.json().catch(() => null)) as Resultado<T> | null;
  if (!cuerpo) throw new ErrorApi("El servidor respondió algo inesperado.");
  if (!cuerpo.ok) throw new ErrorApi(cuerpo.mensaje || "No se pudo guardar.");
  return cuerpo;
}

export function obtenerConfig(): Promise<ConfigServidor> {
  return pedir<ConfigServidor>("/api/config");
}

export function obtenerAplicaciones(): Promise<Aplicacion[]> {
  return pedir<Aplicacion[]>("/api/aplicaciones");
}

export function registrarConstancia(datos: DatosConstancia) {
  return enviar<{ repetida: boolean; correoEnviado: boolean }>("/api/constancia", datos);
}

export function registrarMejora(datos: DatosMejora) {
  return enviar<{ id: string }>("/api/mejora", datos);
}
