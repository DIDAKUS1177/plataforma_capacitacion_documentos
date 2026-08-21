/**
 * CONTENIDO DEL CURSO — este es el único archivo que hay que editar para
 * cambiar la capacitación. Ni las páginas ni las funciones se tocan.
 *
 * Al cambiar el contenido, SUBE `version`: queda escrita en cada constancia,
 * así se sabe quién se capacitó con cuál material.
 */

export interface Modulo {
  id: string;
  titulo: string;
  minutos: number;
  /** HTML. Se renderiza dentro de .prosa (ver index.css). */
  html: string;
}

export interface Pregunta {
  enunciado: string;
  opciones: string[];
  /** Índice de la opción correcta, empezando en 0. */
  correcta: number;
}

export interface Curso {
  codigo: string;
  nombre: string;
  version: string;
  fechaVersion: string;
  intro: string;
  modulos: Modulo[];
  minimoAprobado: number;
  preguntas: Pregunta[];
}

export const CURSO: Curso = {
  codigo: "CAP-GEN-01",
  nombre: "Inducción a la plataforma ADEMINCOL",
  version: "1.0",
  fechaVersion: "2026-08-21",

  intro: `
    <p>Esta inducción cubre cómo se captura la información en campo y qué pasa
    con ella después. Toma unos <b>20 minutos</b>.</p>
    <p>Al final hay una evaluación corta de 5 preguntas. Cuando la apruebes se
    habilita la constancia: registras tus datos, aceptas que recibiste la
    capacitación y te llega el soporte a tu correo.</p>
    <div class="ojo"><b>Ojo:</b> tienes que abrir todos los módulos antes de que
    se habilite la evaluación.</div>`,

  modulos: [
    // -----------------------------------------------------------------------
    // PENDIENTE: reemplazar con el contenido del manual y del PPT.
    // El reparto busca que ningún módulo pase de 5-6 minutos.
    // -----------------------------------------------------------------------
    {
      id: "m1",
      titulo: "Qué hace la plataforma",
      minutos: 4,
      html: `
        <p class="pendiente">PENDIENTE — contenido del manual.</p>
        <p>Idea: de dónde sale y a dónde va la información. El inspector captura
        en la app → los datos caen a la base → la plataforma arma el informe
        final en Excel y PDF → se entrega al cliente.</p>
        <div class="ojo">El mensaje que conviene dejar claro desde el primer
        módulo: <b>lo que se escribe en la app es exactamente lo que sale en el
        informe que firma el cliente.</b> No hay nadie transcribiendo en el
        medio.</div>`,
    },
    {
      id: "m2",
      titulo: "Cómo se usa la app en campo",
      minutos: 5,
      html: `
        <p class="pendiente">PENDIENTE — contenido del manual / diapositivas.</p>
        <p>Idea: abrir la app, seleccionar la orden de trabajo, crear el
        registro, guardar, y qué hacer cuando no hay señal (la app guarda y
        sincroniza sola; no hay que volver a crear el registro).</p>`,
    },
    {
      id: "m3",
      titulo: "Fotos y evidencias",
      minutos: 4,
      html: `
        <p class="pendiente">PENDIENTE — completar con los criterios propios.</p>
        <ul>
          <li>Toda foto lleva <b>descripción</b>. Una foto sin descripción sale
          en el informe con el espacio vacío.</li>
          <li>Encuadre: que se vea el componente y la referencia de ubicación.</li>
          <li>Numerar en el orden en que se quiere que salgan.</li>
        </ul>`,
    },
    {
      id: "m4",
      titulo: "Errores frecuentes (y por qué importan)",
      minutos: 5,
      // Este módulo sí está escrito: son los problemas reales que se ven en los
      // datos. Ajústalo si algún ejemplo no aplica.
      html: `
        <p>Estos cuatro son los que más trabajo cuestan corregir después:</p>
        <table>
          <tr><th>Error</th><th>Qué pasa después</th></tr>
          <tr>
            <td>Escribir el nombre distinto cada vez (con tilde, sin tilde, solo iniciales)</td>
            <td>El sistema no reconoce a la persona y no puede validar su
            certificado. Hay que corregirlo a mano.</td>
          </tr>
          <tr>
            <td>Fechas escritas a mano en formatos distintos</td>
            <td>La fecha llega vacía al informe o sale cambiada de mes.</td>
          </tr>
          <tr>
            <td>Fotos sin descripción</td>
            <td>Salen en el informe sin texto debajo.</td>
          </tr>
          <tr>
            <td>Crear el registro dos veces porque "no se guardó"</td>
            <td>Quedan dos informes del mismo componente y hay que borrar uno.</td>
          </tr>
        </table>
        <div class="ojo">Si algo no te deja guardar, <b>no crees el registro de
        nuevo</b>: repórtalo desde “Reportar” en el menú de arriba.</div>`,
    },
  ],

  minimoAprobado: 4,

  // BORRADOR — ajustar cuando llegue el material definitivo.
  preguntas: [
    {
      enunciado: "Lo que el inspector escribe en la app...",
      opciones: [
        "Lo revisa y transcribe alguien en oficina antes del informe",
        "Sale tal cual en el informe final que se entrega al cliente",
        "Solo sirve de borrador interno",
      ],
      correcta: 1,
    },
    {
      enunciado: "Estás en campo sin señal y guardas un registro. ¿Qué haces?",
      opciones: [
        "Lo vuelvo a crear cuando llegue la señal",
        "Sigo trabajando: la app sincroniza sola cuando haya señal",
        "Lo anoto en papel y lo paso después",
      ],
      correcta: 1,
    },
    {
      enunciado: "¿Qué debe llevar siempre una foto cargada a la app?",
      opciones: ["Su descripción", "Nada, con la foto basta", "El nombre del cliente en el pie"],
      correcta: 0,
    },
    {
      enunciado: "¿Por qué importa escribir siempre igual el nombre del inspector?",
      opciones: [
        "Por estética del informe",
        "Porque si no, el sistema no lo reconoce y no valida su certificado",
        "No importa, el sistema lo corrige solo",
      ],
      correcta: 1,
    },
    {
      enunciado: "Encuentras una falla en una de las apps. ¿Cuál es el camino correcto?",
      opciones: [
        "Reportarla en “Reportar” para que quede registrada",
        "Comentarlo de palabra cuando haya oportunidad",
        "Trabajar alrededor del problema sin decir nada",
      ],
      correcta: 0,
    },
  ],
};

/** Tipos del buzón de mejoras. */
export const TIPOS_MEJORA = [
  "Falla de la aplicación",
  "Error en el formato o en el informe",
  "Sugerencia de mejora",
  "Duda de criterio técnico",
  "Falta de recurso o equipo",
  "Reconocimiento",
];

export const CRITICIDADES = [
  "Me bloquea el trabajo",
  "Me estorba, pero puedo seguir",
  "Es una idea para más adelante",
];
