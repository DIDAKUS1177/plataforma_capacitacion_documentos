/**
 * Cierre: los datos ya se pidieron en el registro, así que aquí solo se
 * confirman y se aceptan las dos declaraciones. Menos fricción justo en el
 * punto donde la gente abandona.
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CURSO } from "../contenido/curso";
import { useProgreso } from "../lib/progreso";
import { obtenerConfig, registrarConstancia, ErrorApi, type ConfigServidor } from "../api/cliente";
import { validarConstancia } from "../../shared/validacion";
import { Aviso, Boton, Casilla, Tarjeta, Titulo } from "../components/ui";
import { FirmaPad } from "../components/FirmaPad";
import type { DatosConstancia } from "../../shared/tipos";

export function ConstanciaPage() {
  const progreso = useProgreso();
  const { registro } = progreso;

  const [config, setConfig] = useState<ConfigServidor>({ dominio: "", exigeFirma: false });
  const [firma, setFirma] = useState("");
  const [declaracion, setDeclaracion] = useState(false);
  const [datosOk, setDatosOk] = useState(false);

  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [idConstancia, setIdConstancia] = useState("");

  useEffect(() => {
    obtenerConfig()
      .then(setConfig)
      .catch(() => {});
  }, []);

  if (!registro) return <Navigate to="/capacitacion" replace />;
  if (!progreso.aprobada) return <Navigate to="/capacitacion/evaluacion" replace />;

  async function enviar() {
    if (!registro) return;

    const payload: DatosConstancia = {
      ...registro,
      firma,
      aceptaDeclaracion: declaracion,
      aceptaDatos: datosOk,
      cursoNombre: CURSO.nombre,
      puntaje: progreso.puntaje,
      totalPreguntas: CURSO.preguntas.length,
      aprobado: progreso.aprobada,
      minutos: progreso.minutos(),
      respuestas: progreso.respuestas,
    };

    const problema = validarConstancia(payload, config.dominio, config.exigeFirma);
    if (problema) {
      setError(problema);
      return;
    }

    setError("");
    setEnviando(true);
    try {
      const respuesta = await registrarConstancia(payload);
      setIdConstancia(respuesta.datos?.id || "");
      setExito(respuesta.mensaje || "Registro guardado.");
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo registrar. Intenta otra vez.");
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    const enlace = idConstancia ? `${window.location.origin}/verificar/${idConstancia}` : "";
    return (
      <Tarjeta className="text-center">
        <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
        <h2 className="mt-3 text-xl font-semibold text-ink-900">Listo</h2>
        <p className="mt-2 text-sm text-ink-600">{exito}</p>

        {enlace && (
          <>
            <p className="mt-6 text-sm font-semibold text-ink-700">
              Tu constancia
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-ink-500">
              Escanea o guarda este código: con él se comprueba que la capacitación
              es real, sin tener que buscarla en ninguna parte.
            </p>

            {/* El QR va sobre blanco siempre: en modo oscuro, un QR claro sobre
                fondo oscuro no lo lee ningún celular. */}
            <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-4 shadow-sm">
              <QRCodeSVG value={enlace} size={168} level="M" />
            </div>

            <a
              href={enlace}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block break-all text-xs text-brand-600 hover:underline"
            >
              {enlace}
            </a>
            <p className="mt-3 text-xs text-ink-400">
              También te llegó por correo.
            </p>
          </>
        )}
      </Tarjeta>
    );
  }

  const filas: [string, string][] = [
    ["Nombre", registro.nombre],
    ["Cédula", registro.cedula],
    ["Correo", registro.correo],
    ["Cargo", registro.cargo],
    ["Área / unidad", registro.areaUn],
    ["Formato", registro.appId ? `${registro.appId} — ${registro.appNombre}` : "—"],
    ["Evaluación", `${progreso.puntaje} de ${CURSO.preguntas.length}`],
  ];

  return (
    <Tarjeta>
      <Titulo meta="Estos son los datos que registraste al empezar.">
        Constancia de capacitación
      </Titulo>

      <dl
        className="mb-5 divide-y divide-ink-200 rounded-lg border border-ink-200"
      >
        {filas.map(([k, v]) => (
          <div key={k} className="flex gap-3 px-3 py-2 text-sm">
            <dt className="w-32 shrink-0 text-ink-500">{k}</dt>
            <dd className="min-w-0 font-medium text-ink-800">{v || "—"}</dd>
          </div>
        ))}
      </dl>

      {config.exigeFirma && <FirmaPad alFirmar={setFirma} />}

      <Casilla marcada={declaracion} alCambiar={setDeclaracion}>
        Declaro que recibí y entendí la capacitación, y que me comprometo a aplicar lo
        indicado en ella.
      </Casilla>
      <Casilla marcada={datosOk} alCambiar={setDatosOk}>
        Autorizo el tratamiento de mis datos personales (nombre, cédula y correo) para el
        registro de capacitaciones, conforme a la Ley 1581 de 2012.
      </Casilla>

      {error && <Aviso tono="mal">{error}</Aviso>}

      <div className="mt-4">
        <Boton onClick={enviar} cargando={enviando}>
          Registrar mi constancia
        </Boton>
      </div>
    </Tarjeta>
  );
}
