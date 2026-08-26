/**
 * "Mi reporte": el inspector consulta en qué quedó lo que reportó.
 *
 * Pide el número Y el correo. Los números son consecutivos, así que solo con el
 * número cualquiera podría recorrer los reportes de todos.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Search } from "lucide-react";
import { consultarReporte, ErrorApi, type EstadoReporte } from "../api/cliente";
import { Aviso, Boton, CampoTexto, Tarjeta, Titulo } from "../components/ui";

/** Colores por estado. Lo que no esté aquí sale en gris. */
const TONOS: Record<string, string> = {
  recibida: "bg-ink-100 text-ink-700 dark:bg-ink-700 dark:text-ink-100",
  "en análisis": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  aceptada: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100",
  implementada: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  rechazada: "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100",
  duplicada: "bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-200",
};

export function ConsultaPage() {
  // El acuse por correo trae ?id=MEJ-0007 para no tener que teclearlo.
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("id") || "");
  const [correo, setCorreo] = useState("");

  const [datos, setDatos] = useState<EstadoReporte | null>(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const traido = params.get("id");
    if (traido) setId(traido.toUpperCase());
  }, [params]);

  async function buscar() {
    setError("");
    setDatos(null);
    setBuscando(true);
    try {
      setDatos(await consultarReporte(id, correo));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo consultar. Intenta otra vez.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <>
      <Tarjeta className="mb-4">
        <Titulo meta="Con el número que te dimos al reportar y el correo que dejaste.">
          Consulta tu reporte
        </Titulo>

        <CampoTexto
          etiqueta="Número del reporte"
          valor={id}
          alCambiar={(v) => setId(v.toUpperCase())}
          marcador="MEJ-0007"
          ayuda="Está en el correo que te llegó al reportar."
        />
        <CampoTexto
          etiqueta="Tu correo"
          tipo="email"
          valor={correo}
          alCambiar={setCorreo}
          marcador="el mismo con el que reportaste"
        />

        {error && <Aviso tono="mal">{error}</Aviso>}

        <div className="mt-4">
          <Boton onClick={buscar} cargando={buscando}>
            <Search size={15} /> Consultar
          </Boton>
        </div>
      </Tarjeta>

      {datos && <Resultado datos={datos} />}
    </>
  );
}

function Resultado({ datos }: { datos: EstadoReporte }) {
  const tono = TONOS[datos.estado.toLowerCase()] || TONOS.recibida;

  return (
    <Tarjeta>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-lg font-semibold text-ink-900 dark:text-ink-50">{datos.id}</span>
        <span className={"rounded-full px-3 py-1 text-xs font-semibold " + tono}>
          {datos.estado}
        </span>
      </div>

      <dl
        className="mb-5 divide-y divide-ink-200 rounded-lg border border-ink-200
                   dark:divide-ink-700 dark:border-ink-700"
      >
        <Fila k="Reportado el" v={datos.fecha} />
        <Fila k="Aplicación" v={datos.aplicacion} />
        <Fila k="Tipo" v={datos.tipo} />
        {datos.responsable && <Fila k="Revisado por" v={datos.responsable} />}
        {datos.fechaRespuesta && <Fila k="Respondido el" v={datos.fechaRespuesta} />}
      </dl>

      <p className="mb-1 text-sm font-semibold text-ink-700 dark:text-ink-200">Lo que reportaste</p>
      <p
        className="mb-5 whitespace-pre-wrap rounded-lg bg-ink-100 p-3 text-sm text-ink-700
                   dark:bg-ink-900 dark:text-ink-200"
      >
        {datos.descripcion}
      </p>

      <p className="mb-1 text-sm font-semibold text-ink-700 dark:text-ink-200">Qué se hizo</p>
      {datos.respondido ? (
        <p
          className="whitespace-pre-wrap rounded-lg border-l-4 border-brand-600 bg-brand-50 p-3
                     text-sm text-ink-800 dark:bg-brand-950/40 dark:text-ink-100"
        >
          {datos.respuesta}
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-lg bg-ink-100 p-3 text-sm text-ink-600
                      dark:bg-ink-900 dark:text-ink-300">
          <Clock size={16} className="mt-0.5 shrink-0" />
          Todavía sin respuesta. Cuando lo revisemos te llega un correo — no tienes
          que estar entrando a mirar.
        </p>
      )}
    </Tarjeta>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 px-3 py-2 text-sm">
      <dt className="w-32 shrink-0 text-ink-500 dark:text-ink-400">{k}</dt>
      <dd className="min-w-0 font-medium text-ink-800 dark:text-ink-100">{v || "—"}</dd>
    </div>
  );
}
