import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useCursoDeLaApp } from "../lib/useCursoDeLaApp";
import { useProgreso } from "../lib/progreso";
import { Boton, Cargando, Tarjeta, Titulo } from "../components/ui";

export function ModuloPage() {
  const { numero } = useParams();
  const { app, curso, noExiste } = useCursoDeLaApp();
  const { marcarVisto } = useProgreso();
  const ir = useNavigate();

  const indice = Number(numero) - 1;
  const modulo = curso?.modulos[indice];

  useEffect(() => {
    if (modulo) marcarVisto(modulo.id);
  }, [modulo, marcarVisto]);

  if (noExiste) return <Navigate to="/capacitacion" replace />;
  if (!app || !curso) return <Cargando texto="Preparando la capacitación…" />;

  const base = `/capacitacion/${encodeURIComponent(app.id)}`;
  // Una URL inventada (/modulo/9) no debe dejar la página en blanco.
  if (!modulo) return <Navigate to={base} replace />;

  const esUltimo = indice === curso.modulos.length - 1;

  return (
    <Tarjeta>
      <Titulo meta={`${modulo.minutos} min de lectura`}>
        {indice + 1}. {modulo.titulo}
      </Titulo>

      <div
        className="prosa text-ink-700 dark:text-ink-200"
        dangerouslySetInnerHTML={{ __html: modulo.html }}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        {indice > 0 && (
          <Boton variante="secundaria" onClick={() => ir(`${base}/modulo/${indice}`)}>
            Anterior
          </Boton>
        )}
        <Boton onClick={() => ir(esUltimo ? `${base}/evaluacion` : `${base}/modulo/${indice + 2}`)}>
          {esUltimo ? "Ir a la evaluación" : "Siguiente"}
        </Boton>
      </div>
    </Tarjeta>
  );
}
