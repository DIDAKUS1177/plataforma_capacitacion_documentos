/**
 * Estado del recorrido: qué módulos vio el inspector y si aprobó la evaluación.
 *
 * Vive en memoria a propósito. Si se guardara en localStorage, alguien podría
 * marcarse los módulos como vistos sin abrirlos; y de todos modos el curso se
 * hace de una sentada. Lo que sí queda como evidencia es `minutos`, que se
 * escribe en el Sheet.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CURSO } from "../contenido/curso";
import type { RespuestaEvaluacion } from "../../shared/tipos";

interface ProgresoValor {
  vistos: Set<string>;
  marcarVisto: (id: string) => void;
  todosVistos: boolean;
  porcentaje: number;

  aprobada: boolean;
  puntaje: number;
  respuestas: RespuestaEvaluacion[];
  registrarEvaluacion: (puntaje: number, respuestas: RespuestaEvaluacion[]) => void;

  /** Minutos desde que se abrió la página. Va al Sheet. */
  minutos: () => number;
}

const Contexto = createContext<ProgresoValor | undefined>(undefined);

export function ProveedorProgreso({ children }: { children: ReactNode }) {
  const [vistos, setVistos] = useState<Set<string>>(new Set());
  const [aprobada, setAprobada] = useState(false);
  const [puntaje, setPuntaje] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaEvaluacion[]>([]);
  const [inicio] = useState(() => Date.now());

  const marcarVisto = useCallback((id: string) => {
    setVistos((previos) => {
      if (previos.has(id)) return previos; // evita re-render en cada visita
      const nuevos = new Set(previos);
      nuevos.add(id);
      return nuevos;
    });
  }, []);

  const registrarEvaluacion = useCallback(
    (nuevoPuntaje: number, nuevasRespuestas: RespuestaEvaluacion[]) => {
      setPuntaje(nuevoPuntaje);
      setRespuestas(nuevasRespuestas);
      setAprobada(nuevoPuntaje >= CURSO.minimoAprobado);
    },
    [],
  );

  const valor = useMemo<ProgresoValor>(() => {
    const total = CURSO.modulos.length;
    const cuantos = CURSO.modulos.filter((m) => vistos.has(m.id)).length;
    return {
      vistos,
      marcarVisto,
      todosVistos: cuantos === total,
      porcentaje: total ? Math.round((cuantos / total) * 100) : 0,
      aprobada,
      puntaje,
      respuestas,
      registrarEvaluacion,
      minutos: () => Math.max(0, Math.round((Date.now() - inicio) / 60000)),
    };
  }, [vistos, marcarVisto, aprobada, puntaje, respuestas, registrarEvaluacion, inicio]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useProgreso(): ProgresoValor {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useProgreso debe usarse dentro de ProveedorProgreso");
  return ctx;
}
