/**
 * Primer paso de la capacitación: sobre qué formato te capacitas.
 *
 * Quien entró con su cédula ya trae nombre, correo, cargo y área desde el
 * listado de personal, así que aquí no se le vuelven a pedir: se le muestran
 * para que los confirme de un vistazo y solo escoge el formato.
 *
 * Quien entró sin registro sí ve el formulario completo. Es el mismo de antes.
 *
 * En los dos casos se guarda ANTES de ver nada, en la hoja `inicios`. Así queda
 * rastro de quien empieza y no termina, que con el registro solo al final era
 * invisible.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CURSO } from "../contenido/curso";
import { useProgreso } from "../lib/progreso";
import { useAplicaciones } from "../lib/aplicaciones";
import { useSesion } from "../lib/sesion";
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
  const { persona } = useSesion();
  const ir = useNavigate();

  const [config, setConfig] = useState<ConfigServidor>({ dominio: "", exigeFirma: false });
  const [nombre, setNombre] = useState(registro?.nombre || persona?.nombre || "");
  const [cedula, setCedula] = useState(registro?.cedula || persona?.cedula || "");
  const [correo, setCorreo] = useState(registro?.correo || persona?.correo || "");
  const [cargo, setCargo] = useState(registro?.cargo || persona?.cargo || "");
  const [areaUn, setAreaUn] = useState(registro?.areaUn || persona?.area || "");
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

  // Solo en el formulario a mano. Al escribir la cédula se llenan los datos
  // desde el listado de personal. Se espera medio segundo tras la última tecla:
  // si no, cada dígito sería una consulta, y la cuota de lectura del Sheet se
  // comparte con los reportes.
  useEffect(() => {
    if (persona) return;

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
  }, [cedula, persona]);

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

  const selectorFormato = (
    <CampoSelect
      etiqueta="Formato sobre el que te capacitas"
      valor={formato}
      alCambiar={setFormato}
      opciones={opciones}
      vacio={cargando ? "Cargando…" : "Selecciona…"}
      ayuda="El contenido es el mismo para todos; esto queda en tu constancia."
    />
  );

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
        {persona ? (
          <>
            <Titulo meta="Queda registrado desde ya, antes de empezar.">
              Escoge el formato
            </Titulo>

            {errorApps && <Aviso tono="mal">{errorApps}</Aviso>}

            <dl className="mb-5 divide-y divide-ink-200 rounded-lg border border-ink-200">
              <Fila k="Nombre" v={persona.nombre} />
              <Fila k="Cédula" v={persona.cedula} />
              {persona.cargo && <Fila k="Cargo" v={persona.cargo} />}
              {persona.area && <Fila k="Área" v={persona.area} />}
              <Fila k="Correo" v={persona.correo} />
            </dl>

            {selectorFormato}
          </>
        ) : (
          <>
            <Titulo meta="No apareces en el listado de personal, así que estos datos los escribes tú.">
              Tus datos
            </Titulo>

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
            {selectorFormato}
          </>
        )}

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

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="px-3 py-2 sm:flex sm:gap-3">
      <dt className="text-xs text-ink-500 sm:w-20 sm:shrink-0 sm:text-sm">{k}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink-800">{v}</dd>
    </div>
  );
}
