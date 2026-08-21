/**
 * Estado del recorrido: en qué aplicación se está capacitando, qué módulos vio
 * y si aprobó la evaluación.
 *
 * Vive en memoria a propósito. Si se guardara en localStorage, alguien podría
 * marcarse los módulos como vistos sin abrirlos; y de todos modos el curso se
 * hace de una sentada. Lo que sí queda como evidencia es `minutos`, que se
 * escribe en el Sheet.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Curso } from "../contenido/curso";
import type { Aplicacion, RespuestaEvaluacion } from "../../shared/tipos";

interface ProgresoValor {
  /** Curso armado para la app elegida. null mientras no se elige ninguna. */
  curso: Curso | null;
  /** La app elegida, tal cual viene del Listado Maestro. */
  app: Aplicacion | null;
  /**
   * Fija el curso activo. Si es de otra aplicación, reinicia todo el avance:
   * cambiar de app a mitad de camino no puede heredar módulos vistos ni una
   * evaluación aprobada de otra técnica.
   */
  fijarCurso: (curso: Curso, app: Aplicacion) => void;

  vistos: Set<string>;
  marcarVisto: (id: string) => void;
  todosVistos: boolean;
  porcentaje: number;

  aprobada: boolean;
  puntaje: number;
  respuestas: RespuestaEvaluacion[];
  registrarEvaluacion: (puntaje: number, respuestas: RespuestaEvaluacion[]) => void;

  /** Minutos desde que se eligió la aplicación. Va al Sheet. */
  minutos: () => number;
}

const Contexto = createContext<ProgresoValor | undefined>(undefined);

export function ProveedorProgreso({ children }: { children: ReactNode }) {
  const [curso, setCurso] = useState<Curso | null>(null);
  const [app, setApp] = useState<Aplicacion | null>(null);
  const [vistos, setVistos] = useState<Set<string>>(new Set());
  const [aprobada, setAprobada] = useState(false);
  const [puntaje, setPuntaje] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaEvaluacion[]>([]);
  const inicio = useRef(Date.now());

  // El código del curso incluye el id de la app, así que sirve para saber si
  // hubo cambio real. Se guarda en un ref y no en el estado para poder salir
  // temprano sin disparar un render.
  const codigoActual = useRef<string | null>(null);

  const fijarCurso = useCallback((nuevo: Curso, nuevaApp: Aplicacion) => {
    if (codigoActual.current === nuevo.codigo) return;
    codigoActual.current = nuevo.codigo;
    setCurso(nuevo);
    setApp(nuevaApp);
    setVistos(new Set());
    setAprobada(false);
    setPuntaje(0);
    setRespuestas([]);
    inicio.current = Date.now();
  }, []);

  const marcarVisto = useCallback((id: string) => {
    setVistos((previos) => {
      if (previos.has(id)) return previos;
      const nuevos = new Set(previos);
      nuevos.add(id);
      return nuevos;
    });
  }, []);

  const registrarEvaluacion = useCallback(
    (nuevoPuntaje: number, nuevasRespuestas: RespuestaEvaluacion[]) => {
      setPuntaje(nuevoPuntaje);
      setRespuestas(nuevasRespuestas);
      setAprobada(!!curso && nuevoPuntaje >= curso.minimoAprobado);
    },
    [curso],
  );

  const valor = useMemo<ProgresoValor>(() => {
    const total = curso?.modulos.length ?? 0;
    const cuantos = curso ? curso.modulos.filter((m) => vistos.has(m.id)).length : 0;
    return {
      curso,
      app,
      fijarCurso,
      vistos,
      marcarVisto,
      todosVistos: total > 0 && cuantos === total,
      porcentaje: total ? Math.round((cuantos / total) * 100) : 0,
      aprobada,
      puntaje,
      respuestas,
      registrarEvaluacion,
      minutos: () => Math.max(0, Math.round((Date.now() - inicio.current) / 60000)),
    };
  }, [curso, app, fijarCurso, vistos, marcarVisto, aprobada, puntaje, respuestas, registrarEvaluacion]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useProgreso(): ProgresoValor {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useProgreso debe usarse dentro de ProveedorProgreso");
  return ctx;
}
