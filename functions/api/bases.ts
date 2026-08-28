/**
 * POST /api/bases — todo lo que guarda la plataforma, en una sola respuesta.
 *
 * Es la pestaña Bases, y la ve solo quien esté en `CEDULAS_ADMIN`.
 *
 * Tres candados, y ninguno confía en el navegador:
 *
 *   1. El correo y la cédula del cuerpo tienen que casar en la MISMA fila de
 *      `personal`. Es la misma verificación de /api/entrar, repetida aquí: la
 *      sesión del navegador se puede fabricar desde la consola.
 *   2. Esa cédula tiene que estar en `CEDULAS_ADMIN`, que vive en el servidor.
 *   3. Si `CLAVE_ADMIN` está configurada, además hay que mandarla.
 *
 * Cuando algo falla responde 404, no 403: un 403 confirmaría que la pestaña
 * existe y que esa cédula es de un administrador.
 *
 * Solo LEE. No hay ningún camino desde aquí para escribir o borrar, y tampoco
 * se devuelve el enlace del Sheet: esta pantalla no puede ser la puerta de
 * entrada para editar las bases.
 */

import type { Env } from "./_lib/entorno";
import { leerValores, HOJA_CONSTANCIAS, HOJA_INICIOS, HOJA_MEJORAS, COL_MEJORA } from "./_lib/sheets";
import { claveAdminValida, esCedulaAdmin } from "./_lib/admin";
import { fallaServidor, json, leerJson, ok } from "./_lib/http";
import { titulo } from "./_lib/texto";

const HOJA_PERSONAL = "personal";
const HOJA_RESPUESTAS = "respuestas_evaluacion";

/** Columnas de `personal`. Ver scripts/importar_personal.py. */
const P = { cedula: 0, nombre: 1, correo: 2, cargo: 3, categoria: 4, area: 5, lugar: 7 };

/** Columnas de `constancias`. Ver scripts/init_sheet.py. */
const C = {
  fecha: 0,
  cursoVersion: 3,
  nombre: 4,
  cedula: 5,
  correo: 6,
  cargo: 7,
  puntaje: 8,
  total: 9,
  aprobado: 10,
  minutos: 11,
  appId: 15,
  appNombre: 16,
  areaUn: 18,
  id: 24,
};

/** Columnas de `inicios`. */
const I = { fecha: 0, nombre: 1, cedula: 2, correo: 3, cargo: 4, appId: 6, appNombre: 7 };

