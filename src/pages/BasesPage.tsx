/**
 * Pestaña Bases: todo lo que guarda la plataforma, en un solo lugar y de solo
 * lectura. La ve únicamente quien esté en `CEDULAS_ADMIN`.
 *
 * No hay ningún enlace al Sheet, a propósito y por regla del proyecto: esta
 * pantalla no puede volverse la puerta de entrada para editar o borrar las
 * bases. Para escribir se abre el Sheet a mano, sabiendo lo que se hace.
 *
 * Ocultar la pestaña no es la protección; la protección es que `/api/bases`
 * vuelve a verificar correo y cédula contra la hoja `personal` en cada
 * petición. Aquí solo se decide si se pinta.
 */

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  ClipboardList,
  Clock,
  Download,
  Lightbulb,
  RefreshCw,
  Users,
} from "lucide-react";
import { ErrorApi, obtenerBases, type Bases } from "../api/cliente";
import { useSesion } from "../lib/sesion";
import { Aviso, Boton, Cargando, Tarjeta, Titulo } from "../components/ui";

type Seccion = "resumen" | "constancias" | "inicios" | "mejoras" | "pendientes" | "personal";

const SECCIONES: { id: Seccion; texto: string; icono: typeof Users }[] = [
  { id: "resumen", texto: "Resumen", icono: ClipboardList },
  { id: "constancias", texto: "Constancias", icono: Award },
  { id: "inicios", texto: "Inicios", icono: Clock },
  { id: "mejoras", texto: "Buzón", icono: Lightbulb },
  { id: "pendientes", texto: "Faltan", icono: AlertCircle },
  { id: "personal", texto: "Personal", icono: Users },
];

export function BasesPage() {
  const { persona } = useSesion();
  const [datos, setDatos] = useState<Bases | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [seccion, setSeccion] = useState<Seccion>("resumen");
  const [filtro, setFiltro] = useState("");

  const traer = useCallback(async () => {
    if (!persona) return;
    setCargando(true);
    setError("");
    try {
      setDatos(await obtenerBases(persona.correo, persona.cedula));
    } catch (e) {
      setError(
        e instanceof ErrorApi ? e.message : "No se pudieron traer los datos. Intenta otra vez.",
      );
    } finally {
      setCargando(false);
    }
  }, [persona]);

  useEffect(() => {
    traer();
  }, [traer]);

  if (cargando && !datos) return <Cargando texto="Trayendo las bases…" />;

  if (error && !datos) {
    return (
      <Tarjeta>
        <Aviso tono="mal">{error}</Aviso>
        <Boton onClick={traer}>Reintentar</Boton>
      </Tarjeta>
    );
  }
  if (!datos) return null;

  return (
    <>
      <Tarjeta className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Titulo meta="Todo de solo lectura. Para cambiar algo se abre el Sheet a mano.">
            Bases de la plataforma
          </Titulo>
          <Boton variante="secundaria" onClick={traer} cargando={cargando}>
            <RefreshCw size={14} /> Actualizar
          </Boton>
        </div>

        <div className="-mx-1 flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {SECCIONES.map(({ id, texto, icono: Icono }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSeccion(id);
                setFiltro("");
              }}
              className={
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 " +
                "text-xs font-medium transition-colors " +
                (seccion === id
                  ? "bg-brand-600 text-white"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900")
              }
            >
              <Icono size={14} />
              {texto}
              <span className={seccion === id ? "opacity-80" : "text-ink-400"}>
                {cuantos(datos, id)}
              </span>
            </button>
          ))}
        </div>
      </Tarjeta>

      {error && <Aviso tono="mal">{error}</Aviso>}

      {seccion === "resumen" && <Resumen datos={datos} />}
      {seccion !== "resumen" && (
        <Listado datos={datos} seccion={seccion} filtro={filtro} alFiltrar={setFiltro} />
      )}
    </>
  );
}

function cuantos(d: Bases, s: Seccion): string {
  if (s === "resumen") return "";
  return String(d[s].length);
}

/* ------------------------------------------------------------------ resumen */

