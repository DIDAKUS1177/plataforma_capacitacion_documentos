/**
 * Primera pantalla: ¿para cuál aplicación te vas a capacitar?
 *
 * La lista sale del Listado Maestro de Calidad, no de una copia local: si
 * calidad agrega una app o le cambia el código de formato, aquí aparece sola.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { useAplicaciones } from "../lib/aplicaciones";
import { Aviso, Tarjeta, Titulo } from "../components/ui";
import type { Aplicacion } from "../../shared/tipos";

export function SelectorPage() {
  const { apps, cargando, error } = useAplicaciones();
  const [q, setQ] = useState("");
  const ir = useNavigate();

  const filtradas = useMemo(() => {
    const texto = normalizar(q);
    const utiles = apps.filter((a) => a.id !== "OTRA");
    if (!texto) return utiles;
    return utiles.filter((a) =>
      normalizar(`${a.id} ${a.nombre} ${a.tecnica} ${a.codigo}`).includes(texto),
    );
  }, [apps, q]);

  return (
    <Tarjeta>
      <Titulo meta="Elige la aplicación sobre la que te vas a capacitar. Cada una tiene su propia constancia.">
        ¿En qué te vas a capacitar?
      </Titulo>

      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, técnica o código…"
          className="w-full rounded-lg border border-ink-300 bg-white py-2.5 pl-9 pr-3 text-sm
                     text-ink-800 outline-none focus:border-brand-500 focus:ring-2
                     focus:ring-brand-200 dark:border-ink-600 dark:bg-ink-900
                     dark:text-ink-100 dark:focus:ring-brand-800"
        />
      </div>

      {error && <Aviso tono="mal">{error}</Aviso>}

      {cargando && (
        <p className="flex items-center gap-2 py-6 text-sm text-ink-500 dark:text-ink-400">
          <Loader2 size={16} className="animate-spin" />
          Cargando el listado de aplicaciones…
        </p>
      )}

      {!cargando && !filtradas.length && !error && (
        <p className="py-6 text-sm text-ink-500 dark:text-ink-400">
          Ninguna aplicación coincide con “{q}”.
        </p>
      )}

      <ul className="divide-y divide-ink-200 dark:divide-ink-700">
        {filtradas.map((a) => (
          <li key={a.id}>
            <button
              onClick={() => ir(`/capacitacion/${encodeURIComponent(a.id)}`)}
              className="flex w-full items-center gap-3 py-3 text-left transition
                         hover:bg-ink-100 dark:hover:bg-ink-700"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">
                  {a.nombre}
                </p>
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                  <Etiquetas app={a} />
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-ink-400" />
            </button>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

function Etiquetas({ app }: { app: Aplicacion }) {
  const partes = [app.id, app.tecnica, app.codigo].filter(Boolean);
  if (app.version) partes.push(`v${app.version}`);
  return <>{partes.join(" · ")}</>;
}

/** Sin tildes y en minúscula, para que "particulas" encuentre "Partículas". */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
