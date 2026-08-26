/**
 * Visor de material: muestra una página a la vez de un documento convertido a
 * imágenes (ver `scripts/generar_imagenes.py`).
 *
 * Se eligió imágenes y no un PDF embebido porque en el navegador del celular el
 * visor de PDF a veces no renderiza y termina descargando el archivo — justo lo
 * que no queremos en campo.
 *
 * Solo se cargan la página actual y sus vecinas: el manual completo son 19
 * páginas y no tiene sentido bajarlas todas de entrada.
 */

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Boton } from "./ui";

interface Props {
  /** Carpeta dentro de /material, ej. "diapositivas". */
  carpeta: string;
  paginas: number;
  /** Se llama cuando llega a la última página. */
  alTerminar: () => void;
  /** Texto del botón que continúa al siguiente paso. */
  textoSiguiente: string;
  alSiguiente: () => void;
  /** Archivo original, para quien prefiera descargarlo. */
  descarga?: { href: string; texto: string };
}

export function Visor({
  carpeta,
  paginas,
  alTerminar,
  textoSiguiente,
  alSiguiente,
  descarga,
}: Props) {
  const [actual, setActual] = useState(1);
  const ultima = actual >= paginas;

  useEffect(() => {
    if (ultima) alTerminar();
  }, [ultima, alTerminar]);

  // Las flechas del teclado sirven cuando se proyecta en sala.
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setActual((n) => Math.min(paginas, n + 1));
      if (e.key === "ArrowLeft") setActual((n) => Math.max(1, n - 1));
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [paginas]);

  const ruta = (n: number) => `/material/${carpeta}/${String(n).padStart(2, "0")}.jpg`;
  const vecinas = [actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= paginas);

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-xl border border-ink-200 bg-white"
      >
        {vecinas.map((n) => (
          <img
            key={n}
            src={ruta(n)}
            alt={`Página ${n} de ${paginas}`}
            loading={n === actual ? "eager" : "lazy"}
            className={"w-full " + (n === actual ? "block" : "hidden")}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          onClick={() => setActual((n) => Math.max(1, n - 1))}
          disabled={actual === 1}
          aria-label="Anterior"
          className="flex items-center gap-1 rounded-lg border border-ink-300 px-3 py-2 text-sm
                     text-ink-700 transition hover:bg-ink-100 disabled:opacity-40:bg-ink-700"
        >
          <ChevronLeft size={16} /> Anterior
        </button>

        <span className="text-sm font-semibold text-ink-600">
          {actual} / {paginas}
        </span>

        <button
          onClick={() => setActual((n) => Math.min(paginas, n + 1))}
          disabled={ultima}
          aria-label="Siguiente"
          className="flex items-center gap-1 rounded-lg border border-ink-300 px-3 py-2 text-sm
                     text-ink-700 transition hover:bg-ink-100 disabled:opacity-40:bg-ink-700"
        >
          Siguiente <ChevronRight size={16} />
        </button>
      </div>

      {/* Barra de avance dentro del documento. */}
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-200"
          style={{ width: `${(actual / paginas) * 100}%` }}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Boton onClick={alSiguiente} deshabilitado={!ultima}>
          {ultima ? textoSiguiente : `Llega a la página ${paginas} para continuar`}
        </Boton>
        {descarga && (
          <a
            href={descarga.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
          >
            <Download size={15} /> {descarga.texto}
          </a>
        )}
      </div>
    </div>
  );
}
