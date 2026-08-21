/**
 * Guarda la firma dibujada como PNG en una carpeta de Drive y devuelve el
 * enlace, para que en el Sheet quede una URL y no un dataURL de 20 KB.
 *
 * Opcional: si no hay CARPETA_FIRMAS_ID configurada, no se guarda nada y la
 * columna queda vacía. El registro de la constancia no depende de esto.
 */

import { obtenerToken } from "./google";
import type { Env } from "./entorno";

const SCOPES_DRIVE = ["https://www.googleapis.com/auth/drive.file"];

export async function guardarFirma(
  env: Env & { CARPETA_FIRMAS_ID?: string },
  dataUrl: string,
  nombreArchivo: string,
): Promise<string> {
  const carpeta = env.CARPETA_FIRMAS_ID;
  if (!carpeta || !dataUrl.startsWith("data:image/")) return "";

  try {
    const bytes = bytesDesdeDataUrl(dataUrl);
    const token = await obtenerToken(env, SCOPES_DRIVE);

    const metadatos = JSON.stringify({
      name: nombreArchivo,
      parents: [carpeta],
      mimeType: "image/png",
    });

    // Subida multipart: metadatos + binario en una sola petición.
    const limite = "limite-" + crypto.randomUUID();
    const cuerpo = new Blob([
      `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadatos}\r\n`,
      `--${limite}\r\nContent-Type: image/png\r\n\r\n`,
      bytes,
      `\r\n--${limite}--`,
    ]);

    const respuesta = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${limite}`,
        },
        body: cuerpo,
      },
    );

    if (!respuesta.ok) {
      console.error("Drive rechazó la firma:", await respuesta.text());
      return "";
    }
    const { id } = (await respuesta.json()) as { id: string };
    return `https://drive.google.com/file/d/${id}/view`;
  } catch (e) {
    console.error("No se pudo guardar la firma:", e);
    return "";
  }
}

function bytesDesdeDataUrl(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}
