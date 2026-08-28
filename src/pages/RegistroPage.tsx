/**
 * Primera pantalla: quién eres y sobre qué formato te capacitas.
 *
 * Se guarda ANTES de ver nada, en la hoja `inicios`. Así queda rastro de quien
 * empieza y no termina — que con el registro solo al final era invisible. Y de
 * paso, al llegar a la constancia ya no hay que teclear nada.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CURSO } from "../contenido/curso";
import { useProgreso } from "../lib/progreso";
import { useAplicaciones } from "../lib/aplicaciones";
import {
  buscarPersona,
  ErrorApi,
  obtenerConfig,
  registrarInicio,
  type ConfigServidor,
} from "../api/cliente";
import { validarRegistro } from "../../shared/validacion";
import { Aviso, Boton, CampoSelect, CampoTexto, Tarjeta, Titulo } from "../components/ui";
import type { DatosRegistro } from "../../shared/tipos";

const SIN_FORMATO = "Otra / no aparece en la lista";

export function RegistroPage() {
  const { registro, fijarRegistro } = useProgreso();
  const { apps, cargando, error: errorApps } = useAplicaciones();
  const ir = useNavigate();

  const [config, setConfig] = useState<ConfigServidor>({ dominio: "", exigeFirma: false });
  const [nombre, setNombre] = useState(registro?.nombre || "");
  const [cedula, setCedula] = useState(registro?.cedula || "");
  const [correo, setCorreo] = useState(registro?.correo || "");
  const [cargo, setCargo] = useState(registro?.cargo || "");
  const [areaUn, setAreaUn] = useState(registro?.areaUn || "");
  const [formato, setFormato] = useState(
    registro ? `${registro.appId} — ${registro.appNombre}` : "",
  );

  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [buscada, setBuscada] = useState<"no" | "buscando" | "si" | "sin-registro">("no");

  useEffect(() => {
    obtenerConfig()
      .then(setConfig)
      .catch(() => {});
  }, []);

  // Al escribir la cédula se llenan los datos desde el listado de personal.
  // Se espera medio segundo tras la última tecla: si no, cada dígito sería una
  // consulta, y la cuota de lectura del Sheet se comparte con los reportes.
  useEffect(() => {
    const limpia = cedula.replace(/\D/g, "");
    if (limpia.length < 6) {
      setBuscada("no");
      return;
    }

    let vigente = true;
    setBuscada("buscando");
    const espera = setTimeout(() => {
      buscarPersona(limpia)
        .then((p) => {
          if (!vigente) return;
          if (!p.encontrada) {
            setBuscada("sin-registro");
            return;
          }
          setBuscada("si");
          // No se pisa lo que la persona ya escribió a mano.
          setNombre((v) => v || p.nombre || "");
          setCorreo((v) => v || p.correo || "");
          setCargo((v) => v || p.cargo || "");
          setAreaUn((v) => v || p.area || "");
        })
        .catch(() => vigente && setBuscada("no"));
    }, 500);

    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [cedula]);

  // El desplegable muestra "APP-022 — Nombre" para que se lea solo, pero al
  // Sheet van los campos separados.
  const opciones = apps.map((a) => (a.id === "OTRA" ? SIN_FORMATO : `${a.id} — ${a.nombre}`));

  async function empezar() {
    const app = apps.find(
      (a) => (a.id === "OTRA" ? SIN_FORMATO : `${a.id} — ${a.nombre}`) === formato,
    );

    const datos: DatosRegistro = {
      nombre,
      cedula,
      correo,
      cargo,
      areaUn,
      appId: app?.id || "",
      appNombre: app?.nombre || "",
      tecnica: app?.tecnica || "",
      cursoCodigo: CURSO.codigo,
      cursoVersion: CURSO.version,
    };

    const problema = validarRegistro(datos, config.dominio);
    if (problema) {
      setError(problema);
      return;
    }

    setError("");
    setEnviando(true);
    try {
      await registrarInicio(datos);
      fijarRegistro(datos);
      ir("/capacitacion/diapositivas");
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo registrar. Intenta otra vez.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Tarjeta className="mb-4">
        <Titulo meta={`${CURSO.codigo} · material v${CURSO.version} · ${CURSO.fechaVersion}`}>
          {CURSO.nombre}
        </Titulo>
        <div
          className="prosa text-ink-700"
          dangerouslySetInnerHTML={{ __html: CURSO.intro }}
        />
      </Tarjeta>

      <Tarjeta>
        <Titulo meta="Queda registrado desde ya, antes de empezar.">Tus datos</Titulo>

        {errorApps && <Aviso tono="mal">{errorApps}</Aviso>}

        <CampoTexto
          etiqueta="Cédula"
          valor={cedula}
          alCambiar={setCedula}
          modoTeclado="numeric"
          marcador="Sin puntos ni comas"
          ayuda={
            buscada === "buscando"
              ? "Buscándote en el listado de personal…"
              : buscada === "si"
                ? "Te encontramos: revisa que los datos estén bien."
                : buscada === "sin-registro"
                  ? "No apareces en el listado. Llena los datos a mano y sigue: no hay problema."
                  : "Con ella se llenan solos los demás campos."
          }
        />
        <CampoTexto
          etiqueta="Nombre completo"
          valor={nombre}
          alCambiar={setNombre}
          marcador="Nombre y apellidos"
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
          etiqueta="Cargo"
          valor={cargo}
          alCambiar={setCargo}
          marcador="Ej. Inspector END nivel II"
        />
        <CampoTexto
          etiqueta="Área / unidad de negocio"
          valor={areaUn}
          alCambiar={setAreaUn}
          marcador="Ej. COL"
          ayuda="Lo pide el formato de asistencia F-SIG-19."
        />
        <CampoSelect
          etiqueta="Formato sobre el que te capacitas"
          valor={formato}
          alCambiar={setFormato}
          opciones={opciones}
          vacio={cargando ? "Cargando…" : "Selecciona…"}
          ayuda="El contenido es el mismo para todos; esto queda en tu constancia."
        />

        {error && <Aviso tono="mal">{error}</Aviso>}

        <div className="mt-4">
          <Boton onClick={empezar} cargando={enviando}>
            Empezar la capacitación
          </Boton>
        </div>
      </Tarjeta>
    </>
  );
}
