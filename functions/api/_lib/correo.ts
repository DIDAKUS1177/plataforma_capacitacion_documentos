/**
 * Envío de correo con la API de Gmail. Hay dos vías, y la app soporta las dos
 * porque cuál sirve depende de si la empresa tiene Google Workspace:
 *
 *  A) Delegación de dominio (solo Workspace). El service account queda
 *     autorizado por el admin para enviar como GMAIL_REMITENTE. No hay tokens
 *     que rotar. Si la cuenta es un @gmail.com corriente esto NO funciona:
 *     Google responde `invalid_grant / Invalid email or User ID`, porque un
 *     service account solo puede suplantar cuentas de un dominio que administra.
 *
 *  B) OAuth de usuario (sirve con @gmail.com y con Workspace). El dueño del
 *     buzón autoriza una vez desde el navegador con `scripts/autorizar_gmail.py`
 *     y se guarda el refresh token como secreto. La app pide un access token
 *     con ese refresh token cada vez que lo necesita.
 *
 * Si están configuradas las dos, gana la B: es la explícita.
 *
 * Si no hay ninguna, no se manda nada y no se rompe: el registro en el Sheet ya
 * quedó guardado antes de llegar aquí.
 */

import { obtenerToken } from "./google";
import type { Env } from "./entorno";

const SCOPES_GMAIL = ["https://www.googleapis.com/auth/gmail.send"];
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface Correo {
  para: string;
  cc?: string;
  asunto: string;
  html: string;
}

/** Devuelve true si se envió, false si no estaba configurado o falló. */
export async function enviarCorreo(env: Env, correo: Correo): Promise<boolean> {
  const remitente = env.GMAIL_REMITENTE;
  if (!remitente) {
    // Queda en los logs de Cloudflare: si no, "no llegó el correo" se
    // investiga a ciegas.
    console.warn(
      `Correo NO enviado a ${correo.para}: falta GMAIL_REMITENTE. ` +
        "El registro sí quedó guardado.",
    );
    return false;
  }

  try {
    const token = await tokenDeGmail(env, remitente);
    if (!token) {
      console.warn(
        `Correo NO enviado a ${correo.para}: no hay forma de autenticarse ` +
          "(ni refresh token de usuario ni delegación de dominio).",
      );
      return false;
    }

    const respuesta = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: armarMime(remitente, correo) }),
      },
    );

    if (!respuesta.ok) {
      console.error("Gmail rechazó el envío:", await respuesta.text());
      return false;
    }
    return true;
  } catch (e) {
    // Nunca tumbar la petición por un correo: el dato ya está guardado.
    console.error("No se pudo enviar el correo:", e);
    return false;
  }
}

/** Access token por la vía B si está configurada; si no, por la vía A. */
async function tokenDeGmail(env: Env, remitente: string): Promise<string | null> {
  if (env.GMAIL_REFRESH_TOKEN && env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET) {
    return tokenDesdeRefresh(env);
  }
  // Vía A: el JWT lleva `sub` = el buzón a suplantar.
  return obtenerToken(env, SCOPES_GMAIL, remitente);
}

/**
 * Cambia el refresh token por un access token. Los access token duran una hora
 * y `obtenerToken` no sirve aquí porque esta vía no usa el service account.
 */
async function tokenDesdeRefresh(env: Env): Promise<string | null> {
  const respuesta = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: String(env.GMAIL_CLIENT_ID),
      client_secret: String(env.GMAIL_CLIENT_SECRET),
      refresh_token: String(env.GMAIL_REFRESH_TOKEN),
      grant_type: "refresh_token",
    }),
  });

  if (!respuesta.ok) {
    // Pasa si revocaron el permiso desde la cuenta de Google.
    console.error("El refresh token de Gmail no sirve:", await respuesta.text());
    return null;
  }
  const datos = (await respuesta.json()) as { access_token: string };
  return datos.access_token;
}

function armarMime(remitente: string, correo: Correo): string {
  // Las cabeceras se filtran aparte del cuerpo. Antes iban todas en un arreglo
  // con un `.filter(Boolean)` para quitar el Cc vacío, y ese filtro se comía
  // también la LÍNEA EN BLANCO que separa cabeceras de cuerpo. Sin ella el
  // cuerpo se lee como una cabecera más y el correo llega solo con el asunto.
  const lineas = [
    `From: ADEMINCOL <${remitente}>`,
    `To: ${correo.para}`,
    correo.cc ? `Cc: ${correo.cc}` : "",
    `Subject: ${codificarAsunto(correo.asunto)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ].filter(Boolean);

  // El cuerpo en base64 va partido en líneas de 76 caracteres: es lo que exige
  // el RFC 2045 y hay clientes que descartan un cuerpo que se pase de ahí.
  const cuerpo = partirEnLineas(base64DesdeTexto(correo.html), 76);

  return base64url(lineas.join("\r\n") + "\r\n\r\n" + cuerpo);
}

function partirEnLineas(texto: string, largo: number): string {
  const trozos: string[] = [];
  for (let i = 0; i < texto.length; i += largo) trozos.push(texto.slice(i, i + largo));
  return trozos.join("\r\n");
}

/** Los asuntos con tildes o ñ tienen que ir codificados o llegan rotos. */
function codificarAsunto(asunto: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(asunto)) return asunto;
  return `=?UTF-8?B?${base64DesdeTexto(asunto)}?=`;
}

function base64DesdeTexto(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

function base64url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