function Resumen({ datos }: { datos: Bases }) {
  const r = datos.resumen;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Cifra k="Personas en el listado" v={r.personas} />
        <Cifra k="Capacitadas" v={r.capacitadas} tono="bien" />
        <Cifra k="Faltan" v={r.faltan} tono="ojo" />
        <Cifra k="Constancias emitidas" v={r.constancias} />
        <Cifra k="Empezaron sin terminar" v={r.empezadasSinTerminar} tono="ojo" />
        <Cifra k="Respuestas de evaluación" v={r.respuestasEvaluacion} />
      </div>

      <Tarjeta className="mb-4">
        <h3 className="mb-1 text-lg font-semibold text-ink-900">Cobertura</h3>
        <p className="mb-4 text-sm text-ink-500">
          Operaciones es el personal que ejecuta inspecciones. Es la cifra que
          importa: contabilidad o los conductores en el denominador solo hacen
          ver peor un número que no les corresponde.
        </p>
        <Barra texto="Todo el personal" hecho={r.capacitadas} total={r.personas} />
        <Barra texto="Solo Operaciones" hecho={r.opsCapacitadas} total={r.opsPersonas} />
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-3 text-lg font-semibold text-ink-900">Por área</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs text-ink-500">
                <th className="py-2 pr-3 font-medium">Área</th>
                <th className="py-2 pr-3 text-right font-medium">Personas</th>
                <th className="py-2 pr-3 text-right font-medium">Capacitadas</th>
                <th className="py-2 text-right font-medium">Cobertura</th>
              </tr>
            </thead>
            <tbody>
              {datos.areas.map((a) => (
                <tr key={a.area} className="border-b border-ink-100">
                  <td className="py-2 pr-3 text-ink-800">{a.area}</td>
                  <td className="py-2 pr-3 text-right text-ink-600">{a.personas}</td>
                  <td className="py-2 pr-3 text-right text-ink-600">{a.capacitadas}</td>
                  <td className="py-2 text-right font-medium text-ink-800">
                    {pct(a.capacitadas, a.personas)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </>
  );
}

function Cifra({ k, v, tono }: { k: string; v: number; tono?: "bien" | "ojo" }) {
  const color =
    tono === "bien" ? "text-emerald-700" : tono === "ojo" ? "text-amber-700" : "text-ink-900";
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
      <p className={"text-2xl font-semibold " + color}>{v}</p>
      <p className="mt-0.5 text-xs text-ink-500">{k}</p>
    </div>
  );
}

function Barra({ texto, hecho, total }: { texto: string; hecho: number; total: number }) {
  const pct = total ? Math.round((hecho / total) * 100) : 0;
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-ink-700">{texto}</span>
        <span className="font-medium text-ink-800">
          {hecho} de {total} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- listados */

/** Qué columnas se ven de cada hoja, y en qué orden. */
const COLUMNAS: Record<Exclude<Seccion, "resumen">, { k: string; campo: string }[]> = {
  constancias: [
    { k: "Fecha", campo: "fecha" },
    { k: "Nombre", campo: "nombre" },
    { k: "Cédula", campo: "cedula" },
    { k: "Formato", campo: "formato" },
    { k: "Resultado", campo: "resultado" },
    { k: "Min.", campo: "minutos" },
    { k: "Código", campo: "id" },
  ],
  inicios: [
    { k: "Fecha", campo: "fecha" },
    { k: "Nombre", campo: "nombre" },
    { k: "Cédula", campo: "cedula" },
    { k: "Formato", campo: "formato" },
    { k: "¿Terminó?", campo: "termino" },
  ],
  mejoras: [
    { k: "Número", campo: "id" },
    { k: "Fecha", campo: "fecha" },
    { k: "Aplicación", campo: "aplicacion" },
    { k: "Tipo", campo: "tipo" },
    { k: "Criticidad", campo: "criticidad" },
    { k: "Estado", campo: "estado" },
    { k: "Quién reportó", campo: "nombre" },
    { k: "Descripción", campo: "descripcion" },
    { k: "Respuesta", campo: "respuesta" },
  ],
  pendientes: [
    { k: "Nombre", campo: "nombre" },
    { k: "Cédula", campo: "cedula" },
    { k: "Área", campo: "area" },
    { k: "Cargo", campo: "cargo" },
    { k: "Lugar", campo: "lugar" },
    { k: "Correo", campo: "correo" },
    { k: "¿Empezó?", campo: "empezo" },
  ],
  personal: [
    { k: "Cédula", campo: "cedula" },
    { k: "Nombre", campo: "nombre" },
    { k: "Correo", campo: "correo" },
    { k: "Cargo", campo: "cargo" },
    { k: "Área", campo: "area" },
    { k: "Lugar", campo: "lugar" },
    { k: "Capacitada", campo: "capacitada" },
  ],
};

function Listado({
  datos,
  seccion,
  filtro,
  alFiltrar,
}: {
  datos: Bases;
  seccion: Exclude<Seccion, "resumen">;
  filtro: string;
  alFiltrar: (v: string) => void;
}) {
  const columnas = COLUMNAS[seccion];
  const filas = datos[seccion] as unknown as Record<string, string | boolean>[];

  const buscado = filtro.trim().toLowerCase();
  const visibles = buscado
    ? filas.filter((f) =>
        Object.values(f).some((v) => String(v).toLowerCase().includes(buscado)),
      )
    : filas;

  return (
    <Tarjeta>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={filtro}
          onChange={(e) => alFiltrar(e.target.value)}
          placeholder="Buscar en esta tabla…"
          className="min-w-0 flex-1 rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm
                     text-ink-800 outline-none focus:border-brand-500 focus:ring-2
                     focus:ring-brand-200"
        />
        <Boton variante="secundaria" onClick={() => descargarCsv(seccion, columnas, visibles)}>
          <Download size={14} /> CSV
        </Boton>
      </div>

      <p className="mb-3 text-xs text-ink-500">
        {visibles.length === filas.length
          ? `${filas.length} registros`
          : `${visibles.length} de ${filas.length} registros`}
      </p>

      {visibles.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-500">Nada que mostrar.</p>
      ) : (
        <div className="-mx-5 overflow-x-auto sm:-mx-7">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs text-ink-500">
                {columnas.map((c) => (
                  <th key={c.campo} className="whitespace-nowrap px-3 py-2 font-medium">
                    {c.k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map((f, i) => (
                <tr key={i} className="border-b border-ink-100 align-top">
                  {columnas.map((c) => (
                    <td key={c.campo} className="px-3 py-2 text-ink-700">
                      <Celda valor={f[c.campo]} campo={c.campo} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Tarjeta>
  );
}

/** Los textos largos se recortan visualmente; el CSV los lleva completos. */
function Celda({ valor, campo }: { valor: string | boolean | undefined; campo: string }) {
  if (typeof valor === "boolean") {
    return (
      <span className={valor ? "text-emerald-700" : "text-ink-400"}>{valor ? "Sí" : "No"}</span>
    );
  }
  const texto = String(valor ?? "");
  if (!texto) return <span className="text-ink-300">—</span>;

  if (campo === "descripcion" || campo === "respuesta") {
    return (
      <span className="block max-w-xs whitespace-pre-wrap break-words" title={texto}>
        {texto}
      </span>
    );
  }
  return <span className="whitespace-nowrap">{texto}</span>;
}

/**
 * Descarga la tabla como CSV. Con BOM porque Excel en Windows abre UTF-8 sin
 * BOM como Latin-1 y las tildes salen rotas; y con `;` porque en configuración
 * regional de Colombia la coma es el separador decimal y Excel parte mal.
 */
function descargarCsv(
  nombre: string,
  columnas: { k: string; campo: string }[],
  filas: Record<string, string | boolean>[],
) {
  const escapar = (v: unknown) => {
    const t = typeof v === "boolean" ? (v ? "Sí" : "No") : String(v ?? "");
    return `"${t.replace(/"/g, '""')}"`;
  };

  const lineas = [
    columnas.map((c) => escapar(c.k)).join(";"),
    ...filas.map((f) => columnas.map((c) => escapar(f[c.campo])).join(";")),
  ];

  const blob = new Blob(["﻿" + lineas.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
