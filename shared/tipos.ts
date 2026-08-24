/** Tipos compartidos entre el navegador y las funciones del servidor. */

export interface RespuestaEvaluacion {
  numero: number;
  enunciado: string;
  respondio: string;
  correcta: boolean;
}

/**
 * Una fila del Listado Maestro de Aplicaciones (el Sheet de calidad).
 * Es la misma forma que se usa para elegir la capacitación y para el
 * desplegable del buzón de mejoras: una sola fuente para las dos cosas.
 */
export interface Aplicacion {
  /** APP-022 */
  id: string;
  nombre: string;
  /** MT, VT / API 510, PMI / OCR… tal cual está en el Sheet. */
  tecnica: string;
  /** Código ADC del formato, ej. F-OPE-C-105. Puede venir vacío. */
  codigo: string;
  /** Versión del formato. Puede venir vacía. */
  version: string;
  estado: string;
}

export interface DatosConstancia {
  nombre: string;
  cedula: string;
  correo: string;
  cargo: string;
  /** Área o unidad de negocio. Lo pide el F-SIG-19. */
  areaUn: string;
  /** Aplicación para la que se capacita. */
  appId: string;
  appNombre: string;
  tecnica: string;
  aceptaDeclaracion: boolean;
  aceptaDatos: boolean;
  firma: string; // dataURL PNG de la firma dibujada, o "" si no se exige
  cursoCodigo: string;
  cursoNombre: string;
  cursoVersion: string;
  puntaje: number;
  totalPreguntas: number;
  aprobado: boolean;
  minutos: number;
  respuestas: RespuestaEvaluacion[];
}

export interface DatosMejora {
  aplicacion: string;
  tipo: string;
  criticidad: string;
  descripcion: string;
  nombre: string;
  correo: string;
}

export interface Resultado<T = unknown> {
  ok: boolean;
  mensaje?: string;
  datos?: T;
}
