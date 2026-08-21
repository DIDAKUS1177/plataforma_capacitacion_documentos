/** Cabecera, pestañas y barra de progreso. Envuelve todas las páginas. */

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Lightbulb, Lock, Moon, Sun } from "lucide-react";
import { CURSO } from "../contenido/curso";
import { useProgreso } from "../lib/progreso";

interface Pestana {
  a: string;
  texto: string;
  bloqueada?: boolean;
  icono?: typeof Lightbulb;
}

export function Layout() {
  const progreso = useProgreso();
  const { pathname } = useLocation();
  const [oscuro, setOscuro] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", oscuro);
  }, [oscuro]);

  // Al cambiar de página se sube el scroll: en celular, si no, se entra al
  // módulo siguiente a media altura.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const pestanas: Pestana[] = [
    { a: "/", texto: "Inicio" },
    ...CURSO.modulos.map((m, i) => ({ a: `/modulo/${i + 1}`, texto: `${i + 1}. ${m.titulo}` })),
    { a: "/evaluacion", texto: "Evaluación", bloqueada: !progreso.todosVistos },
    { a: "/constancia", texto: "Constancia", bloqueada: !progreso.aprobada },
    { a: "/reportar", texto: "Reportar", icono: Lightbulb },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 bg-brand-700 text-white">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold leading-tight">{CURSO.nombre}</h1>
              <p className="text-xs text-brand-100">
                {CURSO.codigo} · versión {CURSO.version}
              </p>
            </div>
            <button
              onClick={() => setOscuro((v) => !v)}
              aria-label="Cambiar tema"
              className="rounded-lg p-2 text-brand-100 transition hover:bg-brand-800"
            >
              {oscuro ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-brand-800">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${progreso.porcentaje}%` }}
            />
          </div>
        </div>
      </header>

      <nav
        className="sticky top-[76px] z-10 border-b border-ink-200 bg-white
                   dark:border-ink-700 dark:bg-ink-800"
      >
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 [scrollbar-width:none]">
          {pestanas.map((p) => (
            <Enlace key={p.a} pestana={p} vistos={progreso.vistos} />
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-7">
        <Outlet />
      </main>

      <footer className="px-4 py-6 text-center text-xs text-ink-400 dark:text-ink-500">
        ADEMINCOL S.A.S. · {CURSO.codigo} v{CURSO.version}
      </footer>
    </div>
  );
}

function Enlace({ pestana, vistos }: { pestana: Pestana; vistos: Set<string> }) {
  const Icono = pestana.icono;
  const indice = pestana.a.startsWith("/modulo/") ? Number(pestana.a.split("/")[2]) - 1 : -1;
  const visto = indice >= 0 && vistos.has(CURSO.modulos[indice]?.id);

  if (pestana.bloqueada) {
    return (
      <span
        title="Se habilita más adelante"
        className="flex shrink-0 cursor-not-allowed items-center gap-1.5 whitespace-nowrap border-b-2
                   border-transparent px-3 py-3 text-sm text-ink-400 dark:text-ink-500"
      >
        <Lock size={13} />
        {pestana.texto}
      </span>
    );
  }

  return (
    <NavLink
      to={pestana.a}
      end={pestana.a === "/"}
      className={({ isActive }) =>
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition " +
        (isActive
          ? "border-brand-600 font-semibold text-brand-700 dark:text-brand-400"
          : "border-transparent text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100")
      }
    >
      {Icono && <Icono size={14} />}
      {pestana.texto}
      {visto && <span className="text-emerald-600 dark:text-emerald-400">✓</span>}
    </NavLink>
  );
}
