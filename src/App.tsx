import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import { VerificarPage } from "./pages/VerificarPage";

/**
 * Sin sesión no se ve la aplicación: se manda a identificarse y se recuerda a
 * dónde iba, para que un enlace directo a /mi-reporte no termine dejando a la
 * persona en la capacitación.
 */
function ExigeSesion({ children }: { children: React.ReactNode }) {
  const { sesion } = useSesion();
  const { pathname, search } = useLocation();
  if (!sesion) {
    return <Navigate to="/entrar" replace state={{ desde: pathname + search }} />;
  }
  return <>{children}</>;
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

              <Route
                element={
                  <ExigeSesion>
                    <Layout />
                  </ExigeSesion>
                }
              >
                <Route path="/" element={<Navigate to="/capacitacion" replace />} />

                {/* Pestana 1 - la capacitacion, en orden */}
                <Route path="/capacitacion" element={<RegistroPage />} />
                <Route path="/capacitacion/diapositivas" element={<DiapositivasPage />} />
                <Route path="/capacitacion/manual" element={<ManualPage />} />
                <Route path="/capacitacion/puntos-clave" element={<PuntosClavePage />} />
                <Route path="/capacitacion/evaluacion" element={<EvaluacionPage />} />
                <Route path="/capacitacion/constancia" element={<ConstanciaPage />} />

                {/* Pestana 2 - buzon de mejoras */}
                <Route path="/reportar" element={<ReportarPage />} />

                {/* Pestana 3 - que capacitaciones lleva */}
                <Route path="/mis-cursos" element={<HistorialPage />} />

                {/* Pestana 4 - consultar en que quedo lo reportado */}
                <Route path="/mi-reporte" element={<ConsultaPage />} />

                <Route path="*" element={<Navigate to="/capacitacion" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ProveedorProgreso>
      </ProveedorAplicaciones>
    </ProveedorSesion>
  );
}
