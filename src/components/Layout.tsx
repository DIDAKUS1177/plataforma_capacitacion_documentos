/**
 * Cabecera y navegación. Copia el lenguaje visual del AppShell de ADEMINCOL
 * Central: fondo blanco, borde inferior rojo de 4 px, el logo real y las
 * pestañas subrayadas en brand-600 cuando están activas.
 *
 * Dos niveles:
 *   1. Las cuatro pestañas: Capacitación · Mis cursos · Reportar · Mi reporte.
 *   2. Los pasos del curso, que se van abriendo a medida que se avanza.
 */

import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Award, GraduationCap, Lightbulb, Lock, LogIn, LogOut, Search } from "lucide-react";
import { useProgreso } from "../lib/progreso";
import { useSesion } from "../lib/sesion";
import { FondoIndustrial } from "./FondoIndustrial";
import logo from "../assets/logo-demincol.png";

export function Layout() {
  const progreso = useProgreso();
  const { sesion, persona, salir } = useSesion();
  const { pathname } = useLocation();

  // Salir recarga la página en vez de navegar. El progreso del curso vive en
  // memoria, y en una tablet compartida en campo el siguiente no puede heredar
  // los pasos ya marcados del anterior.
  function cerrar() {
    salir();
    window.location.assign("/entrar");
  }
  // Al cambiar de página se sube el scroll: en celular, si no, se entra al
  // paso siguiente a media altura.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const { registro, vistos, todoVisto, aprobada } = progreso;
  const enCapacitacion = pathname.startsWith("/capacitacion");

  const pasos = [
    { a: "/capacitacion", texto: "Registro", fin: true, hecho: !!registro },
    {
      a: "/capacitacion/diapositivas",
      texto: "Presentación",
      bloqueada: !registro,
      hecho: vistos.has("diapositivas"),
    },
    {
      a: "/capacitacion/manual",
      texto: "Instructivo",
      bloqueada: !registro,
      hecho: vistos.has("manual"),
    },
    {
      a: "/capacitacion/puntos-clave",
      texto: "Puntos clave",
      bloqueada: !registro,
      hecho: vistos.has("puntos-clave"),
    },
    { a: "/capacitacion/evaluacion", texto: "Evaluación", bloqueada: !todoVisto, hecho: aprobada },
    { a: "/capacitacion/constancia", texto: "Constancia", bloqueada: !aprobada },
  ];

  return (
    <div className="flex min-h-full flex-col">
      {/* Muy tenue y fijo al borde inferior: se asoma alrededor de las tarjetas
          sin competir nunca con el texto que hay dentro de ellas. */}
      <FondoIndustrial variante="sutil" />

      {/* Branding, pestañas y barra de progreso van dentro de la MISMA cabecera
          pegajosa: con `top` fijos en cada bloque, el alto cambiante los
          solapaba. */}
      <header className="sticky top-0 z-30 border-b-4 border-brand-600 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logo} alt="Demincol" className="h-9 w-auto shrink-0 sm:h-11" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-800">
                Capacitación de inspectores
              </p>
              <p className="truncate text-xs text-ink-400">
                {persona?.nombre ||
                  registro?.nombre ||
                  (sesion ? "Entraste sin registro" : "Formación y buzón de mejoras")}
              </p>
            </div>
          </div>

          {sesion ? (
            <button
              type="button"
              onClick={cerrar}
              title="Salir"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-300 px-2.5
                         py-1.5 text-xs font-medium text-ink-600 transition-colors
                         hover:bg-ink-100 hover:text-ink-900"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          ) : (
            /* Quien llega directo al buzón no tiene sesión, y puede querer
               capacitarse sin buscar por dónde. */
            <NavLink
              to="/entrar"
              title="Entrar"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-300 px-2.5
                         py-1.5 text-xs font-medium text-ink-600 transition-colors
                         hover:bg-ink-100 hover:text-ink-900"
            >
              <LogIn size={14} />
              <span className="hidden sm:inline">Entrar</span>
            </NavLink>
          )}
        </div>

        {/* Nivel 1 — las pestañas principales */}
        <nav className="border-t border-ink-100">
          <div className="mx-auto flex max-w-3xl overflow-x-auto px-2 [scrollbar-width:none]">
            <PestanaPrincipal a="/capacitacion" icono={GraduationCap} texto="Capacitación" />
            <PestanaPrincipal a="/mis-cursos" icono={Award} texto="Mis cursos" />
            <PestanaPrincipal a="/reportar" icono={Lightbulb} texto="Reportar" />
            <PestanaPrincipal a="/mi-reporte" icono={Search} texto="Mi reporte" />
          </div>
        </nav>

        {enCapacitacion && (
          <div className="h-1 bg-ink-100">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progreso.porcentaje}%` }}
            />
          </div>
        )}
      </header>

      {/* Nivel 2 — los pasos. No es pegajoso a propósito: en celular, tres
          barras fijas se comen un cuarto de la pantalla. */}
      {enCapacitacion && (
        <div className="border-b border-ink-200 bg-white">
          <div className="mx-auto max-w-3xl px-3">
            <div className="-mx-1 flex gap-1 overflow-x-auto [scrollbar-width:none]">
              {pasos.map((p) => (
                <Paso key={p.a} {...p} />
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-7">
        <Outlet />
      </main>

      <footer className="px-4 py-6 text-center text-xs text-ink-400">
        ADEMINCOL S.A.S.
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

function Paso({
  a,
  texto,
  bloqueada,
  hecho,
  fin,
}: {
  a: string;
  texto: string;
  bloqueada?: boolean;
  hecho?: boolean;
  fin?: boolean;
}) {
  if (bloqueada) {
    return (
      <span
        title="Se habilita más adelante"
        className="flex shrink-0 cursor-not-allowed items-center gap-1 whitespace-nowrap
                   border-b-2 border-transparent px-2 py-2.5 text-xs text-ink-400"
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
          ? "border-brand-600 font-semibold text-brand-700"
          : "border-transparent text-ink-600 hover:text-ink-900")
      }
    >
      {texto}
      {hecho && <span className="text-emerald-600">✓</span>}
    </NavLink>
  );
}
