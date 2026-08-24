/**
 * Variables de entorno de las funciones (Cloudflare Pages → Settings →
 * Environment variables). En local se leen de `.dev.vars`.
 *
 * GOOGLE_PRIVATE_KEY va como secreto, nunca en el repo.
 */
export interface Env {
  /** Correo del service account, ej. didakus@adcformatos.iam.gserviceaccount.com */
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  /** Llave privada del service account, en PEM. Los \n pueden ir escapados. */
  GOOGLE_PRIVATE_KEY: string;
  /** Id del Sheet donde se guarda todo. */
  SHEET_ID: string;
  /** Dominio corporativo exigido en el correo. Vacío = cualquiera. */
  DOMINIO_CORPORATIVO?: string;
  /** Copia oculta de cada constancia. Vacío = no se manda. */
  CORREO_CALIDAD?: string;
  /**
   * Buzón de Workspace desde el que salen los correos, ej.
   * capacitaciones@ademincol.com. Requiere delegación de dominio para el
   * service account. Vacío = no se manda correo (el registro igual se guarda).
   */
  GMAIL_REMITENTE?: string;
  /** Id del Listado Maestro, solo lectura. Vacío = se usa la lista de respaldo. */
  LISTADO_MAESTRO_ID?: string;
  LISTADO_MAESTRO_HOJA?: string;
  /** Quien dicta la capacitación. Va en la constancia (campo del F-SIG-19). */
  EXPOSITOR?: string;
  /** "true" para exigir firma dibujada además de la casilla de aceptación. */
  EXIGE_FIRMA?: string;
  /** Carpeta de Drive donde se guardan las firmas. Vacío = no se guardan. */
  CARPETA_FIRMAS_ID?: string;
}

/** Falla temprano y con mensaje claro si falta configuración. */
export function exigir(env: Env, clave: keyof Env): string {
  const valor = env[clave];
  if (!valor) throw new Error(`Falta la variable de entorno ${clave}.`);
  return String(valor);
}
