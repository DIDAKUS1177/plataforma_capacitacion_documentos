import { useNavigate } from "react-router-dom";
import { CURSO } from "../contenido/curso";
import { Boton, Tarjeta, Titulo } from "../components/ui";

export function InicioPage() {
  const ir = useNavigate();
  const duracion = CURSO.modulos.reduce((t, m) => t + m.minutos, 0) + 5;

  return (
    <Tarjeta>
      <Titulo meta={`${CURSO.codigo} · versión ${CURSO.version} · ${CURSO.fechaVersion} · ${duracion} min aprox.`}>
        {CURSO.nombre}
      </Titulo>

      <div className="prosa text-ink-700 dark:text-ink-200" dangerouslySetInnerHTML={{ __html: CURSO.intro }} />

      <div className="mt-6">
        <Boton onClick={() => ir("/modulo/1")}>Empezar</Boton>
      </div>
    </Tarjeta>
  );
}
