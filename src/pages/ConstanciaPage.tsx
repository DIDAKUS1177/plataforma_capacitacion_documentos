import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { CURSO } from "../contenido/curso";
import { useProgreso } from "../lib/progreso";
import { obtenerConfig, registrarConstancia, ErrorApi, type ConfigServidor } from "../api/cliente";
import { validarConstancia } from "../../shared/validacion";
import { Aviso, Boton, CampoTexto, Casilla, Tarjeta, Titulo } from "../components/ui";
import { FirmaPad } from "../components/FirmaPad";
import type { DatosConstancia } from "../../shared/tipos";

export function ConstanciaPage() {
  const progreso = useProgreso();

  const [config, setConfig] = useState<ConfigServidor>({ dominio: "", exigeFirma: false });
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [cargo, setCargo] = useState("");
  const [firma, setFirma] = useState("");
  const [declaracion, setDeclaracion] = useState(false);
  const [datos, setDatos] = useState(false);

  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");

  useEffect(() => {
    // Si falla, se queda con los valores por defecto: el servidor valida igual.
    obtenerConfig().then(setConfig).catch(() => {});
  }, []);

  if (!progreso.aprobada) return <Navigate to="/" replace />;

  async function enviar() {
    const payload: DatosConstancia = {
      nombre,
      cedula,
      correo,
      cargo,
      firma,
      aceptaDeclaracion: declaracion,
      aceptaDatos: datos,
      cursoCodigo: CURSO.codigo,
      cursoNombre: CURSO.nombre,
      cursoVersion: CURSO.version,
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
      <Titulo meta="Estos datos quedan como soporte de tu capacitación.">
        Constancia de capacitación
      </Titulo>

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
        etiqueta="Correo corporativo"
        tipo="email"
        valor={correo}
        alCambiar={setCorreo}
        marcador={config.dominio ? `nombre@${config.dominio}` : "nombre@empresa.com"}
        ayuda="Ahí te llega tu constancia."
      />
      <CampoTexto
        etiqueta="Cargo / técnica que ejecutas"
        valor={cargo}
        alCambiar={setCargo}
        marcador="Ej. Inspector END nivel II — MT, PT"
      />

      {config.exigeFirma && <FirmaPad alFirmar={setFirma} />}

      <Casilla marcada={declaracion} alCambiar={setDeclaracion}>
        Declaro que recibí y entendí la capacitación, y que me comprometo a aplicar lo indicado
        en ella.
      </Casilla>
      <Casilla marcada={datos} alCambiar={setDatos}>
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
