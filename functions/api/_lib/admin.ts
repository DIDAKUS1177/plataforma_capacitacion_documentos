/**
 * Quién puede ver la pestaña Bases.
 *
 * La lista de cédulas vive en la variable de entorno `CEDULAS_ADMIN`, en el
 * servidor. No puede ir en el código del navegador: la cédula es la mitad de la
 * credencial de entrada, así que publicarla en el bundle sería regalarla.
 *
 * Ocultar la pestaña no protege nada — cualquiera puede fabricarse una sesión
 * desde la consola del navegador. Lo que protege es que el endpoint vuelva a
 * verificar correo y cédula contra la hoja `personal` en CADA petición, sin
 * creerle nada al cliente.
 */

import type { Env } from "./entorno";

export function esCedulaAdmin(env: Env, cedula: string): boolean {
  const limpia = (cedula || "").replace(/\D/g, "");
  if (!limpia) return false;

  return (env.CEDULAS_ADMIN || "")
    .split(",")
    .map((c) => c.replace(/\D/g, ""))
    .filter(Boolean)
    .includes(limpia);
}

/**
 * La clave extra, si está configurada. Comparación de tiempo constante: una
 * comparación normal se corta en el primer carácter distinto y filtra, con el
 * tiempo de respuesta, cuántos caracteres iban bien.
 */
export function claveAdminValida(env: Env, clave: string | undefined): boolean {
  const esperada = env.CLAVE_ADMIN || "";
  if (!esperada) return true; // no configurada: basta con la sesión

  const dada = clave || "";
  if (dada.length !== esperada.length) return false;

  let diferencia = 0;
  for (let i = 0; i < esperada.length; i++) {
    diferencia |= esperada.charCodeAt(i) ^ dada.charCodeAt(i);
  }
  return diferencia === 0;
}
