import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CURSO } from "../contenido/curso";
import { useProgreso } from "../lib/progreso";
import { Boton, Tarjeta, Titulo } from "../components/ui";

export function ModuloPage() {
  const { numero } = useParams();
  const indice = Number(numero) - 1;
  const modulo = CURSO.modulos[indice];
  const { marcarVisto } = useProgreso();
  const ir = useNavigate();

  useEffect(() => {
    if (modulo) marcarVisto(modulo.id);
  }, [modulo, marcarVisto]);

  // Una URL inventada (/modulo/9) no debe dejar la página en blanco.
  if (!modulo) return <Navigate to="/" replace />;

  const esUltimo = indice === CURSO.modulos.length - 1;

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
          <Boton variante="secundaria" onClick={() => ir(`/modulo/${indice}`)}>
            Anterior
          </Boton>
        )}
        <Boton onClick={() => ir(esUltimo ? "/evaluacion" : `/modulo/${indice + 2}`)}>
          {esUltimo ? "Ir a la evaluación" : "Siguiente"}
        </Boton>
      </div>
    </Tarjeta>
  );
}