const dig = (v: string) => (v || "").replace(/\D/g, "");
const txt = (v: string) => (v || "").trim();

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const cuerpo = await leerJson<{ correo?: string; cedula?: string; clave?: string }>(request);
  // Mismo 404 para todos los fallos: no confirma nada.
  const noExiste = () => json({ ok: false, mensaje: "No encontrado." }, 404);

  if (!cuerpo) return noExiste();
  const correo = txt(cuerpo.correo || "").toLowerCase();
  const cedula = dig(cuerpo.cedula || "");
  if (!correo || !cedula) return noExiste();

  if (!esCedulaAdmin(env, cedula)) return noExiste();
  if (!claveAdminValida(env, cuerpo.clave)) return noExiste();

  try {
    const personal = await leerValores(env, `${HOJA_PERSONAL}!A2:H`);

    // Candado 1: el correo y la cédula, juntos, en la misma fila.
    const yo = personal.find(
      (f) => txt(f[P.correo]).toLowerCase() === correo && dig(f[P.cedula]) === cedula,
    );
    if (!yo) return noExiste();

    const [constancias, inicios, mejoras, respuestas] = await Promise.all([
      leerValores(env, `${HOJA_CONSTANCIAS}!A2:Y`),
      leerValores(env, `${HOJA_INICIOS}!A2:L`),
      leerValores(env, `${HOJA_MEJORAS}!A2:O`),
      leerValores(env, `${HOJA_RESPUESTAS}!A2:C`),
    ]);

    const vivas = personal.filter((f) => dig(f[P.cedula]));
    const conConstancia = new Set(constancias.map((f) => dig(f[C.cedula])).filter(Boolean));
    const conInicio = new Set(inicios.map((f) => dig(f[I.cedula])).filter(Boolean));

    // --- cobertura, calculada aquí y no leída de la hoja `cobertura`: esa son
    //     fórmulas y devolvería el texto de la fórmula, no el número.
    const capacitadas = vivas.filter((f) => conConstancia.has(dig(f[P.cedula]))).length;
    const operaciones = vivas.filter((f) => txt(f[P.area]).toUpperCase() === "OPERACIONES");
    const opsCapacitadas = operaciones.filter((f) =>
      conConstancia.has(dig(f[P.cedula])),
    ).length;

    const areas = new Map<string, { personas: number; capacitadas: number }>();
    for (const f of vivas) {
      const area = titulo(txt(f[P.area])) || "Sin área";
      const acc = areas.get(area) || { personas: 0, capacitadas: 0 };
      acc.personas++;
      if (conConstancia.has(dig(f[P.cedula]))) acc.capacitadas++;
      areas.set(area, acc);
    }

    const pendientes = vivas
      .filter((f) => !conConstancia.has(dig(f[P.cedula])))
      .map((f) => ({
        nombre: titulo(txt(f[P.nombre])),
        cedula: dig(f[P.cedula]),
        correo: txt(f[P.correo]).toLowerCase(),
        cargo: titulo(txt(f[P.cargo])),
        area: titulo(txt(f[P.area])),
        lugar: titulo(txt(f[P.lugar])),
        empezo: conInicio.has(dig(f[P.cedula])),
      }))
      .sort((a, b) => a.area.localeCompare(b.area) || a.nombre.localeCompare(b.nombre));

    return ok({
      generado: new Date().toISOString(),
      resumen: {
        personas: vivas.length,
        capacitadas,
        faltan: vivas.length - capacitadas,
        constancias: constancias.length,
        empezadasSinTerminar: vivas.filter(
          (f) => conInicio.has(dig(f[P.cedula])) && !conConstancia.has(dig(f[P.cedula])),
        ).length,
        respuestasEvaluacion: respuestas.length,
        opsPersonas: operaciones.length,
        opsCapacitadas,
      },
      areas: [...areas.entries()]
        .map(([area, v]) => ({ area, ...v }))
        .sort((a, b) => b.personas - a.personas),
      constancias: constancias
        .map((f) => ({
          fecha: txt(f[C.fecha]),
          nombre: titulo(txt(f[C.nombre])),
          cedula: dig(f[C.cedula]),
          correo: txt(f[C.correo]).toLowerCase(),
          cargo: titulo(txt(f[C.cargo])),
          areaUn: txt(f[C.areaUn]),
          formato: [txt(f[C.appId]), txt(f[C.appNombre])].filter(Boolean).join(" — "),
          resultado: `${txt(f[C.puntaje]) || "0"} de ${txt(f[C.total]) || "0"}`,
          aprobado: txt(f[C.aprobado]).toLowerCase() !== "no",
          minutos: txt(f[C.minutos]),
          version: txt(f[C.cursoVersion]),
          id: txt(f[C.id]),
        }))
        .reverse(),
      inicios: inicios
        .map((f) => ({
          fecha: txt(f[I.fecha]),
          nombre: titulo(txt(f[I.nombre])),
          cedula: dig(f[I.cedula]),
          correo: txt(f[I.correo]).toLowerCase(),
          formato: [txt(f[I.appId]), txt(f[I.appNombre])].filter(Boolean).join(" — "),
          termino: constancias.some(
            (c) => dig(c[C.cedula]) === dig(f[I.cedula]) && txt(c[C.appId]) === txt(f[I.appId]),
          ),
        }))
        .reverse(),
      mejoras: mejoras
        .map((f) => ({
          id: txt(f[COL_MEJORA.id]),
          fecha: txt(f[COL_MEJORA.fecha]),
          aplicacion: txt(f[COL_MEJORA.aplicacion]),
          tipo: txt(f[COL_MEJORA.tipo]),
          criticidad: txt(f[COL_MEJORA.criticidad]),
          descripcion: txt(f[COL_MEJORA.descripcion]),
          nombre: txt(f[COL_MEJORA.nombre]),
          correo: txt(f[COL_MEJORA.correo]).toLowerCase(),
          whatsapp: txt(f[COL_MEJORA.whatsapp]),
          estado: txt(f[COL_MEJORA.estado]) || "recibida",
          responsable: txt(f[COL_MEJORA.responsable]),
          respuesta: txt(f[COL_MEJORA.respuesta]),
          fechaRespuesta: txt(f[COL_MEJORA.fechaRespuesta]),
          notificadoEn: txt(f[COL_MEJORA.notificadoEn]),
        }))
        .reverse(),
      pendientes,
      personal: vivas.map((f) => ({
        cedula: dig(f[P.cedula]),
        nombre: titulo(txt(f[P.nombre])),
        correo: txt(f[P.correo]).toLowerCase(),
        cargo: titulo(txt(f[P.cargo])),
        categoria: titulo(txt(f[P.categoria])),
        area: titulo(txt(f[P.area])),
        lugar: titulo(txt(f[P.lugar])),
        capacitada: conConstancia.has(dig(f[P.cedula])),
      })),
    });
  } catch (e) {
    return fallaServidor(e);
  }
};
