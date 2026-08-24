/**
 * CONTENIDO DEL CURSO — este es el único archivo que hay que editar para
 * cambiar la capacitación. Ni las páginas ni las funciones se tocan.
 *
 * Fuente: `material/IT-OPE-C-12_instructivo_generacion_automatica_reportes_rev01.pdf`
 * (rev. 01, aprobado 09-04-2026) y la presentación de las sesiones. Cada módulo
 * cita el numeral del instructivo del que sale, para que una auditoría pueda
 * rastrearlo y para saber qué hay que revisar cuando el instructivo cambie.
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

/**
 * Tronco común: lo que se le enseña a todo inspector, sin importar la
 * aplicación. Cada capacitación son estos módulos + los propios de su app
 * (ver MODULOS_POR_APP más abajo).
 */
export const CURSO_BASE: Curso = {
  codigo: "CAP-GEN-01",
  nombre: "Proceso de inspección y generación automática de reportes",
  version: "2.0",
  fechaVersion: "2026-08-24",

  intro: `
    <p>Esta capacitación cubre el proceso completo: desde que te asignan la
    inspección hasta que sale el reporte que se le entrega al cliente. Está
    basada en el instructivo <b>IT-OPE-C-12</b> (rev. 01).</p>
    <p>Toma unos <b>30 minutos</b>. Al final hay una evaluación corta; cuando la
    apruebes se habilita tu constancia y queda el registro de asistencia.</p>
    <div class="ojo"><b>Ojo:</b> tienes que abrir todos los módulos antes de que
    se habilite la evaluación.</div>`,

  modulos: [
    {
      id: "m1",
      titulo: "Para qué existe este proceso",
      minutos: 3,
      html: `
        <p>Antes, cada inspección se registraba en papel o en un archivo suelto y
        alguien la transcribía después. Ahora la información que capturas en la
        aplicación <b>es</b> el informe.</p>

        <div class="ojo"><b>La idea que hay que llevarse de este módulo:</b> lo
        que escribes en la app sale tal cual en el reporte que firma la empresa y
        recibe el cliente. <b>No hay nadie transcribiendo en el medio.</b></div>

        <p>El instructivo lo plantea con tres pilares:</p>
        <table>
          <tr><th>Pilar</th><th>Qué significa en tu día</th></tr>
          <tr>
            <td><b>Calidad de los datos</b></td>
            <td>Precisión, que se entienda, que cumpla y que esté escrito
            siempre igual.</td>
          </tr>
          <tr>
            <td><b>Integridad de la información</b></td>
            <td>Se usan <b>solo</b> las aplicaciones internas. Nada de llevar los
            datos por fuera y volverlos a montar.</td>
          </tr>
          <tr>
            <td><b>Trazabilidad completa</b></td>
            <td>Se puede seguir el rastro desde lo que tú capturaste hasta el
            reporte entregado y el histórico.</td>
          </tr>
        </table>

        <p>Y lo que se busca ganar: <b>menos reprocesos</b> (no volver a pedir
        datos que faltaron), <b>menos tiempo</b> de ciclo, y
        <b>responsabilidades claras</b> sobre quién responde por qué.</p>

        <p class="fuente">IT-OPE-C-12, numerales 1 y 2.</p>`,
    },

    {
      id: "m2",
      titulo: "Quién hace qué",
      minutos: 4,
      html: `
        <p>El proceso se mueve entre tres roles. Saber dónde termina el tuyo y
        empieza el del otro es lo que evita que las cosas se queden quietas.</p>

        <table>
          <tr><th>Rol</th><th>De qué responde</th><th>Qué entrega</th></tr>
          <tr>
            <td><b>Supervisor / Coordinador</b></td>
            <td>Recibe y prioriza el requerimiento, verifica los documentos
            soporte, hace seguimiento en los visualizadores y valida al final.</td>
            <td>La orden de inspección y el <b>sello de aprobación</b> que
            desbloquea la generación del reporte.</td>
          </tr>
          <tr>
            <td><b>Área de Desarrollo</b></td>
            <td>Crea y mantiene las aplicaciones y los formatos, valida que los
            datos lleguen consistentes y sostiene la infraestructura.</td>
            <td>La app funcionando, y el <b>reporte final</b> generado.</td>
          </tr>
          <tr>
            <td><b>Inspector</b></td>
            <td>Ejecuta en campo, captura los datos y la evidencia, confirma que
            se sincronizaron y corrige lo que esté mal.</td>
            <td>El formulario completo, veraz y sincronizado.</td>
          </tr>
        </table>

        <p>Tu rol tiene cuatro responsabilidades, y las cuatro pesan igual:</p>
        <ul>
          <li><b>Ejecución en campo</b> — aplicar el formato y capturar la
          evidencia.</li>
          <li><b>Manejo de la herramienta</b> — operar bien la app y el
          dispositivo, incluida la geolocalización y la hora.</li>
          <li><b>Sincronización</b> — asegurar que lo capturado llegó al
          servidor. El instructivo la llama una responsabilidad
          <b>indelegable</b>.</li>
          <li><b>Corrección de inconsistencias</b> — detectar y arreglar los
          errores <i>antes</i> de cerrar la jornada.</li>
        </ul>

        <p class="fuente">IT-OPE-C-12, numeral 3.</p>`,
    },

    {
      id: "m3",
      titulo: "Antes de empezar",
      minutos: 2,
      html: `
        <p>Tres chequeos de un minuto que evitan perder una jornada entera:</p>

        <table>
          <tr><th>Revisa</th><th>Si algo no está</th></tr>
          <tr>
            <td>Que puedas <b>entrar a la aplicación</b> con tus credenciales.</td>
            <td>Avisa al Área de Desarrollo <b>antes</b> de salir a campo.</td>
          </tr>
          <tr>
            <td>Que el <b>formato asignado corresponda</b> a la tarea que vas a
            hacer.</td>
            <td>Avisa al Área de Desarrollo. Si el formato no existe todavía, la
            inspección se hace por el método antiguo hasta que se cree la app.</td>
          </tr>
          <tr>
            <td>Que el <b>dispositivo esté cargado</b>.</td>
            <td>Cárgalo. En campo no siempre hay dónde.</td>
          </tr>
        </table>

        <div class="ojo">Los accesos no se piden en el momento: el Supervisor los
        solicita formalmente y Desarrollo los entrega al personal asignado. Y no
        se inicia la toma de datos sin la capacitación correspondiente — que es
        justamente esto que estás haciendo.</div>

        <p class="fuente">IT-OPE-C-12, numerales 4.1.3 y 4.2.1.</p>`,
    },

    {
      id: "m4",
      titulo: "Capturar los datos y la evidencia",
      minutos: 5,
      html: `
        <p>Registra de manera sistemática y detallada <b>todo</b> lo que pide el
        formato: observaciones, mediciones, evidencia fotográfica y documental.
        Directamente en la aplicación, no en una libreta para pasarlo después.</p>

        <p><b>Las fotos</b></p>
        <ul>
          <li>Toda foto lleva <b>descripción</b>. Una foto sin descripción sale
          en el informe con el espacio vacío debajo.</li>
          <li>Que se vea el componente <b>y</b> una referencia de ubicación: una
          foto sin contexto no sirve de evidencia.</li>
          <li>Numéralas en el orden en que quieres que salgan en el informe.</li>
        </ul>

        <p><b>Los datos que después cuesta arreglar</b></p>
        <table>
          <tr><th>Si haces esto…</th><th>…pasa esto</th></tr>
          <tr>
            <td>Escribir el nombre distinto cada vez (con tilde, sin tilde, solo
            iniciales)</td>
            <td>El sistema no reconoce a la persona y no puede validar su
            certificado. Hay que corregirlo a mano, uno por uno.</td>
          </tr>
          <tr>
            <td>Escribir la fecha en un formato distinto al del campo</td>
            <td>Llega vacía al informe, o sale cambiada de mes.</td>
          </tr>
          <tr>
            <td>Dejar campos obligatorios en blanco "para después"</td>
            <td>El informe no se puede generar y te lo devuelven.</td>
          </tr>
        </table>

        <p>La aplicación también captura metadatos por su cuenta
        (<b>geolocalización y hora</b>). Esa es la prueba de dónde y cuándo se
        hizo cada punto, así que el dispositivo debe tener la ubicación
        activada.</p>

        <p class="fuente">IT-OPE-C-12, numeral 4.4.1.</p>`,
    },

    {
      id: "m5",
      titulo: "Sincronización: con señal y sin señal",
      minutos: 5,
      html: `
        <p>Este es el punto donde más información se pierde, y casi siempre por
        lo mismo.</p>

        <p><b>Con conexión</b></p>
        <p>Los datos suben solos, de inmediato. El sistema te lo confirma en
        pantalla: verifica que efectivamente lo diga.</p>

        <p><b>Sin conexión (modo offline)</b></p>
        <p>La aplicación <b>sigue funcionando normalmente</b> y guarda todo en el
        dispositivo. No se pierde nada por no tener señal.</p>
        <p>Cuando recuperes conexión, presiona el <b>botón de sincronización
        🔄</b>, arriba a la derecha, y <b>confirma visualmente</b> que la subida
        terminó antes de dar por cerrada la jornada.</p>

        <div class="ojo"><b>Lo más importante de todo el módulo:</b> si algo no
        parece haberse guardado, <b>no crees el registro otra vez</b>. Quedan dos
        informes del mismo componente y alguien tiene que borrar uno. Presiona
        sincronizar; si sigue sin subir, repórtalo desde la pestaña
        <b>“Reportar”</b> de esta misma página.</div>

        <p>Un detalle que se pasa por alto: la sincronización se dispara cuando
        el formulario está <b>correctamente lleno y finalizado</b>. Un formulario
        a medias puede quedarse en el dispositivo sin subir.</p>

        <p>Y que quede claro de quién es: el instructivo dice que asegurar la
        sincronización es una <b>responsabilidad indelegable del Inspector</b>.
        No es del supervisor ni de desarrollo.</p>

        <p class="fuente">IT-OPE-C-12, numerales 4.3.1 y 4.4.1.</p>`,
    },

    {
      id: "m6",
      titulo: "Antes de cerrar: la verificación",
      minutos: 4,
      html: `
        <p>Cuando la información ya subió, entra al módulo de resumen y haz una
        revisión cruzada. Son tres preguntas:</p>

        <table>
          <tr><th>#</th><th>Confirma que…</th></tr>
          <tr><td>a</td><td>Todos los campos obligatorios quedaron llenos.</td></tr>
          <tr><td>b</td><td>Lo registrado es preciso y coherente con lo que
          observaste.</td></tr>
          <tr><td>c</td><td>La inspección figura como <b>“Finalizada”</b> o
          <b>“Cerrada”</b> en el aplicativo.</td></tr>
        </table>

        <p>Cualquier error de digitación, omisión o dato incoherente se corrige
        <b>en ese momento</b>, con las funciones de edición de la app, antes de
        dar por concluida tu labor.</p>

        <p><b>Si no puedes corregirlo</b> — no sincroniza, un campo quedó
        bloqueado, la app falla — tienes la obligación de avisar de inmediato al
        Área de Desarrollo, indicando:</p>
        <ul>
          <li>qué estabas haciendo (los pasos previos),</li>
          <li>el mensaje de error exacto, si lo hubo,</li>
          <li>la sección afectada y <b>el número de la inspección</b>.</li>
        </ul>
        <p>Con esos tres datos se resuelve rápido; sin ellos toca adivinar.</p>

        <div class="ojo">El instructivo lo llama <b>doble verificación</b> y dice
        que es indispensable: solo la información verificada sirve como base
        legítima para la notificación formal al cliente. Si el dato es flojo, el
        informe también.</div>

        <p class="fuente">IT-OPE-C-12, numerales 4.4.2 y 6.</p>`,
    },

    {
      id: "m7",
      titulo: "Qué pasa después, y cómo reportar",
      minutos: 3,
      html: `
        <p>Cuando cierras, el proceso sigue solo:</p>
        <table>
          <tr><th>Paso</th><th>Quién</th></tr>
          <tr><td>Se dispara una <b>notificación automática</b> avisando que los
          datos están listos para revisión.</td><td>El sistema</td></tr>
          <tr><td>Revisa en los visualizadores: coherencia de los hallazgos,
          completitud, y que las fotos concuerden con los números.</td>
          <td>Supervisor</td></tr>
          <tr><td>Si encuentra fallas, documenta y <b>pide retrabajo</b>; tú
          corriges y se vuelve a validar.</td><td>Supervisor → Inspector</td></tr>
          <tr><td>Da el <b>sello de aprobación</b> solo con la información 100 %
          correcta.</td><td>Supervisor</td></tr>
          <tr><td>Se genera el <b>reporte final</b> con la plantilla estándar y
          los datos aprobados.</td><td>Desarrollo / el sistema</td></tr>
        </table>

        <p>Por eso el retrabajo se siente: cada dato flojo devuelve el ciclo
        varios pasos atrás.</p>

        <p><b>Reportar fallas y proponer mejoras</b></p>
        <p>El numeral 5.3 del instructivo es explícito: ante cualquier problema
        técnico, error, falla de funcionamiento o dificultad de llenado, hay que
        informar <b>directamente y de manera inmediata</b> al Área de Desarrollo.</p>

        <div class="ojo">Ese canal es la pestaña <b>“Reportar”</b> de arriba.
        Queda con número de radicado, no se pierde, y si dejas tu correo te llega
        la copia y te contamos en qué quedó. Una idea dicha de palabra en campo
        se olvida; una radicada, no.</div>

        <p class="fuente">IT-OPE-C-12, numerales 4.5, 4.6 y 5.3.</p>`,
    },
  ],

  // 6 de 8. Se recalcula proporcionalmente si una app agrega preguntas propias.
  minimoAprobado: 6,

  preguntas: [
    {
      enunciado: "Lo que el inspector escribe en la aplicación…",
      opciones: [
        "Lo revisa y transcribe alguien en oficina antes del informe",
        "Sale tal cual en el reporte final que recibe el cliente",
        "Sirve solo como borrador interno",
      ],
      correcta: 1,
    },
    {
      enunciado:
        "Estás en una zona sin señal. ¿Qué pasa con la aplicación?",
      opciones: [
        "Deja de funcionar hasta que haya internet",
        "Sigue funcionando y guarda los datos en el dispositivo",
        "Borra lo capturado para no ocupar memoria",
      ],
      correcta: 1,
    },
    {
      enunciado:
        "Recuperaste la señal después de trabajar sin conexión. ¿Qué haces?",
      opciones: [
        "Nada, ya subió solo mientras no había señal",
        "Presiono el botón 🔄 y confirmo en pantalla que la subida terminó",
        "Vuelvo a crear el registro para asegurarme",
      ],
      correcta: 1,
    },
    {
      enunciado:
        "Guardaste un registro y no estás seguro de que se haya subido. ¿Qué NO debes hacer?",
      opciones: [
        "Crear el registro de nuevo",
        "Presionar sincronizar y verificar",
        "Reportarlo si sigue sin subir",
      ],
      correcta: 0,
    },
    {
      enunciado: "¿Qué debe llevar siempre una foto cargada a la aplicación?",
      opciones: [
        "Su descripción",
        "Nada más, con la imagen basta",
        "El nombre del cliente escrito en la esquina",
      ],
      correcta: 0,
    },
    {
      enunciado:
        "Antes de dar por cerrada la inspección, ¿qué tienes que confirmar?",
      opciones: [
        "Solo que las fotos hayan subido",
        "Campos obligatorios llenos, datos coherentes, y que figure como Finalizada",
        "Que el supervisor ya la haya aprobado",
      ],
      correcta: 1,
    },
    {
      enunciado:
        "Según el instructivo, asegurar que los datos se sincronicen es responsabilidad…",
      opciones: [
        "Del Área de Desarrollo",
        "Del Supervisor, que hace el seguimiento",
        "Indelegable del Inspector",
      ],
      correcta: 2,
    },
    {
      enunciado:
        "Encuentras una falla en la aplicación que no te deja corregir un dato. ¿Cuál es el camino correcto?",
      opciones: [
        "Reportarla de inmediato indicando los pasos, el error y el número de la inspección",
        "Comentarlo de palabra cuando haya oportunidad",
        "Trabajar alrededor del problema y no decir nada",
      ],
      correcta: 0,
    },
  ],
};

