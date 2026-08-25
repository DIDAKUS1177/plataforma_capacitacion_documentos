/**
 * Página pública que abre el QR de una constancia.
 *
 * La ve gente de fuera —un auditor, un cliente— que no está haciendo la
 * capacitación. Por eso va sin las pestañas del curso: solo el logo, el
 * veredicto y los datos mínimos.
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { ErrorApi, verificarConstancia, type Verificacion } from "../api/cliente";
import logo from "../assets/logo-demincol.png";

export function VerificarPage() {
  const { id = "" } = useParams();
  const [datos, setDatos] = useState<Verificacion | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    verificarConstancia(id)
      .then(setDatos)
      .catch((e) =>
        setError(e instanceof ErrorApi ? e.message : "No se pudo verificar la constancia."),
      )
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <div className="flex min-h-full flex-col bg-ink-50">
      <header className="border-b-4 border-brand-600 bg-white shadow-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <img src={logo} alt="Demincol" className="h-9 w-auto sm:h-11" />
          <div>
            <p className="text-sm font-semibold text-ink-800">Verificación de constancia</p>
            <p className="text-xs text-ink-400">ADEMINCOL S.A.S.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          {cargando && (
            <p className="flex items-center gap-2 py-6 text-sm text-ink-500">
              <Loader2 size={16} className="animate-spin" />
              Verificando…
            </p>
          )}

          {!cargando && error && (
            <div className="py-4 text-center">
              <XCircle size={44} className="mx-auto text-brand-600" />
              <h1 className="mt-3 text-xl font-semibold text-ink-900">No verificada</h1>
              <p className="mt-2 text-sm text-ink-600">{error}</p>
              <p className="mt-4 break-all font-mono text-xs text-ink-400">{id}</p>
            </div>
          )}

          {!cargando && datos && (
            <>
              <div className="text-center">
                {datos.aprobado ? (
                  <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
                ) : (
                  <XCircle size={44} className="mx-auto text-brand-600" />
                )}
                <h1 className="mt-3 text-xl font-semibold text-ink-900">
                  {datos.aprobado ? "Constancia válida" : "Constancia sin aprobar"}
                </h1>
                <p className="mt-1 text-sm text-ink-500">
                  Registrada en los sistemas de ADEMINCOL.
                </p>
              </div>

              <dl className="mt-6 divide-y divide-ink-200 rounded-lg border border-ink-200">
                <Fila k="Nombre" v={datos.nombre} />
                <Fila k="Cédula" v={datos.cedula} />
                <Fila k="Capacitación" v={datos.curso} />
                <Fila k="Material" v={`${datos.cursoCodigo} · v${datos.cursoVersion}`} />
                <Fila k="Formato" v={datos.formato || "—"} />
                <Fila k="Fecha" v={datos.fecha} />
                <Fila k="Evaluación" v={datos.resultado} />
              </dl>

              <p className="mt-4 break-all text-center font-mono text-xs text-ink-400">{id}</p>
            </>
          )}
        </div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-ink-400">ADEMINCOL S.A.S.</footer>
    </div>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 px-3 py-2.5 text-sm">
      <dt className="w-28 shrink-0 text-ink-500">{k}</dt>
      <dd className="min-w-0 font-medium text-ink-800">{v}</dd>
    </div>
  );
}
