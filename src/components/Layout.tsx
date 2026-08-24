/**
 * Cabecera y navegación. Copia el lenguaje visual del AppShell de ADEMINCOL
 * Central: fondo blanco, borde inferior rojo de 4 px, el logo real y las
 * pestañas subrayadas en brand-600 cuando están activas.
 *
 * Dos niveles:
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
import logo from "../assets/logo-demincol.png";

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
      {/* Branding, pestañas y barra de progreso van dentro de la MISMA cabecera
          pegajosa: con `top` fijos en cada bloque, el alto cambiante (la barra
          aparece y desaparece) los solapaba.

          Y la cabecera NO cambia con el tema: el logo es tinta oscura sobre
          fondo transparente, así que sobre un header oscuro desaparecía. De
          paso queda idéntica a la de ADEMINCOL Central. */}
      <header className="sticky top-0 z-30 border-b-4 border-brand-600 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logo} alt="Demincol" className="h-9 w-auto shrink-0 sm:h-11" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-800">
                Capacitación de inspectores
              </p>
              <p className="truncate text-xs text-ink-400">
                {enCurso ? `${app.id} · ${app.nombre}` : "Formación y buzón de mejoras"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setOscuro((v) => !v)}
            aria-label="Cambiar tema"
            title="Cambiar tema"
            className="shrink-0 rounded-lg p-2 text-ink-500 transition hover:bg-ink-100
                       hover:text-brand-600"
          >
            {oscuro ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Nivel 1 — las dos pestañas */}
        <nav className="border-t border-ink-100">
          <div className="mx-auto flex max-w-3xl px-2">
            <PestanaPrincipal a="/capacitacion" icono={GraduationCap} texto="Capacitación" />
            <PestanaPrincipal a="/reportar" icono={Lightbulb} texto="Reportar" />
          </div>
        </nav>

        {enCurso && (
          <div className="h-1 bg-ink-100">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progreso.porcentaje}%` }}
            />
          </div>
        )}
      </header>

      {/* Nivel 2 — el curso de la app elegida. No es pegajoso a propósito: en
          celular, tres barras fijas se comen un cuarto de la pantalla, y
          mientras se lee un módulo no hace falta. */}
      {enCurso && (
        <div className="border-b border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-800">
          <div className="mx-auto max-w-3xl px-3 pt-2">
            <div className="flex justify-end">
              <button
                onClick={() => ir("/capacitacion")}
                className="flex shrink-0 items-center gap-1 text-xs text-brand-600
                           hover:underline dark:text-brand-400"
              >
                <RefreshCw size={12} /> cambiar de aplicación
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
        "flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors " +
        (isActive
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-ink-600 hover:border-ink-200 hover:text-ink-900")
      }
    >
      <Icono size={16} />
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
        "flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2 py-2.5 text-xs transition-colors " +
        (isActive
          ? "border-brand-600 font-semibold text-brand-700 dark:text-brand-400"
          : "border-transparent text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100")
      }
    >
      {texto}
      {visto && <span className="text-emerald-600 dark:text-emerald-400">✓</span>}
    </NavLink>
  );
}
