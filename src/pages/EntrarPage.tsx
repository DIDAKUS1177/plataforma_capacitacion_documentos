/**
 * Lo primero que se ve: la cédula.
 *
 * Con eso se busca en el listado de personal y la plataforma ya sabe nombre,
 * correo, cargo y área. Por eso el registro que viene después dejó de pedir
 * cinco campos: solo queda escoger el formato.
 *
 * Hay una confirmación intermedia —"¿eres tú?"— y no es adorno. Un dígito mal
 * tecleado cae en la cédula de otro compañero, y sin ese paso la constancia
 * saldría a nombre ajeno sin que nadie se diera cuenta.
 *
 * Quien no esté en el listado entra igual, sin registro, y llena los datos a
 * mano. Un contratista que llega hoy tiene que poder capacitarse hoy.
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LogIn } from "lucide-react";
import { buscarPersona, ErrorApi, type Persona } from "../api/cliente";
import { useSesion } from "../lib/sesion";
import { Aviso, Boton, CampoTexto, Tarjeta } from "../components/ui";
import logo from "../assets/logo-demincol.png";

export function EntrarPage() {
  const { entrar, entrarSinRegistro } = useSesion();
  const ir = useNavigate();
  const ubicacion = useLocation();

  // A dónde iba la persona antes de que la mandáramos a identificarse.
  const destino = (ubicacion.state as { desde?: string } | null)?.desde || "/capacitacion";

  const [cedula, setCedula] = useState("");
  const [hallada, setHallada] = useState<Persona | null>(null);
  const [sinRegistro, setSinRegistro] = useState(false);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    const limpia = cedula.replace(/\D/g, "");
    if (limpia.length < 6) {
      setError("Escribe tu cédula completa, sin puntos ni comas.");
      return;
    }

    setError("");
    setSinRegistro(false);
    setBuscando(true);
    try {
      const p = await buscarPersona(limpia);
      if (p.encontrada) setHallada(p);
      else setSinRegistro(true);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo consultar. Intenta otra vez.");
    } finally {
      setBuscando(false);
    }
  }

  function confirmar() {
    if (!hallada) return;
    entrar(cedula, hallada);
    ir(destino, { replace: true });
  }

  function seguirSinRegistro() {
    entrarSinRegistro();
    ir(destino, { replace: true });
  }

  function volver() {
    setHallada(null);
    setSinRegistro(false);
    setCedula("");
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <img src={logo} alt="Demincol" className="h-14 w-auto" />
        <h1 className="mt-4 text-2xl font-semibold text-ink-900">
          Capacitación de inspectores
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Formación, constancias y buzón de mejoras
        </p>
      </div>

      {hallada ? (
        <Tarjeta>
          <p className="text-sm text-ink-500">¿Eres tú?</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{hallada.nombre}</p>
          <dl className="mt-3 divide-y divide-ink-200 rounded-lg border border-ink-200">
            <Fila k="Cédula" v={cedula.replace(/\D/g, "")} />
            {hallada.cargo && <Fila k="Cargo" v={hallada.cargo} />}
            {hallada.area && <Fila k="Área" v={hallada.area} />}
            {hallada.correo && <Fila k="Correo" v={hallada.correo} />}
          </dl>
          <p className="mt-3 text-xs text-ink-500">
            Tu constancia llega a ese correo. Si algo está desactualizado, avísale
            a Talento Humano y sigue: el dato se corrige en el listado, no aquí.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Boton onClick={confirmar}>
              Sí, soy yo <ArrowRight size={15} />
            </Boton>
            <Boton variante="secundaria" onClick={volver}>
              No soy yo
            </Boton>
          </div>
        </Tarjeta>
      ) : (
        <Tarjeta>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              buscar();
            }}
          >
            <CampoTexto
              etiqueta="Tu cédula"
              valor={cedula}
              alCambiar={(v) => {
                setCedula(v);
                setSinRegistro(false);
              }}
              modoTeclado="numeric"
              marcador="Sin puntos ni comas"
              ayuda="Con ella traemos tus datos del listado de personal."
            />

            {error && <Aviso tono="mal">{error}</Aviso>}

            {sinRegistro && (
              <Aviso tono="mal">
                No apareces en el listado de personal. Puede ser que seas nuevo o
                que estés contratado por otra empresa. Puedes entrar igual y
                escribir tus datos a mano.
              </Aviso>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Boton tipo="submit" cargando={buscando}>
                <LogIn size={15} /> Entrar
              </Boton>
              {sinRegistro && (
                <Boton variante="secundaria" onClick={seguirSinRegistro}>
                  Entrar sin registro
                </Boton>
              )}
            </div>

            {!sinRegistro && (
              <button
                type="button"
                onClick={seguirSinRegistro}
                className="mt-4 text-xs text-ink-500 underline underline-offset-2
                           hover:text-ink-800"
              >
                No aparezco en el listado
              </button>
            )}
          </form>
        </Tarjeta>
      )}

      <p className="mt-6 text-center text-xs text-ink-400">ADEMINCOL S.A.S.</p>
    </div>
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
