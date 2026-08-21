import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send } from "lucide-react";
import { CRITICIDADES, TIPOS_MEJORA } from "../contenido/curso";
import { ErrorApi, obtenerAplicaciones, registrarMejora } from "../api/cliente";
import { validarMejora } from "../../shared/validacion";
import {
  Aviso,
  Boton,
  CampoArea,
  CampoSelect,
  CampoTexto,
  Tarjeta,
  Titulo,
} from "../components/ui";

export function ReportarPage() {
  // Permite enlaces directos desde cada app: /reportar?app=APP-022...
  const [params] = useSearchParams();

  const [apps, setApps] = useState<string[]>([]);
  const [aplicacion, setAplicacion] = useState(params.get("app") || "");
  const [tipo, setTipo] = useState(TIPOS_MEJORA[0]);
  const [criticidad, setCriticidad] = useState(CRITICIDADES[1]);
  const [descripcion, setDescripcion] = useState("");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");

  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [radicado, setRadicado] = useState("");

  useEffect(() => {
    obtenerAplicaciones()
      .then(setApps)
      .catch(() => setError("No se pudo cargar la lista de aplicaciones. Recarga la página."));
  }, []);

  async function enviar() {
    const payload = { aplicacion, tipo, criticidad, descripcion, nombre, correo };
    const problema = validarMejora(payload);
    if (problema) {
      setError(problema);
      return;
    }

    setError("");
    setEnviando(true);
    try {
      const respuesta = await registrarMejora(payload);
      setRadicado(respuesta.datos?.id || "");
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo enviar. Intenta otra vez.");
    } finally {
      setEnviando(false);
    }
  }

  function otro() {
    setRadicado("");
    setDescripcion("");
    setAplicacion("");
    setError("");
  }

  if (radicado) {
    return (
      <Tarjeta className="text-center">
        <Send size={40} className="mx-auto text-brand-600" />
        <h2 className="mt-3 text-xl font-semibold text-ink-900 dark:text-ink-50">Recibido</h2>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
          Tu reporte quedó con el número <b>{radicado}</b>. Gracias por avisar.
        </p>
        <div className="mt-5 flex justify-center">
          <Boton variante="secundaria" onClick={otro}>
            Reportar otra cosa
          </Boton>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <Titulo meta="Todo lo que se reporta aquí queda registrado y se revisa. Si dejas tu nombre, te contamos en qué quedó.">
        Reportar una falla o proponer una mejora
      </Titulo>

      <CampoSelect
        etiqueta="Aplicación"
        valor={aplicacion}
        alCambiar={setAplicacion}
        opciones={apps}
        vacio={apps.length ? "Selecciona…" : "Cargando…"}
      />
      <CampoSelect etiqueta="Tipo" valor={tipo} alCambiar={setTipo} opciones={TIPOS_MEJORA} />
      <CampoSelect
        etiqueta="¿Qué tanto te afecta?"
        valor={criticidad}
        alCambiar={setCriticidad}
        opciones={CRITICIDADES}
      />
      <CampoArea
        etiqueta="Cuéntanos qué pasó o qué propones"
        valor={descripcion}
        alCambiar={setDescripcion}
        marcador="Ej: en el formulario de espesores, cuando pierdo señal y vuelvo a entrar, el campo de espesor nominal queda vacío."
        ayuda="Entre más concreto, más rápido se puede arreglar."
      />
      <CampoTexto etiqueta="Tu nombre" ayuda="Opcional." valor={nombre} alCambiar={setNombre} />
      <CampoTexto
        etiqueta="Tu correo"
        tipo="email"
        ayuda="Opcional, para responderte."
        valor={correo}
        alCambiar={setCorreo}
      />

      {error && <Aviso tono="mal">{error}</Aviso>}

      <div className="mt-4">
        <Boton onClick={enviar} cargando={enviando}>
          Enviar reporte
        </Boton>
      </div>
    </Tarjeta>
  );
}
