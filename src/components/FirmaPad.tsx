/**
 * Firma dibujada con el dedo. Solo se muestra si el servidor la exige
 * (EXIGE_FIRMA=true); por defecto basta la casilla de aceptación.
 *
 * Usa eventos de puntero para que funcione igual con dedo, lápiz y mouse.
 */

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";

export function FirmaPad({ alFirmar }: { alFirmar: (dataUrl: string) => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [vacio, setVacio] = useState(true);

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    // Se dibuja a la resolución real del dispositivo o la firma sale pixelada
    // en celulares con pantalla densa.
    const escala = window.devicePixelRatio || 1;
    const ancho = canvas.clientWidth;
    const alto = canvas.clientHeight;
    canvas.width = ancho * escala;
    canvas.height = alto * escala;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(escala, escala);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - caja.left, y: e.clientY - caja.top };
  }

  function iniciar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = lienzo.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = punto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    dibujando.current = true;
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    const ctx = lienzo.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = punto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (vacio) setVacio(false);
  }

  function terminar() {
    if (!dibujando.current) return;
    dibujando.current = false;
    const canvas = lienzo.current;
    if (canvas) alFirmar(canvas.toDataURL("image/png"));
  }

  function borrar() {
    const canvas = lienzo.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setVacio(true);
    alFirmar("");
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">Tu firma</span>
        <button
          type="button"
          onClick={borrar}
          className="flex items-center gap-1 text-xs text-ink-500 hover:text-brand-600
                     dark:text-ink-400"
        >
          <Eraser size={13} /> Borrar
        </button>
      </div>
      <canvas
        ref={lienzo}
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerLeave={terminar}
        className="h-40 w-full touch-none rounded-lg border border-dashed border-ink-300
                   bg-white dark:border-ink-600"
      />
      {vacio && (
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
          Firma con el dedo dentro del recuadro.
        </p>
      )}
    </div>
  );
}
