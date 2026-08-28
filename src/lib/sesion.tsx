/**
 * Quién está usando la plataforma.
 *
 * Se entra con la cédula y los datos salen del listado de personal. A partir de
 * ahí la aplicación ya sabe nombre, correo, cargo y área, así que no hay que
 * volver a pedirlos en ninguna pantalla.
 *
 * Dos aclaraciones honestas sobre qué es y qué no es esto:
 *
 *   - Es IDENTIFICACIÓN, no autenticación. La cédula no es un secreto: está en
 *     los formatos en papel, en RR. HH. y la saben los compañeros. Lo que
 *     sostiene el valor de la constancia sigue siendo la declaración que se
 *     acepta al final, igual que en el formato firmado que reemplaza.
 *   - Quien no esté en el listado entra en modo `manual` y llena los datos a
 *     mano. Un contratista nuevo tiene que poder capacitarse el día que llega.
 *
 * Se guarda en sessionStorage y no en localStorage: dura mientras la pestaña
 * esté abierta. En un equipo compartido en campo, cerrar el navegador tiene que
 * bastar para salir.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Persona } from "../api/cliente";

export interface SesionPersona {
  modo: "persona";
  cedula: string;
  nombre: string;
  correo: string;
  cargo: string;
  area: string;
}

export type Sesion = SesionPersona | { modo: "manual" } | null;

interface Valor {
  sesion: Sesion;
  /** Datos de la persona, o null si entró sin registro. */
  persona: SesionPersona | null;
  entrar: (cedula: string, p: Persona) => void;
  entrarSinRegistro: () => void;
  salir: () => void;
}

const CLAVE = "adc-sesion";
const Contexto = createContext<Valor | undefined>(undefined);

function leerGuardada(): Sesion {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as Sesion) : null;
  } catch {
    return null;
  }
}

function guardar(s: Sesion) {
  try {
    if (s) sessionStorage.setItem(CLAVE, JSON.stringify(s));
    else sessionStorage.removeItem(CLAVE);
  } catch {
    // Si el navegador no deja escribir, la sesión vive solo en memoria.
  }
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion>(leerGuardada);

  const entrar = useCallback((cedula: string, p: Persona) => {
    const nueva: SesionPersona = {
      modo: "persona",
      cedula: cedula.replace(/\D/g, ""),
      nombre: p.nombre || "",
      correo: p.correo || "",
      cargo: p.cargo || "",
      area: p.area || "",
    };
    setSesion(nueva);
    guardar(nueva);
  }, []);

  const entrarSinRegistro = useCallback(() => {
    const nueva: Sesion = { modo: "manual" };
    setSesion(nueva);
    guardar(nueva);
  }, []);

  const salir = useCallback(() => {
    setSesion(null);
    guardar(null);
  }, []);

  const valor = useMemo<Valor>(
    () => ({
      sesion,
      persona: sesion && sesion.modo === "persona" ? sesion : null,
      entrar,
      entrarSinRegistro,
      salir,
    }),
    [sesion, entrar, entrarSinRegistro, salir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): Valor {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useSesion debe usarse dentro de ProveedorSesion");
  return ctx;
}
