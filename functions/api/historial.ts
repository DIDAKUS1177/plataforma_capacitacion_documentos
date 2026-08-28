/**
 * GET /api/historial?cedula=... — las capacitaciones de una persona.
 *
 * Se entra solo con la cédula, por decisión del usuario. Como la cédula no es
 * un secreto —está en los formatos en papel, en RR. HH. y la saben los
 * compañeros—, esta respuesta trae ÚNICAMENTE formación:
 *
 *   curso, formato, fecha, resultado y el código de la constancia.
 *
 * Nada de correo, cargo, área ni teléfono. Si alguien consulta una cédula
 * ajena, ve qué cursos hizo esa persona, no cómo contactarla.
 *
 * Si algún día se quiere identidad de verdad, el cambio es pedir un código al
 * correo antes de llamar aquí: este endpoint no habría que tocarlo.
 */

import type { Env } from "./_lib/entorno";
import { leerValores, HOJA_CONSTANCIAS } from "./_lib/sheets";
import { fallaServidor, malaPeticion, ok } from "./_lib/http";
import { titulo } from "./_lib/texto";

const HOJA_INICIOS = "inicios";
const HOJA_PERSONAL = "personal";

/** Columnas de `constancias`. Ver scripts/init_sheet.py. */
const C = {
  fecha: 0,
  cursoNombre: 2,
  cursoVersion: 3,
  nombre: 4,
  cedula: 5,
  puntaje: 8,
  total: 9,
  appId: 15,
  appNombre: 16,
  id: 24,
};

/** Columnas de `inicios`. */
const I = { fecha: 0, nombre: 1, cedula: 2, appId: 6, appNombre: 7 };

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const cedula = (new URL(request.url).searchParams.get("cedula") || "").replace(/\D/g, "");
  if (cedula.length < 6) return malaPeticion("Escribe la cédula completa.");

  try {
    const [constancias, inicios, personal] = await Promise.all([
      leerValores(env, `${HOJA_CONSTANCIAS}!A2:Y`),
      leerValores(env, `${HOJA_INICIOS}!A2:L`),
      leerValores(env, `${HOJA_PERSONAL}!A2:B`),
    ]);

    const mismaCedula = (v: string) => (v || "").replace(/\D/g, "") === cedula;

    const hechas = constancias
      .filter((f) => mismaCedula(f[C.cedula]))
      .map((f) => ({
        fecha: (f[C.fecha] || "").slice(0, 10),
        curso: f[C.cursoNombre] || "",
        version: f[C.cursoVersion] || "",
        formato: [f[C.appId], f[C.appNombre]].filter(Boolean).join(" — "),
        resultado: `${f[C.puntaje] || "0"} de ${f[C.total] || "0"}`,
        id: f[C.id] || "",
      }));

    // Empezadas y sin terminar: las que tienen registro de inicio pero ninguna
    // constancia del mismo formato. Es lo que el supervisor necesita ver.
    const formatosHechos = new Set(
      constancias.filter((f) => mismaCedula(f[C.cedula])).map((f) => f[C.appId] || ""),
    );
    const aMedias = inicios
      .filter((f) => mismaCedula(f[I.cedula]) && !formatosHechos.has(f[I.appId] || ""))
      .map((f) => ({
        fecha: (f[I.fecha] || "").slice(0, 10),
        formato: [f[I.appId], f[I.appNombre]].filter(Boolean).join(" — "),
      }));

    // El nombre sale del listado de personal, o de la constancia más reciente.
    const enRoster = personal.find((f) => mismaCedula(f[0]));
    const nombre =
      (hechas.length && constancias.filter((f) => mismaCedula(f[C.cedula])).slice(-1)[0][C.nombre]) ||
      (enRoster ? enRoster[1] : "") ||
      (aMedias.length ? inicios.filter((f) => mismaCedula(f[I.cedula])).slice(-1)[0][I.nombre] : "");

    return ok({
      encontrada: hechas.length > 0 || aMedias.length > 0 || !!enRoster,
      enRoster: !!enRoster,
      nombre: titulo(nombre || ""),
      hechas,
      aMedias,
    });
  } catch (e) {
    return fallaServidor(e);
  }
};
