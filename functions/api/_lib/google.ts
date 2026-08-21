/**
 * Autenticación contra Google desde el runtime de Cloudflare.
 *
 * Las librerías oficiales de Google son de Node y no corren aquí, así que el
 * JWT se arma y se firma a mano con WebCrypto. Son ~50 líneas y evitan meter
 * una dependencia pesada en el borde.
 *
 * El token dura 1 hora y se guarda en memoria del isolate: las peticiones
 * seguidas no vuelven a pedirlo.
 */

import { exigir, type Env } from "./entorno";

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface TokenCacheado {
  token: string;
  venceEn: number; // epoch ms
}

const cache = new Map<string, TokenCacheado>();

export async function obtenerToken(
  env: Env,
  scopes: string[],
  /** Usuario a suplantar (delegación de dominio). Solo para Gmail. */
  suplantar?: string,
): Promise<string> {
  const clave = scopes.join(" ") + "|" + (suplantar || "");
  const guardado = cache.get(clave);
  // Margen de 60 s para no usar un token que vence en el camino.
  if (guardado && guardado.venceEn > Date.now() + 60_000) return guardado.token;

  const correo = exigir(env, "GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const ahora = Math.floor(Date.now() / 1000);

  const encabezado = { alg: "RS256", typ: "JWT" };
  const cuerpo: Record<string, string | number> = {
    iss: correo,
    scope: scopes.join(" "),
    aud: OAUTH_TOKEN_URL,
    iat: ahora,
    exp: ahora + 3600,
  };
  if (suplantar) cuerpo.sub = suplantar;

  const sinFirmar = `${base64url(JSON.stringify(encabezado))}.${base64url(JSON.stringify(cuerpo))}`;
  const firma = await firmar(sinFirmar, exigir(env, "GOOGLE_PRIVATE_KEY"));
  const jwt = `${sinFirmar}.${firma}`;

  const respuesta = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`Google rechazó las credenciales (${respuesta.status}): ${detalle}`);
  }

  const datos = (await respuesta.json()) as { access_token: string; expires_in: number };
  cache.set(clave, {
    token: datos.access_token,
    venceEn: Date.now() + datos.expires_in * 1000,
  });
  return datos.access_token;
}

async function firmar(texto: string, pemCrudo: string): Promise<string> {
  const llave = await importarLlave(pemCrudo);
  const firma = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    llave,
    new TextEncoder().encode(texto),
  );
  return base64urlDesdeBytes(new Uint8Array(firma));
}

async function importarLlave(pemCrudo: string): Promise<CryptoKey> {
  // Al pegar la llave en un panel de variables de entorno los saltos de línea
  // suelen quedar como \n literales. Se aceptan las dos formas.
  const pem = pemCrudo.replace(/\\n/g, "\n").trim();
  const cuerpo = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");

  const binario = atob(cuerpo);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);

  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function base64url(texto: string): string {
  return base64urlDesdeBytes(new TextEncoder().encode(texto));
}

function base64urlDesdeBytes(bytes: Uint8Array): string {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
