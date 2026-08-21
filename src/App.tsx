import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProveedorProgreso } from "./lib/progreso";
import { InicioPage } from "./pages/InicioPage";
import { ModuloPage } from "./pages/ModuloPage";
import { EvaluacionPage } from "./pages/EvaluacionPage";
import { ConstanciaPage } from "./pages/ConstanciaPage";
import { ReportarPage } from "./pages/ReportarPage";

export default function App() {
  return (
    <ProveedorProgreso>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<InicioPage />} />
            <Route path="/modulo/:numero" element={<ModuloPage />} />
            <Route path="/evaluacion" element={<EvaluacionPage />} />
            <Route path="/constancia" element={<ConstanciaPage />} />
            <Route path="/reportar" element={<ReportarPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProveedorProgreso>
  );
}
