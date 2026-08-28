/**
 * "Mis cursos": qué capacitaciones lleva una persona.
 *
 * Si entró con su cédula, la lista se carga sola: no tiene sentido volver a
 * pedirle el dato con el que acaba de entrar. Queda un enlace para consultar
 * otra cédula, que es lo que hace un supervisor revisando a su cuadrilla.
 *
 * Se entra con la cédula sola. Como la cédula no es un secreto, esta pantalla
 * muestra ÚNICAMENTE formación: curso, formato, fecha y resultado. Ni correo,
 * ni cargo, ni teléfono. Quien consulte una cédula ajena ve qué cursos hizo esa
 * persona, no cómo contactarla.
 */

import { useCallback, useEffect, useState } from "react";
import { Award, Clock, Search } from "lucide-react";
import { ErrorApi, obtenerHistorial, type Historial } from "../api/cliente";
import { useSesion } from "../lib/sesion";
import { Aviso, Boton, Cargando, CampoTexto, Tarjeta, Titulo } from "../components/ui";

export function HistorialPage() {
  const { persona } = useSesion();

  const [cedula, setCedula] = useState(persona?.cedula || "");
  const [datos, setDatos] = useState<Historial | null>(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);
  // Con sesión el formulario arranca escondido; se abre para mirar a otro.
  const [abierto, setAbierto] = useState(!persona);

  const buscar = useCallback(async (ced: string) => {
    setError("");
    setDatos(null);
    setBuscando(true);
    try {
      setDatos(await obtenerHistorial(ced));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo consultar. Intenta otra vez.");
    } finally {
      setBuscando(false);
    }
  }, []);

  // Con sesión no hay nada que preguntar: se carga de entrada.
  useEffect(() => {
    if (persona) buscar(persona.cedula);
  }, [persona, buscar]);

  if (persona && !abierto) {
    return (
      <>
        {buscando && <Cargando texto="Buscando tus capacitaciones…" />}
        {error && (
          <Tarjeta className="mb-4">
            <Aviso tono="mal">{error}</Aviso>
            <Boton onClick={() => buscar(persona.cedula)}>Reintentar</Boton>
          </Tarjeta>
        )}
        {datos && <Resultado datos={datos} />}

        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-4 text-xs text-ink-500 underline underline-offset-2 hover:text-ink-800"
        >
          Consultar otra cédula
        </button>
      </>
    );
  }

  return (
    <>
      <Tarjeta className="mb-4">
        <Titulo meta="Escribe la cédula para ver qué ha hecho y qué le falta.">
          Mis capacitaciones
        </Titulo>

        <CampoTexto
          etiqueta="Cédula"
          valor={cedula}
          alCambiar={setCedula}
          modoTeclado="numeric"
          marcador="Sin puntos ni comas"
        />

        {error && <Aviso tono="mal">{error}</Aviso>}

        <div className="mt-4">
          <Boton onClick={() => buscar(cedula)} cargando={buscando}>
            <Search size={15} /> Consultar
          </Boton>
        </div>
      </Tarjeta>

      {datos && <Resultado datos={datos} />}
    </>
  );
}

function Resultado({ datos }: { datos: Historial }) {
  if (!datos.encontrada) {
    return (
      <Tarjeta>
        <p className="text-sm text-ink-600">
          No encontramos esa cédula, ni en el listado de personal ni en las
          capacitaciones hechas. Si acabas de entrar a la empresa es normal:
          puedes hacer la capacitación de una, en la pestaña Capacitación.
        </p>
      </Tarjeta>
    );
  }

  return (
    <>
      {datos.nombre && (
        <p className="mb-4 px-1 text-sm text-ink-500">{datos.nombre}</p>
      )}

      <Tarjeta className="mb-4">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink-900">
          <Award size={18} className="text-emerald-600" />
          Terminadas ({datos.hechas.length})
        </h3>

        {datos.hechas.length === 0 ? (
          <p className="text-sm text-ink-600">
            Todavía ninguna. La primera se hace desde la pestaña Capacitación.
          </p>
        ) : (
          <ul className="divide-y divide-ink-200">
            {datos.hechas.map((c) => (
              <li key={c.id || c.fecha} className="py-3">
                <p className="text-sm font-semibold text-ink-800">{c.formato || c.curso}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {c.fecha} · {c.resultado} · material v{c.version}
                </p>
                {c.id && (
                  <a
                    href={`/verificar/${c.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-brand-600 hover:underline"
                  >
                    Ver la constancia
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      {datos.aMedias.length > 0 && (
        <Tarjeta>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink-900">
            <Clock size={18} className="text-amber-600" />
            Empezadas sin terminar ({datos.aMedias.length})
          </h3>
          <ul className="divide-y divide-ink-200">
            {datos.aMedias.map((c, i) => (
              <li key={i} className="py-3">
                <p className="text-sm font-semibold text-ink-800">{c.formato}</p>
                <p className="mt-0.5 text-xs text-ink-500">Empezada el {c.fecha}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-600">
            Se retoman desde el principio, en la pestaña Capacitación.
          </p>
        </Tarjeta>
      )}
    </>
  );
}
