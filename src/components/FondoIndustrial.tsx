/**
 * El horizonte industrial que va detrás de la aplicación.
 *
 * No es una foto de banco de imágenes: es un dibujo de línea de los cinco
 * equipos que ADEMINCOL inspecciona, en el orden en que aparecen en una
 * facilidad de crudo o una refinería.
 *
 *   torre · tanque API 653 · recipiente API 510 · rack de tubería · esfera
 *
 * Pesa unos 3 KB dentro del bundle, así que no le cuesta nada a un celular con
 * mala señal en campo — que era la razón para no meter una fotografía.
 *
 * Se recorta con `slice` en vez de encogerse: en celular se ve el centro del
 * dibujo a buen tamaño, en vez de una tira aplastada e ilegible.
 */

export function FondoIndustrial({ variante = "portada" }: { variante?: "portada" | "sutil" }) {
  const portada = variante === "portada";

  return (
    <div
      aria-hidden
      className={
        "pointer-events-none select-none overflow-hidden " +
        (portada
          ? "absolute inset-x-0 bottom-0 h-44 text-ink-300 sm:h-56 lg:h-72"
          : "fixed inset-x-0 bottom-0 -z-10 h-32 text-ink-200 sm:h-44")
      }
    >
      <svg
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          {/* Se desvanece hacia arriba para que el dibujo nazca del fondo en
              vez de quedar pegado encima. */}
          <linearGradient id="fi-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="45%" stopColor="white" stopOpacity="0.75" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id="fi-mask">
            <rect x="0" y="0" width="1200" height="300" fill="url(#fi-fade)" />
          </mask>
        </defs>

        <g mask="url(#fi-mask)">
          {/* ---- Torre de destilación ------------------------------------ */}
          <path d="M90 88 A 30 15 0 0 1 150 88" />
          <path d="M90 88 V270 M150 88 V270" />
          <path d="M90 125 H150 M90 160 H150 M90 195 H150 M90 230 H150" />
          {/* Plataformas de acceso */}
          <path d="M78 118 H162 M78 190 H162" />
          <path d="M78 118 V108 M162 118 V108 M78 190 V180 M162 190 V180" />
          {/* Escalera de acceso, del suelo a la plataforma alta */}
          <path d="M152 270 V190 M164 270 V190" />
          <path d="M152 206 H164 M152 222 H164 M152 238 H164 M152 254 H164" />

          {/* ---- Tanque de almacenamiento (API 653) ---------------------- */}
          <path d="M215 270 V152 M435 270 V152" />
          <path d="M215 152 H435" />
          <path d="M215 152 L325 128 L435 152" />
          <circle cx="325" cy="124" r="5" />
          {/* Anillos rigidizadores */}
          <path d="M215 190 H435 M215 230 H435" />
          {/* Escalera helicoidal, insinuada por el lado derecho */}
          <path d="M449 268 L437 156" />
          <path d="M441 268 L429 156" />
          <path d="M443 250 L436 249 M446 224 L439 223 M448 198 L441 197" />
          {/* Boca de visita */}
          <path d="M232 270 V244 H252 V270" />

          {/* ---- Recipiente a presión horizontal (API 510) --------------- */}
          <path d="M512 176 H676 M512 236 H676" />
          <path d="M512 176 A 26 30 0 0 0 512 236" />
          <path d="M676 176 A 26 30 0 0 1 676 236" />
          {/* Boquilla superior con brida */}
          <path d="M586 176 V158 H606 V176 M580 158 H612" />
          {/* Silletas */}
          <path d="M534 236 L526 270 M566 236 L574 270 M526 270 H574" />
          <path d="M622 236 L614 270 M654 236 L662 270 M614 270 H662" />

          {/* ---- Rack de tubería ----------------------------------------- */}
          <path d="M700 142 H1000 M700 148 H1000" />
          <path d="M700 158 H1000 M700 164 H1000" />
          <path d="M700 174 H1000 M700 180 H1000" />
          <path d="M726 186 H768 M726 186 V270 M760 186 V270" />
          <path d="M864 186 H906 M864 186 V270 M898 186 V270" />
          <path d="M958 186 H1000 M958 186 V270 M992 186 V270" />

          {/* ---- Esfera de GLP ------------------------------------------- */}
          <circle cx="1082" cy="198" r="56" />
          <ellipse cx="1082" cy="198" rx="56" ry="14" />
          <path d="M1039 234 L1030 270 M1058 250 L1053 270" />
          <path d="M1125 234 L1134 270 M1106 250 L1111 270" />

          {/* ---- Suelo ---------------------------------------------------- */}
          <path d="M0 270 H1200" strokeWidth={2} />
        </g>
      </svg>
    </div>
  );
}
