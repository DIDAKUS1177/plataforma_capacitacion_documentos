/**
 * Validación compartida. La usa el navegador para avisar antes de enviar y el
 * servidor para decidir si escribe. Es el mismo archivo a propósito: si vive
 * en dos lados se desincroniza y el servidor termina aceptando lo que el
 * formulario rechazaba (o al revés).
 *
 * El servidor NUNCA confía en la validación del cliente: se puede saltar desde
 * la consola del navegador. Por eso ambas la ejecutan.
 */

import type { DatosConstancia, DatosMejora, DatosRegistro } from "./tipos";

/** Quita puntos, espacios y guiones de la cédula. En campo la escriben así. */
export function normalizarCedula(cedula: string): string {
  return (cedula || "").replace(/[.\s-]/g, "");
}

export function validarCorreo(correo: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo || "");
}

/**
 * Valida los datos de identidad. La usan el registro inicial y la constancia,
 * porque son los mismos campos: si vivieran duplicadas se desincronizarían.
 *
 * Devuelve el primer problema encontrado, o null si todo está bien.
 * `dominio` vacío = se acepta cualquier dominio.
 */
export function validarRegistro(
  d: Partial<DatosRegistro>,
  dominio: string,
): string | null {
  if (!(d.appId || "").trim()) {
    return "Elige el formato sobre el que te vas a capacitar.";
  }

  const nombre = (d.nombre || "").trim();
  if (nombre.split(/\s+/).filter(Boolean).length < 2) {
    return "Escribe tu nombre completo (nombre y apellido).";
  }

  const cedula = normalizarCedula(d.cedula || "");
  if (!/^\d{6,12}$/.test(cedula)) {
    return "La cédula debe tener entre 6 y 12 dígitos, sin puntos.";
  }

  const correo = (d.correo || "").trim().toLowerCase();
  if (!validarCorreo(correo)) {
    return "Revisa el correo: no tiene un formato válido.";
  }
  if (dominio && !correo.endsWith("@" + dominio.toLowerCase())) {
    return `Usa tu correo corporativo (@${dominio}).`;
  }

  if (!(d.cargo || "").trim()) {
    return "Falta tu cargo o la técnica que ejecutas.";
  }
  if (!(d.areaUn || "").trim()) {
    return "Falta el área o unidad de negocio.";
  }
  return null;
}

/** La constancia son los mismos datos más las aceptaciones y la evaluación. */
export function validarConstancia(
  d: Partial<DatosConstancia>,
  dominio: string,
  exigeFirma: boolean,
): string | null {
  const problema = validarRegistro(d, dominio);
  if (problema) return problema;

  if (!d.aceptaDeclaracion || !d.aceptaDatos) {
    return "Debes aceptar las dos casillas para registrar la constancia.";
  }
  if (exigeFirma && !(d.firma || "").startsWith("data:image/")) {
    return "Falta tu firma.";
  }
  if (!d.aprobado) {
    return "Primero tienes que aprobar la evaluación.";
  }
  return null;
}

export const LARGO_MINIMO_DESCRIPCION = 15;

export function validarMejora(d: Partial<DatosMejora>): string | null {
  if (!(d.aplicacion || "").trim()) return "Selecciona la aplicación.";
  if (!(d.tipo || "").trim()) return "Selecciona el tipo de reporte.";
  if ((d.descripcion || "").trim().length < LARGO_MINIMO_DESCRIPCION) {
    return "Cuéntanos un poco más: describe qué pasó o qué propones.";
  }
  const correo = (d.correo || "").trim();
  if (correo && !validarCorreo(correo)) {
    return "El correo que dejaste no tiene un formato válido (o déjalo vacío).";
  }

  const whatsapp = (d.whatsapp || "").trim();
  if (whatsapp && !validarTelefono(whatsapp)) {
    return "Revisa el número de WhatsApp: escríbelo con indicativo si es del exterior (o déjalo vacío).";
  }
  return null;
}

/**
 * Solo cuenta dígitos. Se acepta con o sin +57, con espacios o guiones: la
 * gente lo escribe de las dos formas y rechazarlo por el formato solo logra
 * que dejen el campo vacío.
 */
export function validarTelefono(numero: string): boolean {
  const digitos = (numero || "").replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 15;
}

/** Deja el número en dígitos, para que en el Sheet queden todos igual. */
export function normalizarTelefono(numero: string): string {
  return (numero || "").replace(/\D/g, "");
}
