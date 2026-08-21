/**
 * Dos niveles de navegación:
 *
 *   1. Las dos pestañas de siempre: Capacitación · Reportar.
 *   2. Solo cuando ya se eligió aplicación: los módulos de ese curso.
 *
 * El segundo nivel no existe hasta que hay app elegida — antes no hay nada que
 * mostrar y estorbaría en pantalla de celular.
 */

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Lightbulb, Lock, Moon, RefreshCw, Sun } from "lucide-react";
import { useProgreso } from "../lib/progreso";

export function Layout() {
  const progreso = useProgreso();
  const { pathname } = useLocation();
  const ir = useNavigate();
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

  const { curso, app } = progreso;
  const enCurso = pathname.startsWith("/capacitacion/") && !!curso && !!app;
  const base = app ? `/capacitacion/${encodeURIComponent(app.id)}` : "";

  return (
    <div className="flex min-h-full flex-col">
      {/* Cabecera y pestañas principales viajan juntas como un solo bloque
          pegajoso: con `top` fijos en cada una, cualquier cambio de alto (la
          barra de progreso aparece y desaparece) las solapaba. */}
      <div className="sticky top-0 z-20">
        <header className="bg-brand-700 text-white">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-base font-semibold leading-tight">
                  Capacitación de inspectores
                </h1>
                <p className="truncate text-xs text-brand-100">ADEMINCOL S.A.S.</p>
              </div>
              <button
                onClick={() => setOscuro((v) => !v)}
                aria-label="Cambiar tema"
                className="rounded-lg p-2 text-brand-100 transition hover:bg-brand-800"
              >
                {oscuro ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            {enCurso && (
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-brand-800">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${progreso.porcentaje}%` }}
                />
              </div>
            )}
          </div>
        </header>

        {/* Nivel 1 — las dos pestañas */}
        <nav className="bg-brand-700">
          <div className="mx-auto flex max-w-3xl gap-1 px-2">
            <PestanaPrincipal a="/capacitacion" icono={GraduationCap} texto="Capacitación" />
            <PestanaPrincipal a="/reportar" icono={Lightbulb} texto="Reportar" />
          </div>
        </nav>
      </div>

      {/* Nivel 2 — el curso de la app elegida. No es pegajoso a propósito: en
          celular, tres barras fijas se comen un cuarto de la pantalla, y
          mientras se lee un módulo no hace falta. */}
      {enCurso && (
        <div className="border-b border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-800">
          <div className="mx-auto max-w-3xl px-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
              <span className="truncate font-semibold text-ink-700 dark:text-ink-200">
                {app.id} · {app.nombre}
              </span>
              <button
                onClick={() => ir("/capacitacion")}
                className="flex shrink-0 items-center gap-1 text-brand-600 hover:underline
                           dark:text-brand-400"
              >
                <RefreshCw size={12} /> cambiar
              </button>
            </div>

            <div className="-mx-1 flex gap-1 overflow-x-auto [scrollbar-width:none]">
              <Sub a={base} texto="Inicio" fin />
              {curso.modulos.map((m, i) => (
                <Sub
                  key={m.id}
                  a={`${base}/modulo/${i + 1}`}
                  texto={`${i + 1}. ${m.titulo}`}
                  visto={progreso.vistos.has(m.id)}
                />
              ))}
              <Sub a={`${base}/evaluacion`} texto="Evaluación" bloqueada={!progreso.todosVistos} />
              <Sub a={`${base}/constancia`} texto="Constancia" bloqueada={!progreso.aprobada} />
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-7">
        <Outlet />
      </main>

      <footer className="px-4 py-6 text-center text-xs text-ink-400 dark:text-ink-500">
        ADEMINCOL S.A.S.
        {curso && ` · ${curso.codigo} v${curso.version}`}
      </footer>
    </div>
  );
}

function PestanaPrincipal({
  a,
  texto,
  icono: Icono,
}: {
  a: string;
  texto: string;
  icono: typeof GraduationCap;
}) {
  return (
    <NavLink
      to={a}
      className={({ isActive }) =>
        "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition " +
        (isActive
          ? "border-white font-semibold text-white"
          : "border-transparent text-brand-100 hover:text-white")
      }
    >
      <Icono size={15} />
      {texto}
    </NavLink>
  );
}

function Sub({
  a,
  texto,
  bloqueada,
  visto,
  fin,
}: {
  a: string;
  texto: string;
  bloqueada?: boolean;
  visto?: boolean;
  fin?: boolean;
}) {
  if (bloqueada) {
    return (
      <span
        title="Se habilita más adelante"
        className="flex shrink-0 cursor-not-allowed items-center gap-1 whitespace-nowrap
                   border-b-2 border-transparent px-2 py-2.5 text-xs text-ink-400
                   dark:text-ink-500"
      >
        <Lock size={11} />
        {texto}
      </span>
    );
  }

  return (
    <NavLink
      to={a}
      end={fin}
      className={({ isActive }) =>
        "flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2 py-2.5 text-xs transition " +
        (isActive
          ? "border-brand-600 font-semibold text-brand-700 dark:text-brand-400"
          : "border-transparent text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100")
      }
    >
      {texto}
      {visto && <span className="text-emerald-600 dark:text-emerald-400">✓</span>}
    </NavLink>
  );
}
