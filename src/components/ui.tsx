/** Piezas de interfaz compartidas. Mismo lenguaje visual que ADEMINCOL Central. */

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-xl border border-ink-200 bg-white p-5 shadow-sm sm:p-7 " +
        "dark:border-ink-700 dark:bg-ink-800 " +
        className
      }
    >
      {children}
    </div>
  );
}

export function Titulo({ children, meta }: { children: ReactNode; meta?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-50">{children}</h2>
      {meta && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{meta}</p>}
    </div>
  );
}

interface BotonProps {
  children: ReactNode;
  onClick?: () => void;
  variante?: "principal" | "secundaria";
  cargando?: boolean;
  deshabilitado?: boolean;
  tipo?: "button" | "submit";
}

export function Boton({
  children,
  onClick,
  variante = "principal",
  cargando = false,
  deshabilitado = false,
  tipo = "button",
}: BotonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm " +
    "font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const estilo =
    variante === "principal"
      ? "bg-brand-600 text-white hover:bg-brand-700"
      : "border border-ink-300 bg-white text-ink-700 hover:bg-ink-100 " +
        "dark:border-ink-600 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700";

  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={deshabilitado || cargando}
      className={`${base} ${estilo}`}
    >
      {cargando && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

const CLASES_CONTROL =
  "mt-1.5 w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm " +
  "text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 " +
  "dark:border-ink-600 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-brand-800";

interface CampoProps {
  etiqueta: string;
  ayuda?: string;
  children: ReactNode;
}

function Etiqueta({ etiqueta, ayuda, children }: CampoProps) {
  return (
    <label className="mb-4 block">
      <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-ink-500 dark:text-ink-400">{ayuda}</span>}
    </label>
  );
}

export function CampoTexto({
  etiqueta,
  ayuda,
  valor,
  alCambiar,
  tipo = "text",
  marcador,
  modoTeclado,
}: {
  etiqueta: string;
  ayuda?: string;
  valor: string;
  alCambiar: (v: string) => void;
  tipo?: "text" | "email";
  marcador?: string;
  modoTeclado?: "numeric";
}) {
  return (
    <Etiqueta etiqueta={etiqueta} ayuda={ayuda}>
      <input
        type={tipo}
        value={valor}
        placeholder={marcador}
        inputMode={modoTeclado}
        onChange={(e) => alCambiar(e.target.value)}
        className={CLASES_CONTROL}
      />
    </Etiqueta>
  );
}

export function CampoSelect({
  etiqueta,
  ayuda,
  valor,
  alCambiar,
  opciones,
  vacio,
}: {
  etiqueta: string;
  ayuda?: string;
  valor: string;
  alCambiar: (v: string) => void;
  opciones: string[];
  vacio?: string;
}) {
  return (
    <Etiqueta etiqueta={etiqueta} ayuda={ayuda}>
      <select
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        className={CLASES_CONTROL}
      >
        {vacio !== undefined && <option value="">{vacio}</option>}
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Etiqueta>
  );
}

export function CampoArea({
  etiqueta,
  ayuda,
  valor,
  alCambiar,
  marcador,
}: {
  etiqueta: string;
  ayuda?: string;
  valor: string;
  alCambiar: (v: string) => void;
  marcador?: string;
}) {
  return (
    <Etiqueta etiqueta={etiqueta} ayuda={ayuda}>
      <textarea
        value={valor}
        placeholder={marcador}
        rows={5}
        onChange={(e) => alCambiar(e.target.value)}
        className={CLASES_CONTROL + " resize-y"}
      />
    </Etiqueta>
  );
}

export function Casilla({
  marcada,
  alCambiar,
  children,
}: {
  marcada: boolean;
  alCambiar: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label
      className="mb-3 flex cursor-pointer items-start gap-3 rounded-lg bg-ink-100 p-3 text-sm
                 text-ink-700 dark:bg-ink-900 dark:text-ink-200"
    >
      <input
        type="checkbox"
        checked={marcada}
        onChange={(e) => alCambiar(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
      />
      <span>{children}</span>
    </label>
  );
}

export function Aviso({ tono, children }: { tono: "ok" | "mal"; children: ReactNode }) {
  const estilo =
    tono === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      : "border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200";
  const Icono = tono === "ok" ? CheckCircle2 : AlertCircle;

  return (
    <div className={`my-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${estilo}`}>
      <Icono size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
