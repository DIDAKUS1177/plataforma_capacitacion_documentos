/** Tipos compartidos entre el navegador y las funciones del servidor. */

export interface RespuestaEvaluacion {
  numero: number;
  enunciado: string;
  respondio: string;
  correcta: boolean;
}

export interface DatosConstancia {
  nombre: string;
  cedula: string;
  correo: string;
  cargo: string;
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
