/** POST /api/mejora — registra una falla o una propuesta de mejora. */

import type { DatosMejora } from "../../shared/tipos";
import { validarMejora } from "../../shared/validacion";
import type { Env } from "./_lib/entorno";
import { enviarCorreo } from "./_lib/correo";
import { agregarFila, HOJA_MEJORAS, siguienteIdMejora } from "./_lib/sheets";
import { fallaServidor, fechaBogota, fechaLegible, leerJson, malaPeticion, ok } from "./_lib/http";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const datos = await leerJson<DatosMejora>(request);
  if (!datos) return malaPeticion("No llegó información. Intenta otra vez.");

  const problema = validarMejora(datos);
  if (problema) return malaPeticion(problema);

  try {
    const hoja = HOJA_MEJORAS;
    const id = await siguienteIdMejora(env);
    const correo = (datos.correo || "").trim().toLowerCase();

    await agregarFila(env, hoja, [
      id,
      fechaBogota(),
      datos.aplicacion.trim(),
      datos.tipo.trim(),
      (datos.criticidad || "").trim(),
      datos.descripcion.trim(),
      (datos.nombre || "").trim(),
      correo,
      "Recibida", // estado — de aquí en adelante lo llena el supervisor
      "", // responsable
      "", // respuesta
      "", // fecha_respuesta
      "", // id_changelog
    ]);

    // El acuse va después de escribir: si el correo falla, el reporte ya está
    // guardado y no se pierde nada.
    const correoEnviado = await avisar(env, id, datos, correo);

    return ok(
      { id, correoEnviado },
      correoEnviado
        ? `Tu reporte quedó con el número ${id}. Te enviamos una copia a ${correo}.`
        : `Tu reporte quedó con el número ${id}.`,
    );
  } catch (e) {
    return fallaServidor(e);
  }
};

/**
 * Acuse de recibo con el número del ticket.
 *
 * Si el inspector dejó correo, le llega a él con copia a calidad. Si no dejó,
 * al menos se le avisa a calidad que entró algo nuevo — de lo contrario el
 * buzón depende de que alguien se acuerde de abrir el Sheet.
 *
 * Devuelve true solo si se le mandó al inspector: es lo que la pantalla le
 * promete.
 */
async function avisar(
  env: Env,
  id: string,
  datos: DatosMejora,
  correo: string,
): Promise<boolean> {
  const calidad = (env.CORREO_CALIDAD || "").trim();

  if (!correo) {
    if (calidad) {
      await enviarCorreo(env, {
        para: calidad,
        asunto: `Nuevo reporte ${id} — ${datos.aplicacion}`,
        html: cuerpoParaCalidad(id, datos),
      });
    }
    return false;
  }

  return enviarCorreo(env, {
    para: correo,
    cc: calidad || undefined,
    asunto: `Recibimos tu reporte ${id} — ADEMINCOL`,
    html: cuerpoParaQuienReporta(id, datos),
  });
}

const CELDA = 'style="border:1px solid #e2e8f0;padding:8px;text-align:left"';

function fila(k: string, v: string): string {
  return `<tr><td ${CELDA}><b>${escapar(k)}</b></td><td ${CELDA}>${escapar(v)}</td></tr>`;
}

function cuerpoParaQuienReporta(id: string, datos: DatosMejora): string {
  const nombre = (datos.nombre || "").trim();
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#1e293b;font-size:14px">
      <p>${nombre ? `Hola ${escapar(nombre)},` : "Hola,"}</p>
      <p>Recibimos tu reporte. Este es su número:</p>
      <p style="font-size:22px;font-weight:700;color:#dc2626;margin:4px 0 16px">${id}</p>
      <table style="border-collapse:collapse">
        ${fila("Aplicación", datos.aplicacion)}
        ${fila("Tipo", datos.tipo)}
        ${fila("Qué tanto te afecta", datos.criticidad || "—")}
        ${fila("Fecha", fechaLegible())}
      </table>
      <p style="margin-top:16px"><b>Lo que reportaste</b></p>
      <p style="background:#f8fafc;border-left:3px solid #dc2626;padding:10px 12px;
                white-space:pre-wrap">${escapar(datos.descripcion)}</p>
      <p><b>Qué sigue:</b> lo revisa el área de calidad. Si se acepta, verás el
      cambio en la aplicación y te avisamos citando este número.</p>
      <p style="font-size:13px;color:#64748b">Guarda este correo: con el número
      ${id} puedes preguntar en qué quedó.</p>
      <p style="font-size:13px;color:#64748b">ADEMINCOL S.A.S.</p>
    </div>`;
}

function cuerpoParaCalidad(id: string, datos: DatosMejora): string {
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#1e293b;font-size:14px">
      <p>Entró un reporte nuevo al buzón de mejoras (sin correo de contacto).</p>
      <table style="border-collapse:collapse">
        ${fila("Número", id)}
        ${fila("Aplicación", datos.aplicacion)}
        ${fila("Tipo", datos.tipo)}
        ${fila("Criticidad", datos.criticidad || "—")}
        ${fila("Fecha", fechaLegible())}
      </table>
      <p style="background:#f8fafc;border-left:3px solid #dc2626;padding:10px 12px;
                white-space:pre-wrap">${escapar(datos.descripcion)}</p>
    </div>`;
}

/**
 * La descripción la escribe el inspector: si trae `<` o `&` sin escapar,
 * rompe el HTML del correo (o peor, inyecta etiquetas).
 */
function escapar(texto: string): string {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
