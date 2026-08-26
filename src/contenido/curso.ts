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
 * El curso es el mismo para todas las aplicaciones: lo que cambia entre ellas
 * es el formato que se diligencia, no el proceso. Por eso el formato se
 * pregunta en el registro y no parte el contenido en cursos distintos.
 */
export const CURSO: Curso = {
  codigo: "CAP-GEN-01",
  nombre: "Proceso de inspección y generación automática de reportes",
  version: "2.1",
  fechaVersion: "2026-08-26",

  intro: `
    <p>Esta capacitación cubre el proceso completo: desde que te asignan la
    inspección hasta que sale el reporte que se le entrega al cliente. Está
    basada en el instructivo <b>IT-OPE-C-12</b> (rev. 01).</p>
    <p>Toma unos <b>25 minutos</b>: la presentación, el instructivo, un repaso
    de los puntos clave y una evaluación corta. Al aprobarla queda tu constancia
    y el registro de asistencia.</p>`,

  // Los "puntos clave": el repaso que va DESPUÉS del material oficial y antes
  // de la evaluación. Cada dato aparece una sola vez en todo el recorrido; si
  // agregas algo, revisa que no esté ya en otro módulo.
  modulos: [
    {
      id: "m1",
      titulo: "Para qué existe este proceso",
      minutos: 3,
      html: `
        <p>Antes, la inspección se anotaba en papel o en un archivo suelto y
        alguien la pasaba a limpio después. Ahora no: lo que capturas en la
        aplicación es lo que sale en el reporte que recibe el cliente.</p>

        <div class="ojo">Nadie transcribe en el medio. Un campo mal escrito
        llega así hasta el informe final.</div>

        <p>El instructivo se apoya en tres ideas:</p>
        <ul>
          <li><b>Calidad del dato.</b> Preciso, entendible y escrito siempre
          igual.</li>
          <li><b>Integridad.</b> Solo se usan las aplicaciones internas. Los
          datos no salen a un archivo aparte para volver a montarlos.</li>
          <li><b>Trazabilidad.</b> Del dato que capturaste al informe entregado
          hay un rastro completo.</li>
        </ul>

        <p>Con eso se busca menos reproceso, ciclos más cortos y
        responsabilidades claras.</p>

        <p class="fuente">IT-OPE-C-12, numerales 1 y 2.</p>`,
    },

    {
      id: "m2",
      titulo: "Quién hace qué",
      minutos: 3,
      html: `
        <p>Tres roles se reparten el proceso.</p>

        <table>
          <tr><th>Rol</th><th>Responde de</th><th>Entrega</th></tr>
          <tr>
            <td><b>Supervisor</b></td>
            <td>Recibir y priorizar el requerimiento, verificar los documentos
            soporte, hacer seguimiento y validar al final.</td>
            <td>La orden de inspección y el sello de aprobación.</td>
          </tr>
          <tr>
            <td><b>Desarrollo</b></td>
            <td>Crear y mantener las aplicaciones y los formatos, y sostener la
            infraestructura.</td>
            <td>La aplicación funcionando y el reporte final.</td>
          </tr>
          <tr>
            <td><b>Inspector</b></td>
            <td>Ejecutar en campo, capturar los datos y la evidencia,
            sincronizar y corregir.</td>
            <td>El formulario completo, veraz y sincronizado.</td>
          </tr>
        </table>

        <p>Del inspector dependen cuatro cosas: ejecutar la inspección y
        capturar la evidencia, operar bien la aplicación y el equipo, confirmar
        que los datos subieron, y corregir lo que esté mal antes de darla por
        terminada.</p>

        <p class="fuente">IT-OPE-C-12, numeral 3.</p>`,
    },

    {
      id: "m3",
      titulo: "Antes de salir a campo",
      minutos: 2,
      html: `
        <p>Tres chequeos antes de moverte:</p>
        <ul>
          <li>Que entres a la aplicación con tus credenciales.</li>
          <li>Que el formato asignado sea el de la tarea que vas a hacer.</li>
          <li>Que el equipo esté cargado.</li>
        </ul>

        <p>Los dos primeros los resuelve Desarrollo, pero avisando antes de
        salir y no desde el sitio. Si el formato todavía no existe como
        aplicación, esa inspección se hace por el método antiguo hasta que se
        cree.</p>

        <div class="ojo">Los accesos los solicita el supervisor y los entrega
        Desarrollo al personal asignado. Y no se empieza a tomar datos sin la
        capacitación correspondiente.</div>

        <p class="fuente">IT-OPE-C-12, numerales 4.1.3 y 4.2.1.</p>`,
    },

    {
      id: "m4",
      titulo: "Capturar los datos y la evidencia",
      minutos: 5,
      html: `
        <p>Todo lo que pide el formato va en la aplicación: observaciones,
        mediciones, fotos y documentos. No en una libreta para pasarlo
        después.</p>

        <p><b>Fotos.</b> Cada una con su descripción; sin ella el informe deja
        el pie en blanco. Que se vea el componente y alguna referencia de
        ubicación, y numéralas en el orden en que deben aparecer.</p>

        <p><b>Metadatos.</b> La aplicación guarda por su cuenta la ubicación y
        la hora de cada punto, que es lo que prueba dónde y cuándo se hizo la
        inspección. Para eso el GPS del equipo tiene que estar activo.</p>

        <p>Tres cosas que después cuesta arreglar:</p>
        <table>
          <tr><th>Si haces esto</th><th>Pasa esto</th></tr>
          <tr>
            <td>Escribir el nombre distinto cada vez: con tilde, sin tilde,
            solo iniciales</td>
            <td>El sistema no reconoce a la persona y no valida su certificado.
            Se corrige a mano, uno por uno.</td>
          </tr>
          <tr>
            <td>Escribir la fecha en un formato distinto al del campo</td>
            <td>Llega vacía al informe, o sale cambiada de mes.</td>
          </tr>
          <tr>
            <td>Dejar campos obligatorios en blanco para llenarlos luego</td>
            <td>El informe no se puede generar y te lo devuelven.</td>
          </tr>
        </table>

        <p class="fuente">IT-OPE-C-12, numeral 4.4.1.</p>`,
    },

    {
      id: "m5",
      titulo: "Sincronizar",
      minutos: 4,
      html: `
        <p><b>Con señal.</b> Los datos suben de inmediato y la aplicación lo
        confirma en pantalla. Vale la pena mirar que efectivamente lo diga.</p>

        <p><b>Sin señal.</b> La aplicación sigue trabajando y guarda todo en el
        equipo. Al recuperar conexión, presiona el botón <b>🔄</b> de arriba a
        la derecha y espera a que confirme la subida antes de cerrar la
        jornada.</p>

        <div class="ojo">Si algo no parece haberse guardado, <b>no vuelvas a
        crear el registro</b>. Quedan dos informes del mismo componente y
        alguien tiene que borrar uno. Presiona sincronizar; si aun así no sube,
        repórtalo.</div>

        <p>La sincronización se dispara con el formulario lleno y finalizado.
        Uno a medias puede quedarse en el equipo sin subir.</p>

        <p>Y es responsabilidad del inspector, no del supervisor ni de
        Desarrollo: el instructivo la llama <b>indelegable</b>.</p>

        <p class="fuente">IT-OPE-C-12, numerales 4.3.1 y 4.4.1.</p>`,
    },

    {
      id: "m6",
      titulo: "Antes de cerrar",
      minutos: 4,
      html: `
        <p>Con la información ya subida, entra al resumen y revisa tres
        cosas:</p>
        <ol>
          <li>Que todos los campos obligatorios quedaron llenos.</li>
          <li>Que lo registrado es preciso y coherente con lo que
          observaste.</li>
          <li>Que la inspección figura como <b>Finalizada</b> o
          <b>Cerrada</b>.</li>
        </ol>

        <p>Lo que esté mal se corrige ahí mismo, con las funciones de edición de
        la aplicación, antes de dar por terminada la jornada.</p>

        <p>Si no puedes corregirlo, porque no sincroniza o un campo quedó
        bloqueado o la aplicación falla, avisa a Desarrollo con tres datos:
        <b>qué estabas haciendo</b>, <b>el mensaje de error</b> y <b>el número
        de la inspección</b>.</p>

        <p>El instructivo llama a esto doble verificación: solo la información
        verificada sirve de base para la notificación formal al cliente.</p>

        <p class="fuente">IT-OPE-C-12, numerales 4.4.2 y 6.</p>`,
    },

    {
      id: "m7",
      titulo: "Qué pasa después",
      minutos: 3,
      html: `
        <p>Cuando cierras, el proceso sigue solo:</p>
        <table>
          <tr><th>Paso</th><th>Quién</th></tr>
          <tr><td>Se dispara la notificación de que los datos están listos para
          revisión.</td><td>El sistema</td></tr>
          <tr><td>Se revisa en los visualizadores: coherencia de los hallazgos,
          completitud, y que las fotos concuerden con los números.</td>
          <td>Supervisor</td></tr>
          <tr><td>Si hay fallas, se documentan y vuelven a ti para
          corregirlas.</td><td>Supervisor</td></tr>
          <tr><td>Se aprueba el flujo con la información completa.</td>
          <td>Supervisor</td></tr>
          <tr><td>Se genera el reporte final con la plantilla estándar.</td>
          <td>Desarrollo</td></tr>
        </table>

        <p>Cada corrección devuelve el ciclo varios pasos atrás, y por eso el
        retrabajo se nota tanto.</p>

        <p><b>Reportar.</b> El numeral 5.3 obliga a informar a Desarrollo ante
        cualquier falla, error o dificultad de llenado. Ese es el canal de la
        pestaña <b>Reportar</b> de arriba: queda con número, y si dejas tu
        correo te avisamos cuando se revise.</p>

        <p class="fuente">IT-OPE-C-12, numerales 4.5, 4.6 y 5.3.</p>`,
    },
  ],

  // 6 de 8. Se recalcula proporcionalmente si se agregan preguntas.
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
      enunciado: "Estás en una zona sin señal. ¿Qué pasa con la aplicación?",
      opciones: [
        "Deja de funcionar hasta que haya internet",
        "Sigue funcionando y guarda los datos en el equipo",
        "Borra lo capturado para no ocupar memoria",
      ],
      correcta: 1,
    },
    {
      enunciado:
        "Recuperaste la señal después de trabajar sin conexión. ¿Qué haces?",
      opciones: [
        "Nada, ya subió solo mientras no había señal",
        "Presiono el botón 🔄 y espero a que confirme la subida",
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
        "Del supervisor, que hace el seguimiento",
        "Indelegable del inspector",
      ],
      correcta: 2,
    },
    {
      enunciado:
        "Encuentras una falla en la aplicación que no te deja corregir un dato. ¿Qué haces?",
      opciones: [
        "Avisar a Desarrollo con los pasos, el mensaje de error y el número de la inspección",
        "Comentarlo de palabra cuando haya oportunidad",
        "Trabajar alrededor del problema y no decir nada",
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
