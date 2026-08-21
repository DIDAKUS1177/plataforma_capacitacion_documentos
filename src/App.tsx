import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProveedorProgreso } from "./lib/progreso";
import { ProveedorAplicaciones } from "./lib/aplicaciones";
import { SelectorPage } from "./pages/SelectorPage";
import { InicioPage } from "./pages/InicioPage";
import { ModuloPage } from "./pages/ModuloPage";
import { EvaluacionPage } from "./pages/EvaluacionPage";
import { ConstanciaPage } from "./pages/ConstanciaPage";
import { ReportarPage } from "./pages/ReportarPage";

export default function App() {
  return (
    <ProveedorAplicaciones>
      <ProveedorProgreso>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/capacitacion" replace />} />

              {/* Pestaña 1 — capacitación */}
              <Route path="/capacitacion" element={<SelectorPage />} />
              <Route path="/capacitacion/:appId" element={<InicioPage />} />
              <Route path="/capacitacion/:appId/modulo/:numero" element={<ModuloPage />} />
              <Route path="/capacitacion/:appId/evaluacion" element={<EvaluacionPage />} />
              <Route path="/capacitacion/:appId/constancia" element={<ConstanciaPage />} />

              {/* Pestaña 2 — buzón de mejoras */}
              <Route path="/reportar" element={<ReportarPage />} />

              <Route path="*" element={<Navigate to="/capacitacion" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProveedorProgreso>
    </ProveedorAplicaciones>
  );
}
