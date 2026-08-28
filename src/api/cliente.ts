/** Llamadas a las funciones del servidor (/api/*). */

import type {
  Aplicacion,
  DatosConstancia,
  DatosMejora,
  DatosRegistro,
  Resultado,
} from "../../shared/tipos";

/** Lo que devuelve la verificación pública. Datos mínimos a propósito. */
export interface Verificacion {
  nombre: string;
  /** Enmascarada: ****6432 */
  cedula: string;
  curso: string;
  cursoCodigo: string;
  cursoVersion: string;
  formato: string;
  tecnica: string;
  fecha: string;
  resultado: string;
  aprobado: boolean;
}

/** Estado de un reporte del buzón, para quien lo levantó. */
export interface EstadoReporte {
  id: string;
  fecha: string;
  aplicacion: string;
  tipo: string;
  criticidad: string;
  descripcion: string;
  estado: string;
  responsable: string;
  respuesta: string;
  fechaRespuesta: string;
  respondido: boolean;
}

/** Lo que devuelve la entrada. `encontrada: false` = correo y cédula no casan. */
export interface Persona {
  encontrada: boolean;
  /** El texto que se le muestra a la persona cuando no coincide. */
  mensaje?: string;
  cedula?: string;
  nombre?: string;
  correo?: string;
  cargo?: string;
  area?: string;
}

export interface CapacitacionHecha {
  fecha: string;
  curso: string;
  version: string;
  formato: string;
  resultado: string;
  id: string;
}

export interface Historial {
  encontrada: boolean;
  enRoster: boolean;
  nombre: string;
  hechas: CapacitacionHecha[];
  aMedias: { fecha: string; formato: string }[];
}

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

/**
 * Entrar con correo + cédula. Va por POST y no por GET a propósito: una cédula
 * en la barra de direcciones queda en el historial del navegador y en los logs.
 */
export async function entrarConCedula(correo: string, cedula: string): Promise<Persona> {
  const r = await enviar<Persona>("/api/entrar", { correo, cedula });
  return r.datos as Persona;
}

export function obtenerHistorial(cedula: string): Promise<Historial> {
  return pedir<Historial>(`/api/historial?cedula=${encodeURIComponent(cedula)}`);
}

export function obtenerAplicaciones(): Promise<Aplicacion[]> {
  return pedir<Aplicacion[]>("/api/aplicaciones");
}

export function registrarInicio(datos: DatosRegistro) {
  return enviar<{ registrado: boolean }>("/api/registro", datos);
}

export function registrarConstancia(datos: DatosConstancia) {
  return enviar<{ repetida: boolean; correoEnviado: boolean; id: string }>(
    "/api/constancia",
    datos,
  );
}

export async function consultarReporte(id: string, correo: string): Promise<EstadoReporte> {
  const r = await enviar<EstadoReporte>("/api/consulta", { id, correo });
  return r.datos as EstadoReporte;
}

export function verificarConstancia(id: string): Promise<Verificacion> {
  return pedir<Verificacion>(`/api/verificar?id=${encodeURIComponent(id)}`);
}

export function registrarMejora(datos: DatosMejora) {
  return enviar<{ id: string; correoEnviado: boolean }>("/api/mejora", datos);
}
