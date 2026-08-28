/**
 * Lo primero que se ve: el correo y la cédula.
 *
 * El correo es el usuario y la cédula la clave. Con eso la plataforma trae del
 * listado de personal el nombre, el cargo y el área, y por eso el registro que
 * viene después dejó de pedir cinco campos: solo queda escoger el formato.
 *
 * Ya no hay pantalla de "¿eres tú?". Existía porque con la cédula sola un
 * dígito mal tecleado caía en la de otro compañero y la constancia salía a
 * nombre ajeno. Pidiendo las dos cosas, un dígito mal tecleado simplemente no
 * entra, así que el paso sobra.
 *
 * Quien no esté en el listado entra sin registro y llena los datos a mano. Un
 * contratista que llega hoy tiene que poder capacitarse hoy.
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { entrarConCedula, ErrorApi } from "../api/cliente";
import { validarCorreo } from "../../shared/validacion";
import { useSesion } from "../lib/sesion";
import { Aviso, Boton, CampoTexto, Tarjeta } from "../components/ui";
import { FondoIndustrial } from "../components/FondoIndustrial";
import logo from "../assets/logo-demincol.png";

export function EntrarPage() {
  const { entrar, entrarSinRegistro } = useSesion();
  const ir = useNavigate();
  const ubicacion = useLocation();

  // A dónde iba la persona antes de que la mandáramos a identificarse.
  const destino = (ubicacion.state as { desde?: string } | null)?.desde || "/capacitacion";

  const [correo, setCorreo] = useState("");
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function intentar() {
    const limpia = cedula.replace(/\D/g, "");

    if (!validarCorreo(correo.trim())) {
      setError("Escribe tu correo completo, como aparece en Talento Humano.");
      return;
    }
    if (limpia.length < 6) {
      setError("Escribe tu cédula completa, sin puntos ni comas.");
      return;
    }

    setError("");
    setEntrando(true);
    try {
      const p = await entrarConCedula(correo.trim(), limpia);
      if (!p.encontrada) {
        setError(p.mensaje || "El correo y la cédula no coinciden.");
        return;
      }
      entrar(p.cedula || limpia, p);
      ir(destino, { replace: true });
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo entrar. Intenta otra vez.");
    } finally {
      setEntrando(false);
    }
  }

  function seguirSinRegistro() {
    entrarSinRegistro();
    ir(destino, { replace: true });
  }

  return (
    <div className="relative flex min-h-full flex-col">
      <FondoIndustrial />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="Demincol" className="h-14 w-auto" />
          <h1 className="mt-4 text-2xl font-semibold text-ink-900">
            Capacitación de inspectores
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Formación, constancias y buzón de mejoras
          </p>
        </div>

        <Tarjeta>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              intentar();
            }}
          >
            <CampoTexto
              etiqueta="Correo"
              tipo="email"
              valor={correo}
              alCambiar={setCorreo}
              marcador="nombre@ademincol.com.co"
              autoCompletar="username"
              ayuda="El que tienes registrado en Talento Humano."
            />
            <CampoTexto
              etiqueta="Cédula"
              valor={cedula}
              alCambiar={setCedula}
              tipo="password"
              modoTeclado="numeric"
              marcador="Sin puntos ni comas"
              autoCompletar="current-password"
            />

            {error && <Aviso tono="mal">{error}</Aviso>}

            <div className="mt-4">
              <Boton tipo="submit" cargando={entrando}>
                <LogIn size={15} /> Entrar
              </Boton>
            </div>

            <button
              type="button"
              onClick={seguirSinRegistro}
              className="mt-4 text-xs text-ink-500 underline underline-offset-2
                         hover:text-ink-800"
            >
              No aparezco en el listado
            </button>
          </form>
        </Tarjeta>

        <p className="mt-6 text-center text-xs text-ink-400">
          ADEMINCOL S.A.S.
          <span className="mt-0.5 block">Área de desarrollo</span>
        </p>
      </div>
    </div>
  );
}
