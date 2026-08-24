/**
 * Envío de correo con la API de Gmail, usando el mismo service account.
 *
 * Requiere delegación de dominio en Workspace: el service account queda
 * autorizado para enviar como GMAIL_REMITENTE. Se eligió esto en vez de un
 * servicio externo (Resend, SendGrid) para no meter otro proveedor ni otra
 * factura: el correo sale del propio Workspace de la empresa.
 *
 * Si GMAIL_REMITENTE no está configurado, no se manda nada y no se rompe: el
 * registro en el Sheet ya quedó guardado antes de llegar aquí.
 */

import { obtenerToken } from "./google";
import type { Env } from "./entorno";

const SCOPES_GMAIL = ["https://www.googleapis.com/auth/gmail.send"];

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
    const token = await obtenerToken(env, SCOPES_GMAIL, remitente);
    const crudo = armarMime(remitente, correo);

    const respuesta = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: crudo }),
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

function armarMime(remitente: string, correo: Correo): string {
  const lineas = [
    `From: ADEMINCOL <${remitente}>`,
    `To: ${correo.para}`,
    correo.cc ? `Cc: ${correo.cc}` : "",
    `Subject: ${codificarAsunto(correo.asunto)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64DesdeTexto(correo.html),
  ].filter(Boolean);

  return base64url(lineas.join("\r\n"));
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
