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

/**
 * Identificador de la constancia, el que lleva el QR.
 *
 * Aleatorio y no consecutivo a propósito: la página de verificación es pública
 * y con ids seguidos cualquiera podría recorrerla sacando nombres y cédulas.
 * 16 hex = 64 bits, imposible de adivinar a tanteo.
 */
function nuevoId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

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
    const previa = await buscarConstanciaPrevia(env, cedula, datos.appId);
    if (previa) {
      return ok(
        { repetida: true },
        `Ya tenías registrada la capacitación de ${datos.appId} el ${previa}. ` +
          "No se duplicó el registro.",
      );
    }

    const idConstancia = nuevoId();
    const ahora = new Date();
    // El F-SIG-19 registra hora de inicio y de fin de la actividad. El fin es
    // ahora; el inicio se deriva de los minutos que el navegador midió, en vez
    // de confiar en un reloj de celular que puede estar desajustado.
    const inicio = new Date(ahora.getTime() - Math.max(0, datos.minutos) * 60_000);
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
      // Columnas agregadas después, al final: la capacitación pasó a ser por
      // aplicación y no una sola general.
      datos.appId,
      datos.appNombre,
      datos.tecnica,
      // Campos que pide el F-SIG-19 para que esta fila sea el registro de
      // asistencia y no un documento paralelo. También al final.
      datos.areaUn.trim(),
      "Virtual", // modalidad
      "Capacitación", // tipo de actividad
      env.EXPOSITOR || "",
      fechaBogota(inicio),
      fechaBogota(ahora),
      idConstancia,
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
      html: cuerpoCorreo(
        datos,
        nombre,
        cedula,
        fechaLegible(ahora),
        enlaceVerificacion(request, idConstancia),
      ),
    });

    return ok(
      { repetida: false, correoEnviado: enviado, id: idConstancia },
      enviado
        ? `Registro guardado. Te enviamos la constancia a ${correo}.`
        : "Registro guardado.",
    );
  } catch (e) {
    return fallaServidor(e);
  }
};

/** URL pública de verificación, armada desde el propio dominio que atendió. */
function enlaceVerificacion(peticion: Request, id: string): string {
  return `${new URL(peticion.url).origin}/verificar/${id}`;
}

function cuerpoCorreo(
  datos: DatosConstancia,
  nombre: string,
  cedula: string,
  fecha: string,
  enlace: string,
): string {
  // El nombre y el cargo los escribe el inspector: sin escapar, un `<` rompe
  // el HTML del correo.
  const esc = (t: string) =>
    String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const fila = (k: string, v: string) =>
    `<tr><td style="border:1px solid #e2e8f0;padding:8px"><b>${k}</b></td>` +
    `<td style="border:1px solid #e2e8f0;padding:8px">${esc(v)}</td></tr>`;

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#1e293b;font-size:14px">
      <p>Hola ${esc(nombre)},</p>
      <p>Queda registrada tu capacitación:</p>
      <table style="border-collapse:collapse">
        ${fila("Aplicación", `${datos.appId} — ${datos.appNombre}`)}
        ${fila("Técnica", datos.tecnica || "—")}
        ${fila("Área / unidad", datos.areaUn)}
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
      <p style="font-size:13px">
        Para verificarla, o para mostrarla desde el celular:<br>
        <a href="${enlace}" style="color:#dc2626">${enlace}</a>
      </p>
      <p style="color:#64748b;font-size:13px">ADEMINCOL S.A.S.</p>
    </div>`;
}
