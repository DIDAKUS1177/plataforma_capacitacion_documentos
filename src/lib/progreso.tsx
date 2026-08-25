/**
 * Estado del recorrido: quién es, qué pasos ya hizo y si aprobó.
 *
 * Vive en memoria a propósito. Si se guardara en localStorage, alguien podría
 * marcarse los pasos como vistos sin abrirlos; y de todos modos el curso se
 * hace de una sentada. Lo que sí queda como evidencia es el registro inicial,
 * que se escribe en el Sheet apenas se identifica.
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
import { CURSO } from "../contenido/curso";
import type { DatosRegistro, RespuestaEvaluacion } from "../../shared/tipos";

/** Los pasos de material que hay que recorrer antes de la evaluación. */
export const PASOS = ["diapositivas", "manual", "puntos-clave"] as const;
export type Paso = (typeof PASOS)[number];

interface ProgresoValor {
  /** Null hasta que se identifica. Sin esto no se abre nada más. */
  registro: DatosRegistro | null;
  fijarRegistro: (r: DatosRegistro) => void;

  vistos: Set<Paso>;
  marcarVisto: (paso: Paso) => void;
  todoVisto: boolean;
  /** 0-100. Cuenta el registro como un paso más. */
  porcentaje: number;

  aprobada: boolean;
  puntaje: number;
  respuestas: RespuestaEvaluacion[];
  registrarEvaluacion: (puntaje: number, respuestas: RespuestaEvaluacion[]) => void;

  /** Minutos desde que se registró. Va al Sheet como hora de inicio. */
  minutos: () => number;
}

const Contexto = createContext<ProgresoValor | undefined>(undefined);

export function ProveedorProgreso({ children }: { children: ReactNode }) {
  const [registro, setRegistro] = useState<DatosRegistro | null>(null);
  const [vistos, setVistos] = useState<Set<Paso>>(new Set());
  const [aprobada, setAprobada] = useState(false);
  const [puntaje, setPuntaje] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaEvaluacion[]>([]);
  const inicio = useRef(Date.now());

  const fijarRegistro = useCallback((r: DatosRegistro) => {
    setRegistro(r);
    // El cronómetro arranca al identificarse, no al abrir la página: el tiempo
    // que interesa es el que estuvo en la capacitación.
    inicio.current = Date.now();
  }, []);

  const marcarVisto = useCallback((paso: Paso) => {
    setVistos((previos) => {
      if (previos.has(paso)) return previos; // evita re-render en cada visita
      const nuevos = new Set(previos);
      nuevos.add(paso);
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
    const hechos = (registro ? 1 : 0) + vistos.size;
    const total = 1 + PASOS.length;
    return {
      registro,
      fijarRegistro,
      vistos,
      marcarVisto,
      todoVisto: PASOS.every((p) => vistos.has(p)),
      porcentaje: Math.round((hechos / total) * 100),
      aprobada,
      puntaje,
      respuestas,
      registrarEvaluacion,
      minutos: () => Math.max(0, Math.round((Date.now() - inicio.current) / 60000)),
    };
  }, [registro, fijarRegistro, vistos, marcarVisto, aprobada, puntaje, respuestas, registrarEvaluacion]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useProgreso(): ProgresoValor {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useProgreso debe usarse dentro de ProveedorProgreso");
  return ctx;
}
