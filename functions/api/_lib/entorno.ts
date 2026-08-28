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
  /**
   * Vía B (OAuth de usuario): sirve también con cuentas @gmail.com. Se obtiene
   * una vez con `scripts/autorizar_gmail.py`. Si están las tres, se usa esta
   * vía en vez de la delegación de dominio.
   */
  GMAIL_REFRESH_TOKEN?: string;
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  /** Id del Listado Maestro, solo lectura. Vacío = se usa la lista de respaldo. */
  LISTADO_MAESTRO_ID?: string;
  LISTADO_MAESTRO_HOJA?: string;
  /** Quien dicta la capacitación. Va en la constancia (campo del F-SIG-19). */
  EXPOSITOR?: string;
  /**
   * Protege POST /api/notificar. Sin ella el endpoint no funciona: cualquiera
   * podría dispararlo y gastar la cuota de envío de correo.
   */
  CLAVE_NOTIFICACIONES?: string;
  /** "true" para exigir firma dibujada además de la casilla de aceptación. */
  EXIGE_FIRMA?: string;
  /** Carpeta de Drive donde se guardan las firmas. Vacío = no se guardan. */
  CARPETA_FIRMAS_ID?: string;
  /**
   * Cédulas que ven la pestaña Bases, separadas por coma. Vacío = nadie la ve
   * y el endpoint responde como si no existiera.
   *
   * Va en el servidor y no en el código del navegador a propósito: la cédula es
   * la mitad de la credencial de entrada, así que publicarla en el bundle sería
   * regalarla.
   */
  CEDULAS_ADMIN?: string;
  /**
   * Segunda clave opcional para la pestaña Bases. Si está puesta, además del
   * correo y la cédula hay que escribirla. Vacío = basta con la sesión.
   *
   * Existe porque la cédula no es un secreto y esa pestaña muestra el
   * directorio completo. Ponerla es cambiar una variable, no tocar código.
   */
  CLAVE_ADMIN?: string;
}

/** Falla temprano y con mensaje claro si falta configuración. */
export function exigir(env: Env, clave: keyof Env): string {
  const valor = env[clave];
  if (!valor) throw new Error(`Falta la variable de entorno ${clave}.`);
  return String(valor);
}
