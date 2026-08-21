import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CURSO } from "../contenido/curso";
import { useProgreso } from "../lib/progreso";
import { Aviso, Boton, Tarjeta, Titulo } from "../components/ui";
import type { RespuestaEvaluacion } from "../../shared/tipos";

export function EvaluacionPage() {
  const progreso = useProgreso();
  const ir = useNavigate();

  const [elegidas, setElegidas] = useState<Record<number, number>>({});
  const [falladas, setFalladas] = useState<Set<number>>(new Set());
  const [aviso, setAviso] = useState<{ tono: "ok" | "mal"; texto: string } | null>(null);
  const [calificada, setCalificada] = useState(false);

  // Nadie debería llegar aquí sin ver los módulos, pero la URL es escribible.
  if (!progreso.todosVistos) return <Navigate to="/" replace />;

  function calificar() {
    const sinResponder = CURSO.preguntas
      .map((_, i) => i)
      .filter((i) => elegidas[i] === undefined)
      .map((i) => i + 1);

    if (sinResponder.length) {
      setAviso({ tono: "mal", texto: `Faltan las preguntas: ${sinResponder.join(", ")}.` });
      return;
    }

    const respuestas: RespuestaEvaluacion[] = [];
    const nuevasFalladas = new Set<number>();
    let puntaje = 0;

    CURSO.preguntas.forEach((p, i) => {
      const indice = elegidas[i];
      const acerto = indice === p.correcta;
      if (acerto) puntaje++;
      else nuevasFalladas.add(i);
      respuestas.push({
        numero: i + 1,
        enunciado: p.enunciado,
        respondio: p.opciones[indice],
        correcta: acerto,
      });
    });

    setFalladas(nuevasFalladas);
    progreso.registrarEvaluacion(puntaje, respuestas);

    if (puntaje >= CURSO.minimoAprobado) {
      setCalificada(true);
      setAviso({
        tono: "ok",
        texto: `Aprobaste con ${puntaje} de ${CURSO.preguntas.length}. Ya puedes registrar tu constancia.`,
      });
      setTimeout(() => ir("/constancia"), 1200);
    } else {
      setAviso({
        tono: "mal",
        texto:
          `Obtuviste ${puntaje} de ${CURSO.preguntas.length} y necesitas ${CURSO.minimoAprobado}. ` +
          "Revisa las preguntas marcadas, vuelve al módulo correspondiente e inténtalo de nuevo.",
      });
    }
  }

  function reintentar() {
    setElegidas({});
    setFalladas(new Set());
    setAviso(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const reprobada = aviso?.tono === "mal" && falladas.size > 0;

  return (
    <Tarjeta>
      <Titulo
        meta={`${CURSO.preguntas.length} preguntas · se aprueba con ${CURSO.minimoAprobado} correctas · se puede repetir`}
      >
        Evaluación
      </Titulo>

      <div className="divide-y divide-ink-200 dark:divide-ink-700">
        {CURSO.preguntas.map((p, i) => (
          <div
            key={i}
            className={
              "py-4 " +
              (falladas.has(i) ? "-mx-2 rounded-lg bg-brand-50 px-2 dark:bg-brand-950/40" : "")
            }
          >
            <p className="mb-2 font-semibold text-ink-800 dark:text-ink-100">
              {i + 1}. {p.enunciado}
            </p>
            {p.opciones.map((opcion, j) => (
              <label
                key={j}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 text-sm
                           text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-700"
              >
                <input
                  type="radio"
                  name={`p${i}`}
                  checked={elegidas[i] === j}
                  disabled={calificada}
                  onChange={() => setElegidas((prev) => ({ ...prev, [i]: j }))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                />
                <span>{opcion}</span>
              </label>
            ))}
          </div>
        ))}
      </div>

      {aviso && <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>}

      <div className="mt-4 flex flex-wrap gap-3">
        <Boton onClick={calificar} deshabilitado={calificada}>
          Calificar
        </Boton>
        {reprobada && (
          <Boton variante="secundaria" onClick={reintentar}>
            Volver a intentar
          </Boton>
        )}
      </div>
    </Tarjeta>
  );
}
