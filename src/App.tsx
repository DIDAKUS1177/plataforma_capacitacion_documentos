import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProveedorProgreso } from "./lib/progreso";
import { ProveedorAplicaciones } from "./lib/aplicaciones";
import { ProveedorSesion, useSesion } from "./lib/sesion";
import { EntrarPage } from "./pages/EntrarPage";
import { RegistroPage } from "./pages/RegistroPage";
import { DiapositivasPage, ManualPage } from "./pages/MaterialPage";
import { PuntosClavePage } from "./pages/PuntosClavePage";
import { EvaluacionPage } from "./pages/EvaluacionPage";
import { ConstanciaPage } from "./pages/ConstanciaPage";
import { ReportarPage } from "./pages/ReportarPage";
import { ConsultaPage } from "./pages/ConsultaPage";
import { HistorialPage } from "./pages/HistorialPage";
import { BasesPage } from "./pages/BasesPage";
import { VerificarPage } from "./pages/VerificarPage";

/**
 * Manda a identificarse y recuerda a dónde iba, para que un enlace directo no
 * termine dejando a la persona en otra pantalla.
 */
function ExigeSesion() {
  const { sesion } = useSesion();
  const { pathname, search } = useLocation();
  if (!sesion) {
    return <Navigate to="/entrar" replace state={{ desde: pathname + search }} />;
  }
  return <Outlet />;
}

/**
 * La pestaña Bases. Esconderla no protege nada —cualquiera puede fabricarse una
 * sesión desde la consola—; lo que protege es que /api/bases vuelva a verificar
 * correo y cédula contra la hoja `personal` en cada petición.
 */
function ExigeAdmin() {
  const { persona } = useSesion();
  if (!persona?.esAdmin) return <Navigate to="/capacitacion" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ProveedorSesion>
      <ProveedorAplicaciones>
        <ProveedorProgreso>
          <BrowserRouter>
            <Routes>
              {/* Fuera del Layout y sin sesion: la abre gente de fuera que no
                  esta haciendo la capacitacion. */}
              <Route path="/verificar/:id" element={<VerificarPage />} />
              <Route path="/entrar" element={<EntrarPage />} />

              <Route element={<Layout />}>
                {/* El buzon NO pide sesion, a proposito. El acuse por correo
                    trae el enlace de /mi-reporte, y los enlaces /reportar?app=
                    van pegados en la descripcion de cada app de AppSheet: si
                    caen en una pantalla de cedula, dejan de servir. Y un buzon
                    de quejas con muro de entrada recibe menos quejas. */}
                <Route path="/reportar" element={<ReportarPage />} />
                <Route path="/mi-reporte" element={<ConsultaPage />} />

                {/* Lo que si deja registro a nombre de alguien */}
                <Route element={<ExigeSesion />}>
                  <Route path="/" element={<Navigate to="/capacitacion" replace />} />

                  <Route path="/capacitacion" element={<RegistroPage />} />
                  <Route path="/capacitacion/diapositivas" element={<DiapositivasPage />} />
                  <Route path="/capacitacion/manual" element={<ManualPage />} />
                  <Route path="/capacitacion/puntos-clave" element={<PuntosClavePage />} />
                  <Route path="/capacitacion/evaluacion" element={<EvaluacionPage />} />
                  <Route path="/capacitacion/constancia" element={<ConstanciaPage />} />

                  <Route path="/mis-cursos" element={<HistorialPage />} />

                  <Route element={<ExigeAdmin />}>
                    <Route path="/bases" element={<BasesPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/capacitacion" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ProveedorProgreso>
      </ProveedorAplicaciones>
    </ProveedorSesion>
  );
}
