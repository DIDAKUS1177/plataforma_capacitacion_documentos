import { Navigate, useNavigate } from "react-router-dom";
import { useCursoDeLaApp } from "../lib/useCursoDeLaApp";
import { Boton, Cargando, Tarjeta, Titulo } from "../components/ui";

export function InicioPage() {
  const { app, curso, noExiste } = useCursoDeLaApp();
  const ir = useNavigate();

  if (noExiste) return <Navigate to="/capacitacion" replace />;
  if (!app || !curso) return <Cargando texto="Preparando la capacitación…" />;

  const duracion = curso.modulos.reduce((t, m) => t + m.minutos, 0) + 5;
  const ficha = [app.tecnica, app.codigo, app.version && `v${app.version}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Tarjeta>
      <Titulo
        meta={`${curso.codigo} · material v${curso.version} · ${duracion} min aprox.`}
      >
        {app.nombre}
      </Titulo>

      {ficha && (
        <p className="-mt-2 mb-4 text-sm text-ink-500 dark:text-ink-400">{ficha}</p>
      )}

      <div
        className="prosa text-ink-700 dark:text-ink-200"
        dangerouslySetInnerHTML={{ __html: curso.intro }}
      />

      <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">
        Son {curso.modulos.length} módulos y {curso.preguntas.length} preguntas; se aprueba
        con {curso.minimoAprobado}.
      </p>

      <div className="mt-6">
        <Boton onClick={() => ir(`/capacitacion/${encodeURIComponent(app.id)}/modulo/1`)}>
          Empezar
        </Boton>
      </div>
    </Tarjeta>
  );
}
