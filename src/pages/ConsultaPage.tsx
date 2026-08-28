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
import { useSesion } from "../lib/sesion";
import { Aviso, Boton, CampoTexto, Tarjeta, Titulo } from "../components/ui";

/** Colores por estado. Lo que no esté aquí sale en gris. */
const TONOS: Record<string, string> = {
  recibida: "bg-ink-100 text-ink-700",
  "en análisis": "bg-amber-100 text-amber-800",
  aceptada: "bg-sky-100 text-sky-800",
  implementada: "bg-emerald-100 text-emerald-800",
  rechazada: "bg-brand-100 text-brand-800",
  duplicada: "bg-ink-100 text-ink-600",
};

export function ConsultaPage() {
  // El acuse por correo trae ?id=MEJ-0007 para no tener que teclearlo.
  const [params] = useSearchParams();
  // El correo sale de la sesión. Se deja abrir el campo porque alguien pudo
  // haber reportado antes con otro correo, y el reporte quedó atado a ese.
  const { persona } = useSesion();
  const [id, setId] = useState(params.get("id") || "");
  const [correo, setCorreo] = useState(persona?.correo || "");
  const [otroCorreo, setOtroCorreo] = useState(!persona);

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
        <Titulo meta="Con el número que te dimos al reportar.">
          Consulta tu reporte
        </Titulo>

        <CampoTexto
          etiqueta="Número del reporte"
          valor={id}
          alCambiar={(v) => setId(v.toUpperCase())}
          marcador="MEJ-0007"
          ayuda="Está en el correo que te llegó al reportar."
        />
        {otroCorreo ? (
          <CampoTexto
            etiqueta="Tu correo"
            tipo="email"
            valor={correo}
            alCambiar={setCorreo}
            marcador="el mismo con el que reportaste"
          />
        ) : (
          <p className="mb-4 rounded-lg bg-ink-100 px-3 py-2.5 text-sm text-ink-600">
            Buscamos los reportes hechos con {persona?.correo}.{" "}
            <button
              type="button"
              onClick={() => setOtroCorreo(true)}
              className="underline underline-offset-2 hover:text-ink-900"
            >
              Usé otro correo
            </button>
          </p>
        )}

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
        <span className="text-lg font-semibold text-ink-900">{datos.id}</span>
        <span className={"rounded-full px-3 py-1 text-xs font-semibold " + tono}>
          {datos.estado}
        </span>
      </div>

      <dl
        className="mb-5 divide-y divide-ink-200 rounded-lg border border-ink-200"
      >
        <Fila k="Reportado el" v={datos.fecha} />
        <Fila k="Aplicación" v={datos.aplicacion} />
        <Fila k="Tipo" v={datos.tipo} />
        {datos.responsable && <Fila k="Revisado por" v={datos.responsable} />}
        {datos.fechaRespuesta && <Fila k="Respondido el" v={datos.fechaRespuesta} />}
      </dl>

      <p className="mb-1 text-sm font-semibold text-ink-700">Lo que reportaste</p>
      <p
        className="mb-5 whitespace-pre-wrap rounded-lg bg-ink-100 p-3 text-sm text-ink-700"
      >
        {datos.descripcion}
      </p>

      <p className="mb-1 text-sm font-semibold text-ink-700">Qué se hizo</p>
      {datos.respondido ? (
        <p
          className="whitespace-pre-wrap rounded-lg border-l-4 border-brand-600 bg-brand-50 p-3
                     text-sm text-ink-800"
        >
          {datos.respuesta}
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-lg bg-ink-100 p-3 text-sm text-ink-600">
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
      <dt className="w-32 shrink-0 text-ink-500">{k}</dt>
      <dd className="min-w-0 font-medium text-ink-800">{v || "—"}</dd>
    </div>
  );
}
