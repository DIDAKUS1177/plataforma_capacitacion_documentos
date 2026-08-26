/**
 * POST /api/notificar — avisa por correo a quienes ya tienen respuesta.
 *
 * Recorre la hoja `mejoras` y manda el correo de las filas donde:
 *   - `respuesta` tiene contenido (el supervisor ya escribió qué se hizo),
 *   - hay `correo` de contacto,
 *   - y `notificado_en` está vacía (todavía no se le ha avisado).
 *
 * Después marca `notificado_en`, que es lo que evita repetir el correo en cada
 * revisión.
 *
 * Lo llama un Worker con tarea programada cada 15 minutos, porque Cloudflare
 * Pages no soporta disparos por tiempo. Va protegido con CLAVE_NOTIFICACIONES:
 * sin eso, cualquiera podría dispararlo y gastar la cuota de envío.
 */

import type { Env } from "./_lib/entorno";
import { enviarCorreo } from "./_lib/correo";
import { COL_MEJORA, escribirCeldas, HOJA_MEJORAS, leerValores } from "./_lib/sheets";
import { fallaServidor, fechaBogota, fechaLegible, json, ok } from "./_lib/http";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const clave = env.CLAVE_NOTIFICACIONES || "";
  if (!clave) {
    return json({ ok: false, mensaje: "Sin CLAVE_NOTIFICACIONES configurada." }, 503);
  }
  if (request.headers.get("x-clave") !== clave) {
    return json({ ok: false, mensaje: "No autorizado." }, 401);
  }

  try {
    const filas = await leerValores(env, `${HOJA_MEJORAS}!A2:N`);
    const marcas: Record<string, string> = {};
    const enviados: string[] = [];
    const fallidos: string[] = [];

    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      const v = (n: number) => (f[n] || "").trim();

      if (!v(COL_MEJORA.respuesta)) continue;
      if (v(COL_MEJORA.notificadoEn)) continue;

      const id = v(COL_MEJORA.id);
      const correo = v(COL_MEJORA.correo).toLowerCase();

      // Sin correo no hay a quién avisarle. Se marca igual para no volver a
      // mirarla en cada revisión.
      if (!correo) {
        marcas[`${HOJA_MEJORAS}!N${i + 2}`] = fechaBogota() + " (sin correo)";
        continue;
      }

      const salio = await enviarCorreo(env, {
        para: correo,
        cc: env.CORREO_CALIDAD || undefined,
        asunto: `Respuesta a tu reporte ${id} — ADEMINCOL`,
        html: cuerpo(v),
      });

      if (salio) {
        // Solo se marca si el correo salió: si falló, la próxima revisión lo
        // vuelve a intentar en vez de darlo por avisado.
        marcas[`${HOJA_MEJORAS}!N${i + 2}`] = fechaBogota();
        enviados.push(id);
      } else {
        fallidos.push(id);
      }
    }

    await escribirCeldas(env, marcas);
    return ok({ enviados, fallidos, revisadas: filas.length });
  } catch (e) {
    return fallaServidor(e);
  }
};

function cuerpo(v: (n: number) => string): string {
  const esc = (t: string) =>
    String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const celda = 'style="border:1px solid #e2e8f0;padding:8px;text-align:left"';
  const dato = (k: string, val: string) =>
    `<tr><td ${celda}><b>${k}</b></td><td ${celda}>${esc(val)}</td></tr>`;

  const nombre = v(COL_MEJORA.nombre);
  const responsable = v(COL_MEJORA.responsable);

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#1e293b;font-size:14px">
      <p>${nombre ? `Hola ${esc(nombre)},` : "Hola,"}</p>
      <p>Tenemos respuesta a tu reporte <b>${esc(v(COL_MEJORA.id))}</b>.</p>

      <table style="border-collapse:collapse">
        ${dato("Estado", v(COL_MEJORA.estado) || "Recibida")}
        ${dato("Aplicación", v(COL_MEJORA.aplicacion))}
        ${responsable ? dato("Revisado por", responsable) : ""}
        ${dato("Fecha", v(COL_MEJORA.fechaRespuesta) || fechaLegible())}
      </table>

      <p style="margin-top:16px"><b>Lo que se hizo</b></p>
      <p style="background:#f8fafc;border-left:3px solid #dc2626;padding:10px 12px;
                white-space:pre-wrap">${esc(v(COL_MEJORA.respuesta))}</p>

      <p style="margin-top:16px;color:#64748b;font-size:13px"><b>Lo que reportaste</b><br>
      ${esc(v(COL_MEJORA.descripcion))}</p>

      <p style="color:#64748b;font-size:13px">Gracias por reportarlo: sin eso no
      nos habríamos enterado.</p>
      <p style="color:#64748b;font-size:13px">ADEMINCOL S.A.S.</p>
    </div>`;
}
