/**
 * Las dos pantallas de material oficial: la presentación y el instructivo.
 * Comparten todo menos el texto, así que son la misma página parametrizada.
 */

import { useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useProgreso, type Paso } from "../lib/progreso";
import { Visor } from "../components/Visor";
import { Tarjeta, Titulo } from "../components/ui";
import indice from "../../public/material/indice.json";

interface Config {
  paso: Paso;
  carpeta: string;
  titulo: string;
  meta: string;
  siguiente: string;
  textoSiguiente: string;
  descarga?: { href: string; texto: string };
}

const DIAPOSITIVAS: Config = {
  paso: "diapositivas",
  carpeta: "diapositivas",
  titulo: "Presentación",
  meta: "Recórrela completa. Las flechas del teclado también sirven.",
  siguiente: "/capacitacion/manual",
  textoSiguiente: "Continuar al instructivo",
};

const MANUAL: Config = {
  paso: "manual",
  carpeta: "manual",
  titulo: "Instructivo IT-OPE-C-12",
  meta: "El documento oficial del proceso, revisión 01 del 09-04-2026.",
  siguiente: "/capacitacion/puntos-clave",
  textoSiguiente: "Continuar a los puntos clave",
};

export function DiapositivasPage() {
  return <Material config={DIAPOSITIVAS} />;
}

export function ManualPage() {
  return <Material config={MANUAL} />;
}

function Material({ config }: { config: Config }) {
  const { registro, marcarVisto } = useProgreso();
  const ir = useNavigate();

  // useCallback: el Visor lo usa dentro de un efecto y una función nueva en
  // cada render lo dispararía sin parar.
  const alTerminar = useCallback(() => marcarVisto(config.paso), [marcarVisto, config.paso]);

  // Sin registro no hay nada que mostrar: la URL es escribible.
  if (!registro) return <Navigate to="/capacitacion" replace />;

  const paginas = (indice as Record<string, number>)[config.carpeta] || 0;

  return (
    <Tarjeta>
      <Titulo meta={config.meta}>{config.titulo}</Titulo>
      <Visor
        carpeta={config.carpeta}
        paginas={paginas}
        alTerminar={alTerminar}
        textoSiguiente={config.textoSiguiente}
        alSiguiente={() => ir(config.siguiente)}
        descarga={config.descarga}
      />
    </Tarjeta>
  );
}
