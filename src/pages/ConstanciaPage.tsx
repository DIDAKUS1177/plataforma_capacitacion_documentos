import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useCursoDeLaApp } from "../lib/useCursoDeLaApp";
import { useProgreso } from "../lib/progreso";
import { obtenerConfig, registrarConstancia, ErrorApi, type ConfigServidor } from "../api/cliente";
import { validarConstancia } from "../../shared/validacion";
import { Aviso, Boton, CampoTexto, Cargando, Casilla, Tarjeta, Titulo } from "../components/ui";
import { FirmaPad } from "../components/FirmaPad";
import type { DatosConstancia } from "../../shared/tipos";

export function ConstanciaPage() {
  const { app, curso, noExiste } = useCursoDeLaApp();
  const progreso = useProgreso();

  const [config, setConfig] = useState<ConfigServidor>({ dominio: "", exigeFirma: false });
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [cargo, setCargo] = useState("");
  const [areaUn, setAreaUn] = useState("");
  const [firma, setFirma] = useState("");
  const [declaracion, setDeclaracion] = useState(false);
  const [datosOk, setDatosOk] = useState(false);

  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");

  useEffect(() => {
    // Si falla, se queda con los valores por defecto: el servidor valida igual.
    obtenerConfig()
      .then(setConfig)
      .catch(() => {});
  }, []);

  if (noExiste) return <Navigate to="/capacitacion" replace />;
  if (!app || !curso) return <Cargando />;
  if (!progreso.aprobada) {
    return <Navigate to={`/capacitacion/${encodeURIComponent(app.id)}`} replace />;
  }

  async function enviar() {
    if (!app || !curso) return;

    const payload: DatosConstancia = {
      nombre,
      cedula,
      correo,
      cargo,
      areaUn,
      firma,
      appId: app.id,
      appNombre: app.nombre,
      tecnica: app.tecnica,
      aceptaDeclaracion: declaracion,
      aceptaDatos: datosOk,
      cursoCodigo: curso.codigo,
      cursoNombre: curso.nombre,
      cursoVersion: curso.version,
      puntaje: progreso.puntaje,
      totalPreguntas: curso.preguntas.length,
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
      setExito(respuesta.mensaje || "Registro guardado.");
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo registrar. Intenta otra vez.");
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return (
      <Tarjeta className="text-center">
        <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
        <h2 className="mt-3 text-xl font-semibold text-ink-900 dark:text-ink-50">Listo</h2>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{exito}</p>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <Titulo meta={`${app.id} · ${app.nombre}`}>Constancia de capacitación</Titulo>

      <CampoTexto
        etiqueta="Nombre completo"
        valor={nombre}
        alCambiar={setNombre}
        marcador="Nombre y apellidos"
      />
      <CampoTexto
        etiqueta="Cédula"
        valor={cedula}
        alCambiar={setCedula}
        modoTeclado="numeric"
        marcador="Sin puntos ni comas"
      />
      <CampoTexto
        etiqueta={config.dominio ? "Correo corporativo" : "Correo"}
        tipo="email"
        valor={correo}
        alCambiar={setCorreo}
        marcador={config.dominio ? `nombre@${config.dominio}` : "nombre@correo.com"}
        ayuda={
          config.dominio
            ? "Ahí te llega tu constancia."
            : "El corporativo si tienes; si no, el personal. Ahí te llega tu constancia."
        }
      />
      <CampoTexto
        etiqueta="Cargo / técnica que ejecutas"
        valor={cargo}
        alCambiar={setCargo}
        marcador="Ej. Inspector END nivel II — MT, PT"
      />
      <CampoTexto
        etiqueta="Área / unidad de negocio"
        valor={areaUn}
        alCambiar={setAreaUn}
        marcador="Ej. COL"
        ayuda="Lo pide el formato de asistencia F-SIG-19."
      />

      {config.exigeFirma && <FirmaPad alFirmar={setFirma} />}

      <Casilla marcada={declaracion} alCambiar={setDeclaracion}>
        Declaro que recibí y entendí la capacitación de <b>{app.nombre}</b>, y que me
        comprometo a aplicar lo indicado en ella.
      </Casilla>
      <Casilla marcada={datosOk} alCambiar={setDatosOk}>
        Autorizo el tratamiento de mis datos personales (nombre, cédula y correo) para el registro
        de capacitaciones, conforme a la Ley 1581 de 2012.
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
