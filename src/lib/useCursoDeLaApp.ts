/**
 * Resuelve la aplicación de la URL (/capacitacion/:appId/...) y deja armado su
 * curso en el estado de progreso.
 *
 * Lo usan las cuatro páginas del curso para no repetir en cada una la búsqueda,
 * la espera de la carga y el caso "ese id no existe".
 */

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { construirCurso } from "../contenido/curso";
import { useAplicaciones } from "./aplicaciones";
import { useProgreso } from "./progreso";

export function useCursoDeLaApp() {
  const { appId = "" } = useParams();
  const { porId, cargando } = useAplicaciones();
  const { curso, fijarCurso } = useProgreso();

  const app = porId(appId);

  useEffect(() => {
    if (app) fijarCurso(construirCurso(app.id, app.nombre), app);
  }, [app, fijarCurso]);

  return {
    app,
    // Mientras el curso no corresponda a la app de la URL, la página todavía no
    // puede pintar: pasa en el primer render, antes de que corra el efecto.
    curso: curso && app && curso.codigo.endsWith(app.id) ? curso : null,
    cargando,
    /** El id de la URL no está en el Listado Maestro. */
    noExiste: !cargando && !app,
  };
}