// ---------------------------------------------------------------------------
// Contenido propio de cada aplicación
// ---------------------------------------------------------------------------

/**
 * Módulos que se agregan al tronco común según la app elegida. La clave es el
 * ID del Listado Maestro (APP-022, APP-001…).
 *
 * Una app sin entrada aquí recibe solo el tronco común — que es lo correcto
 * mientras no exista material propio de esa técnica.
 *
 * Ejemplo de cómo se agrega uno:
 *
 *   "APP-022": [
 *     {
 *       id: "mt1",
 *       titulo: "Criterios de aceptación en MT",
 *       minutos: 6,
 *       html: `<p>…</p>`,
 *     },
 *   ],
 */
export const MODULOS_POR_APP: Record<string, Modulo[]> = {};

/** Preguntas que se suman a las del tronco común, por app. */
export const PREGUNTAS_POR_APP: Record<string, Pregunta[]> = {};

/**
 * Arma el curso de una aplicación: tronco común + lo suyo.
 *
 * El mínimo para aprobar mantiene la misma proporción del tronco común (6 de
 * 8 = 75 %), así agregar preguntas de técnica no vuelve la evaluación
 * imposible ni trivial.
 */
export function construirCurso(appId: string, appNombre: string): Curso {
  const propios = MODULOS_POR_APP[appId] || [];
  const preguntasPropias = PREGUNTAS_POR_APP[appId] || [];

  const modulos = [...CURSO_BASE.modulos, ...propios];
  const preguntas = [...CURSO_BASE.preguntas, ...preguntasPropias];
  const proporcion = CURSO_BASE.minimoAprobado / CURSO_BASE.preguntas.length;

  return {
    ...CURSO_BASE,
    codigo: `${CURSO_BASE.codigo}/${appId}`,
    nombre: `${CURSO_BASE.nombre} — ${appNombre}`,
    modulos,
    preguntas,
    minimoAprobado: Math.min(preguntas.length, Math.ceil(preguntas.length * proporcion)),
  };
}

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
