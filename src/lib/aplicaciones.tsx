/**
 * Catálogo de aplicaciones, leído una sola vez del Listado Maestro de Calidad.
 *
 * Lo comparten el selector de capacitación y el buzón de mejoras: si cada uno
 * lo pidiera por su lado serían dos lecturas del Sheet por visita, contra una
 * cuota de 60 por minuto que además comparte con los reportes.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { obtenerAplicaciones } from "../api/cliente";
import type { Aplicacion } from "../../shared/tipos";

interface Valor {
  apps: Aplicacion[];
  cargando: boolean;
  error: string;
  /** Busca por id (APP-022). null si todavía no cargó o no existe. */
  porId: (id: string) => Aplicacion | null;
}

const Contexto = createContext<Valor | undefined>(undefined);

export function ProveedorAplicaciones({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<Aplicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerAplicaciones()
      .then(setApps)
      .catch(() => setError("No se pudo cargar la lista de aplicaciones. Recarga la página."))
      .finally(() => setCargando(false));
  }, []);

  const valor = useMemo<Valor>(
    () => ({
      apps,
      cargando,
      error,
      porId: (id) => apps.find((a) => a.id === id) || null,
    }),
    [apps, cargando, error],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAplicaciones(): Valor {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useAplicaciones debe usarse dentro de ProveedorAplicaciones");
  return ctx;
}
