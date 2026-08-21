/** POST /api/constancia — registra la constancia de capacitación. */

import type { DatosConstancia } from "../../shared/tipos";
import { validarConstancia, normalizarCedula } from "../../shared/validacion";
import type { Env } from "./_lib/entorno";
import { guardarFirma } from "./_lib/drive";
import { enviarCorreo } from "./_lib/correo";
import {
  agregarFila,
  agregarFilas,
  buscarConstanciaPrevia,
  HOJA_CONSTANCIAS,
  HOJA_RESPUESTAS,
} from "./_lib/sheets";
import { fallaServidor, fechaBogota, fechaLegible, leerJson, malaPeticion, ok } from "./_lib/http";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const datos = await leerJson<DatosConstancia>(request);
  if (!datos) return malaPeticion("No llegó información. Intenta otra vez.");

  const exigeFirma = String(env.EXIGE_FIRMA || "") === "true";
  const problema = validarConstancia(datos, env.DOMINIO_CORPORATIVO || "", exigeFirma);
  if (problema) return malaPeticion(problema);

  const cedula = normalizarCedula(datos.cedula);
  const correo = datos.correo.trim().toLowerCase();
  const nombre = datos.nombre.trim();

  try {
    const previa = await buscarConstanciaPrevia(env, cedula, datos.cursoCodigo);
    if (previa) {
      return ok(
        { repetida: true },
        `Ya tenías esta capacitación registrada el ${previa}. No se duplicó el registro.`,
      );
    }

    const ahora = new Date();
    const linkFirma = await guardarFirma(
      env,
      datos.firma || "",
      `firma_${cedula}_${datos.cursoCodigo}.png`,
    );

    await agregarFila(env, HOJA_CONSTANCIAS, [
      fechaBogota(ahora),
      datos.cursoCodigo,
      datos.cursoNombre,
      datos.cursoVersion,
      nombre,
      cedula,
      correo,
      datos.cargo.trim(),
      datos.puntaje,
      datos.totalPreguntas,
      "SÍ",
      datos.minutos,
      "SÍ", // aceptó la declaración
      "SÍ", // autorizó el tratamiento de datos (Ley 1581)
      linkFirma,
    ]);

    // El detalle pregunta por pregunta es lo que dice QUÉ se entendió mal.
    // Se escribe aparte y en una sola llamada.
    if (datos.respuestas?.length) {
      await agregarFilas(
        env,
        HOJA_RESPUESTAS,
        datos.respuestas.map((r) => [
          fechaBogota(ahora),
          datos.cursoCodigo,
          cedula,
          r.numero,
          r.enunciado,
          r.respondio,
          r.correcta ? "SÍ" : "NO",
        ]),
      );
    }

    const enviado = await enviarCorreo(env, {
      para: correo,
      cc: env.CORREO_CALIDAD || undefined,
      asunto: `Constancia de capacitación — ${datos.cursoNombre}`,
      html: cuerpoCorreo(datos, nombre, cedula, fechaLegible(ahora)),
    });

    return ok(
      { repetida: false, correoEnviado: enviado },
      enviado
        ? `Registro guardado. Te enviamos la constancia a ${correo}.`
        : "Registro guardado.",
    );
  } catch (e) {
    return fallaServidor(e);
  }
};

function cuerpoCorreo(
  datos: DatosConstancia,
  nombre: string,
  cedula: string,
  fecha: string,
): string {
  const fila = (k: string, v: string) =>
    `<tr><td style="border:1px solid #e2e8f0;padding:8px"><b>${k}</b></td>` +
    `<td style="border:1px solid #e2e8f0;padding:8px">${v}</td></tr>`;

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#1e293b;font-size:14px">
      <p>Hola ${nombre},</p>
      <p>Queda registrada tu capacitación:</p>
      <table style="border-collapse:collapse">
        ${fila("Curso", `${datos.cursoNombre} (${datos.cursoCodigo})`)}
        ${fila("Versión del material", datos.cursoVersion)}
        ${fila("Fecha", fecha)}
        ${fila("Cédula", cedula)}
        ${fila("Evaluación", `${datos.puntaje} de ${datos.totalPreguntas} — APROBADA`)}
      </table>
      <p style="color:#64748b;font-size:13px">
        Declaraste haber recibido y entendido la capacitación.
        Conserva este correo como soporte.
      </p>
      <p style="color:#64748b;font-size:13px">ADEMINCOL S.A.S.</p>
    </div>`;
}
