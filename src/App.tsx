import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProveedorProgreso } from "./lib/progreso";
import { ProveedorAplicaciones } from "./lib/aplicaciones";
import { RegistroPage } from "./pages/RegistroPage";
import { DiapositivasPage, ManualPage } from "./pages/MaterialPage";
import { PuntosClavePage } from "./pages/PuntosClavePage";
import { EvaluacionPage } from "./pages/EvaluacionPage";
import { ConstanciaPage } from "./pages/ConstanciaPage";
import { ReportarPage } from "./pages/ReportarPage";
import { VerificarPage } from "./pages/VerificarPage";

export default function App() {
  return (
    <ProveedorAplicaciones>
      <ProveedorProgreso>
        <BrowserRouter>
          <Routes>
            {/* Fuera del Layout: la abre gente de fuera que no esta haciendo
                la capacitacion, y las pestanas del curso solo estorbarian. */}
            <Route path="/verificar/:id" element={<VerificarPage />} />

            <Route element={<Layout />}>
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

              <Route path="*" element={<Navigate to="/capacitacion" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProveedorProgreso>
    </ProveedorAplicaciones>
  );
}
