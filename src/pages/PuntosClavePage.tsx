/**
 * Repaso de lo que se evalúa, después del material oficial.
 *
 * Va todo en una sola página en vez de siete pestañas: es un repaso, se lee de
 * corrido, y en celular siete pestañas más eran ruido.
 */

import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CURSO } from "../contenido/curso";
import { useProgreso } from "../lib/progreso";
import { Boton, Tarjeta, Titulo } from "../components/ui";

export function PuntosClavePage() {
  const { registro, marcarVisto, todoVisto, vistos } = useProgreso();
  const ir = useNavigate();

  useEffect(() => {
    marcarVisto("puntos-clave");
  }, [marcarVisto]);

  if (!registro) return <Navigate to="/capacitacion" replace />;

  // Si alguien salta directo por URL sin haber visto el material, se le manda a
  // donde le falta en vez de dejarlo seguir.
  if (!vistos.has("diapositivas")) return <Navigate to="/capacitacion/diapositivas" replace />;
  if (!vistos.has("manual")) return <Navigate to="/capacitacion/manual" replace />;

  return (
    <>
      <Tarjeta className="mb-4">
        <Titulo meta={`${CURSO.preguntas.length} preguntas, se aprueba con ${CURSO.minimoAprobado}. Esto es lo que entra.`}>
          Puntos clave
        </Titulo>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Un repaso de lo que acabas de ver, en corto. Cada bloque dice de qué numeral
          del instructivo sale.
        </p>
      </Tarjeta>

      {CURSO.modulos.map((m, i) => (
        <Tarjeta key={m.id} className="mb-4">
          <h3 className="mb-3 flex items-start gap-2.5 text-lg font-semibold text-ink-900 dark:text-ink-50">
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full
                         bg-brand-600 text-xs font-bold text-white"
            >
              {i + 1}
            </span>
            {m.titulo}
          </h3>
          <div
            className="prosa text-ink-700 dark:text-ink-200"
            dangerouslySetInnerHTML={{ __html: m.html }}
          />
        </Tarjeta>
      ))}

      <Tarjeta>
        <Boton onClick={() => ir("/capacitacion/evaluacion")} deshabilitado={!todoVisto}>
          Presentar la evaluación
        </Boton>
      </Tarjeta>
    </>
  );
}
