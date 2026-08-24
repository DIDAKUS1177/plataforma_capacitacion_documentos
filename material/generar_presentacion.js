/**
 * Presentación de capacitación de inspectores — ADEMINCOL.
 * Contenido: IT-OPE-C-12 rev. 01. Identidad: la misma de ADEMINCOL Central.
 */
const pptxgen = require("pptxgenjs");
const fs = require("fs");

const LOGO =
  "C:/Users/dieal/OneDrive/Desktop/1. Carpetas de respaldo como tal/adc-capacitacion/src/assets/logo-demincol.png";
const SALIDA = process.argv[2];

const ROJO = "DC2626";
const ROJO_OSC = "991B1B";
// Sobre fondo oscuro el rojo de marca queda en 4:1; este aclarado sube a 7:1.
const ROJO_CLARO = "F87171";
const TINTA = "0F172A";
const TINTA_MED = "334155";
const GRIS = "64748B";
const GRIS_SUAVE = "94A3B8";
const FONDO = "F8FAFC";
const CARD = "F1F5F9";
const BORDE = "E2E8F0";
const BLANCO = "FFFFFF";

const FUENTE = "Calibri";
const W = 13.333;
const H = 7.5;
const M = 0.75; // margen

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Diego Alejandro Hernández Blanco";
pres.company = "ADEMINCOL S.A.S.";
pres.title = "Proceso de inspección y generación automática de reportes";

// ---------------------------------------------------------------------------
// Piezas reutilizables
// ---------------------------------------------------------------------------

/** Diapositiva de contenido: fondo claro, título arriba, kicker opcional. */
function hoja(titulo, kicker) {
  const s = pres.addSlide();
  s.background = { color: FONDO };
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.42, w: W - 2 * M, h: 0.26,
      fontFace: FUENTE, fontSize: 11, bold: true, color: ROJO, charSpacing: 1.5, margin: 0,
    });
  }
  s.addText(titulo, {
    x: M, y: kicker ? 0.72 : 0.6, w: W - 2 * M, h: 0.75,
    fontFace: FUENTE, fontSize: 32, bold: true, color: TINTA, margin: 0,
  });
  return s;
}

/** Tarjeta con esquinas redondeadas. */
function tarjeta(s, x, y, w, h, relleno) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: relleno || CARD },
    line: { color: BORDE, width: 1 },
  });
}

/** Círculo rojo con un número o letra dentro. */
function ficha(s, x, y, texto, diam) {
  const d = diam || 0.5;
  s.addShape(pres.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { color: ROJO }, line: { color: ROJO, width: 0 },
  });
  s.addText(String(texto), {
    x, y, w: d, h: d,
    fontFace: FUENTE, fontSize: d > 0.55 ? 18 : 15, bold: true, color: BLANCO,
    align: "center", valign: "middle", margin: 0,
  });
}

function cuerpo(s, texto, opts) {
  s.addText(texto, Object.assign({
    fontFace: FUENTE, fontSize: 14, color: TINTA_MED, margin: 0, valign: "top",
  }, opts));
}

function pie(s, texto) {
  s.addText(texto, {
    x: M, y: H - 0.62, w: W - 2 * M, h: 0.3,
    fontFace: FUENTE, fontSize: 11, color: GRIS, margin: 0,
  });
}

// ---------------------------------------------------------------------------
// 1. Portada
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: TINTA };
  // El logo es tinta oscura sobre transparente: sobre fondo oscuro necesita
  // una placa blanca detrás.
  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 0.85, w: 3.5, h: 1.15, rectRadius: 0.1,
    fill: { color: BLANCO }, line: { color: BLANCO, width: 0 },
  });
  s.addImage({ path: LOGO, x: M + 0.25, y: 1.08, w: 3.0, h: 0.69 });

  s.addText("CAPACITACIÓN Y SOCIALIZACIÓN", {
    x: M, y: 2.45, w: W - 2 * M, h: 0.3,
    fontFace: FUENTE, fontSize: 13, bold: true, color: ROJO_CLARO, charSpacing: 2, margin: 0,
  });
  s.addText("Proceso de inspección y\ngeneración automática de reportes", {
    x: M, y: 2.85, w: 10.5, h: 1.9,
    fontFace: FUENTE, fontSize: 40, bold: true, color: BLANCO, lineSpacing: 46, margin: 0,
  });
  s.addText("Manejo del formato y de la aplicación de campo", {
    x: M, y: 4.85, w: 9.5, h: 0.4,
    fontFace: FUENTE, fontSize: 17, color: GRIS_SUAVE, margin: 0,
  });

  s.addText(
    [
      { text: "Diego Alejandro Hernández Blanco", options: { bold: true, color: BLANCO, breakLine: true } },
      { text: "Ingeniero de Desarrollo e Integridad", options: { color: GRIS_SUAVE } },
    ],
    { x: M, y: 5.85, w: 6, h: 0.75, fontFace: FUENTE, fontSize: 13, margin: 0 },
  );
  s.addText(
    [
      { text: "IT-OPE-C-12", options: { bold: true, color: BLANCO, breakLine: true } },
      { text: "Revisión 01 · 09-04-2026", options: { color: GRIS_SUAVE } },
    ],
    { x: W - M - 3.5, y: 5.85, w: 3.5, h: 0.75, fontFace: FUENTE, fontSize: 13, align: "right", margin: 0 },
  );
  s.addNotes(
    "Presentarse. Aclarar que esta sesión no es sobre la técnica de inspección, " +
    "sino sobre el proceso y la herramienta. Al final cada quien registra su constancia.",
  );
}

// ---------------------------------------------------------------------------
// 2. Agenda
// ---------------------------------------------------------------------------
{
  const s = hoja("Lo que vamos a ver", "Agenda");
  const items = [
    ["1", "Para qué cambió el proceso", "De papel y transcripción a captura directa"],
    ["2", "Quién hace qué", "Supervisor, Desarrollo e Inspector"],
    ["3", "Antes de salir a campo", "Tres chequeos de un minuto"],
    ["4", "Capturar datos y evidencia", "Formularios, fotos y metadatos"],
    ["5", "Sincronizar", "Con señal, sin señal y el botón 🔄"],
    ["6", "Cerrar y reportar", "Verificación, retrabajo y buzón de mejoras"],
  ];
  items.forEach((it, i) => {
    const col = i % 2;
    const fila = Math.floor(i / 2);
    const x = M + col * 6.1;
    const y = 1.95 + fila * 1.55;
    tarjeta(s, x, y, 5.6, 1.25);
    ficha(s, x + 0.28, y + 0.38, it[0]);
    s.addText(it[1], {
      x: x + 0.95, y: y + 0.3, w: 4.4, h: 0.32,
      fontFace: FUENTE, fontSize: 15, bold: true, color: TINTA, margin: 0,
    });
    cuerpo(s, it[2], { x: x + 0.95, y: y + 0.68, w: 4.4, h: 0.4, fontSize: 12, color: GRIS });
  });
  pie(s, "Duración aproximada: 30 minutos + evaluación");
}

// ---------------------------------------------------------------------------
// 3. La idea principal
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: TINTA };
  s.addText("Si te quedas con una sola cosa", {
    x: M, y: 1.5, w: W - 2 * M, h: 0.4,
    fontFace: FUENTE, fontSize: 15, bold: true, color: ROJO_CLARO, charSpacing: 1.5, margin: 0,
  });
  s.addText("Lo que escribes en la app\nes el informe que firma\nla empresa.", {
    x: M, y: 2.1, w: 11.2, h: 2.6,
    fontFace: FUENTE, fontSize: 42, bold: true, color: BLANCO, lineSpacing: 50, margin: 0,
  });
  s.addText("No hay nadie transcribiendo en el medio.", {
    x: M, y: 4.9, w: 10, h: 0.45,
    fontFace: FUENTE, fontSize: 20, color: GRIS_SUAVE, italic: true, margin: 0,
  });
  s.addNotes(
    "Insistir aquí. Es el cambio de mentalidad que sostiene todo lo demás: " +
    "un campo mal escrito no lo arregla nadie después.",
  );
}

// ---------------------------------------------------------------------------
// 4. Los tres pilares
// ---------------------------------------------------------------------------
{
  const s = hoja("Los tres pilares del proceso", "Numeral 2 · Alcance");
  const cols = [
    ["Calidad del dato", "Precisión, que se entienda, que cumpla y que esté escrito siempre igual."],
    ["Integridad", "Se usan solo las aplicaciones internas. Nada de sacar los datos y volverlos a montar."],
    ["Trazabilidad", "Se sigue el rastro desde lo que capturaste hasta el reporte entregado."],
  ];
  cols.forEach((c, i) => {
    const x = M + i * 4.02;
    tarjeta(s, x, 2.05, 3.72, 3.0, BLANCO);
    ficha(s, x + 0.35, 2.45, i + 1, 0.62);
    s.addText(c[0], {
      x: x + 0.35, y: 3.3, w: 3.0, h: 0.35,
      fontFace: FUENTE, fontSize: 18, bold: true, color: TINTA, margin: 0,
    });
    cuerpo(s, c[1], { x: x + 0.35, y: 3.75, w: 3.05, h: 1.15, fontSize: 13 });
  });
  s.addText(
    "Lo que se gana:  menos reprocesos   ·   menos tiempo de ciclo   ·   responsabilidades claras",
    { x: M, y: 5.55, w: W - 2 * M, h: 0.45,
      fontFace: FUENTE, fontSize: 15, bold: true, color: ROJO_OSC, margin: 0 },
  );
  pie(s, "IT-OPE-C-12, numerales 1 y 2");
}

// ---------------------------------------------------------------------------
// 5. Los tres roles
// ---------------------------------------------------------------------------
{
  const s = hoja("Quién hace qué", "Numeral 3 · Responsabilidades");
  const roles = [
    ["Supervisor / Coordinador", "Recibe y prioriza, verifica documentos, hace seguimiento y valida al final.",
      "Entrega: la orden de inspección y el sello de aprobación."],
    ["Área de Desarrollo", "Crea y mantiene las apps y los formatos, y sostiene la infraestructura.",
      "Entrega: la app funcionando y el reporte final."],
    ["Inspector", "Ejecuta en campo, captura los datos y la evidencia, sincroniza y corrige.",
      "Entrega: el formulario completo, veraz y sincronizado."],
  ];
  roles.forEach((r, i) => {
    const y = 1.95 + i * 1.58;
    tarjeta(s, M, y, W - 2 * M, 1.38, i === 2 ? "FEF2F2" : BLANCO);
    s.addText(r[0], {
      x: M + 0.35, y: y + 0.24, w: 3.5, h: 0.35,
      fontFace: FUENTE, fontSize: 16, bold: true, color: i === 2 ? ROJO_OSC : TINTA, margin: 0,
    });
    cuerpo(s, r[1], { x: M + 0.35, y: y + 0.68, w: 3.6, h: 0.6, fontSize: 12 });
    cuerpo(s, r[2], { x: M + 4.3, y: y + 0.48, w: 7.1, h: 0.6, fontSize: 13, color: TINTA });
  });
  pie(s, "El inspector es el único que ve el activo. Lo que no capture, no existe.");
}

// ---------------------------------------------------------------------------
// 6. Tu rol
// ---------------------------------------------------------------------------
{
  const s = hoja("Tus cuatro responsabilidades", "El inspector");
  const rr = [
    ["Ejecución en campo", "Aplicar el formato y capturar la evidencia."],
    ["Manejo de la herramienta", "Operar bien la app: geolocalización y hora incluidas."],
    ["Sincronización", "Asegurar que lo capturado llegó al servidor."],
    ["Corrección", "Detectar y arreglar los errores antes de cerrar la jornada."],
  ];
  rr.forEach((r, i) => {
    const x = M + (i % 2) * 6.1;
    const y = 2.0 + Math.floor(i / 2) * 1.85;
    tarjeta(s, x, y, 5.6, 1.55, BLANCO);
    ficha(s, x + 0.3, y + 0.45, i + 1, 0.6);
    s.addText(r[0], {
      x: x + 1.05, y: y + 0.35, w: 4.3, h: 0.32,
      fontFace: FUENTE, fontSize: 16, bold: true, color: TINTA, margin: 0,
    });
    cuerpo(s, r[1], { x: x + 1.05, y: y + 0.75, w: 4.3, h: 0.65, fontSize: 12.5 });
  });
  s.addText(
    "La sincronización es una responsabilidad indelegable del Inspector.",
    { x: M, y: 5.85, w: W - 2 * M, h: 0.4,
      fontFace: FUENTE, fontSize: 15, bold: true, color: ROJO_OSC, margin: 0 },
  );
  pie(s, "IT-OPE-C-12, numeral 3.1.3");
}

// ---------------------------------------------------------------------------
// 7. Antes de empezar
// ---------------------------------------------------------------------------
{
  const s = hoja("Antes de salir a campo", "Numerales 4.1.3 y 4.2.1");
  const ch = [
    ["Acceso", "Que puedas entrar a la aplicación con tus credenciales.", "Avisa a Desarrollo antes de salir."],
    ["Formato", "Que el formato asignado corresponda a la tarea.", "Si no existe, se hace por el método antiguo."],
    ["Equipo", "Que el dispositivo esté cargado.", "En campo no siempre hay dónde cargar."],
  ];
  ch.forEach((c, i) => {
    const y = 1.95 + i * 1.5;
    tarjeta(s, M, y, W - 2 * M, 1.3, BLANCO);
    s.addShape(pres.ShapeType.ellipse, {
      x: M + 0.3, y: y + 0.4, w: 0.5, h: 0.5, fill: { color: ROJO }, line: { width: 0 },
    });
    s.addText("✓", {
      x: M + 0.3, y: y + 0.4, w: 0.5, h: 0.5,
      fontFace: FUENTE, fontSize: 17, bold: true, color: BLANCO,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(c[0], {
      x: M + 1.0, y: y + 0.3, w: 1.7, h: 0.3,
      fontFace: FUENTE, fontSize: 15, bold: true, color: TINTA, margin: 0,
    });
    cuerpo(s, c[1], { x: M + 1.0, y: y + 0.68, w: 4.6, h: 0.5, fontSize: 12.5 });
    cuerpo(s, c[2], { x: M + 6.0, y: y + 0.45, w: 5.4, h: 0.55, fontSize: 13, color: ROJO_OSC });
  });
  s.addText("No se inicia la toma de datos sin la capacitación correspondiente.", {
    x: M, y: 6.4, w: W - 2 * M, h: 0.4,
    fontFace: FUENTE, fontSize: 14, italic: true, color: GRIS, margin: 0,
  });
}

// ---------------------------------------------------------------------------
// 8. Captura de datos
// ---------------------------------------------------------------------------
{
  const s = hoja("Capturar los datos", "Numeral 4.4.1");
  tarjeta(s, M, 1.95, 5.9, 3.75, BLANCO);
  s.addText("Registra todo, en la app", {
    x: M + 0.35, y: 2.2, w: 5.2, h: 0.35,
    fontFace: FUENTE, fontSize: 17, bold: true, color: TINTA, margin: 0,
  });
  s.addText(
    [
      { text: "Observaciones y mediciones", options: { bullet: true, breakLine: true } },
      { text: "Evidencia fotográfica y documental", options: { bullet: true, breakLine: true } },
      { text: "Directamente en la aplicación, no en una libreta para pasarlo después", options: { bullet: true } },
    ],
    { x: M + 0.4, y: 2.75, w: 5.1, h: 2.6, valign: "top",
      fontFace: FUENTE, fontSize: 13.5, color: TINTA_MED, paraSpaceAfter: 8, margin: 0 },
  );

  tarjeta(s, M + 6.2, 1.95, 5.6, 3.75, "FEF2F2");
  s.addText("La app captura sola", {
    x: M + 6.55, y: 2.2, w: 4.9, h: 0.35,
    fontFace: FUENTE, fontSize: 17, bold: true, color: ROJO_OSC, margin: 0,
  });
  cuerpo(s,
    "Geolocalización y hora de cada punto. Esa es la prueba de dónde y cuándo se hizo " +
    "la inspección, así que el dispositivo debe tener la ubicación activada.",
    { x: M + 6.55, y: 2.7, w: 4.9, h: 1.7, fontSize: 13.5 });
  s.addText("Sin ubicación activada, no hay evidencia de dónde estuviste.", {
    x: M + 6.55, y: 4.65, w: 4.9, h: 0.7,
    fontFace: FUENTE, fontSize: 13, bold: true, color: ROJO_OSC, margin: 0,
  });
  pie(s, "IT-OPE-C-12, numeral 4.4.1");
}

// ---------------------------------------------------------------------------
// 9. Las fotos
// ---------------------------------------------------------------------------
{
  const s = hoja("Las fotos: tres reglas", "Evidencia");
  const fotos = [
    ["Descripción", "Toda foto lleva descripción. Sin ella, en el informe queda el espacio vacío debajo."],
    ["Contexto", "Que se vea el componente y una referencia de ubicación. Una foto sin contexto no es evidencia."],
    ["Orden", "Numéralas en el orden en que quieres que salgan en el informe."],
  ];
  fotos.forEach((f, i) => {
    const x = M + i * 4.02;
    tarjeta(s, x, 2.05, 3.72, 3.3, BLANCO);
    ficha(s, x + 0.35, 2.45, i + 1, 0.62);
    s.addText(f[0], {
      x: x + 0.35, y: 3.3, w: 3.0, h: 0.35,
      fontFace: FUENTE, fontSize: 18, bold: true, color: TINTA, margin: 0,
    });
    cuerpo(s, f[1], { x: x + 0.35, y: 3.75, w: 3.05, h: 1.45, fontSize: 13 });
  });
  pie(s, "Una foto sin descripción obliga a devolver el informe.");
}

// ---------------------------------------------------------------------------
// 10. Errores que cuestan
// ---------------------------------------------------------------------------
{
  const s = hoja("Lo que cuesta arreglar después", "Calidad del dato");
  const filas = [
    ["Escribir el nombre distinto cada vez", "El sistema no reconoce a la persona y no valida su certificado. Se corrige a mano, uno por uno."],
    ["Fecha en un formato distinto al del campo", "Llega vacía al informe, o sale cambiada de mes."],
    ["Dejar campos obligatorios \"para después\"", "El informe no se puede generar y te lo devuelven."],
  ];
  s.addText("SI HACES ESTO…", {
    x: M + 0.35, y: 1.95, w: 5, h: 0.28,
    fontFace: FUENTE, fontSize: 10.5, bold: true, color: GRIS, charSpacing: 1.2, margin: 0,
  });
  s.addText("…PASA ESTO", {
    x: M + 5.9, y: 1.95, w: 5, h: 0.28,
    fontFace: FUENTE, fontSize: 10.5, bold: true, color: ROJO, charSpacing: 1.2, margin: 0,
  });
  filas.forEach((f, i) => {
    const y = 2.35 + i * 1.45;
    tarjeta(s, M, y, W - 2 * M, 1.25, BLANCO);
    cuerpo(s, f[0], { x: M + 0.35, y: y + 0.38, w: 5.2, h: 0.6, fontSize: 14, color: TINTA });
    cuerpo(s, f[1], { x: M + 5.9, y: y + 0.3, w: 5.5, h: 0.75, fontSize: 13 });
  });
  pie(s, "Ninguno de estos es un error de la app: son datos que hay que escribir bien.");
}

// ---------------------------------------------------------------------------
// 11. Sincronización
// ---------------------------------------------------------------------------
{
  const s = hoja("Sincronización", "Numerales 4.3.1 y 4.4.1");
  tarjeta(s, M, 2.0, 5.75, 3.6, BLANCO);
  s.addText("Con conexión", {
    x: M + 0.35, y: 2.28, w: 5.0, h: 0.35,
    fontFace: FUENTE, fontSize: 19, bold: true, color: TINTA, margin: 0,
  });
  cuerpo(s,
    "Los datos suben solos, de inmediato. El sistema te lo confirma en pantalla: " +
    "verifica que efectivamente lo diga.",
    { x: M + 0.35, y: 2.8, w: 5.0, h: 1.3, fontSize: 14 });
  s.addText("Si no ves la confirmación, no des la jornada por cerrada.", {
    x: M + 0.35, y: 4.6, w: 5.0, h: 0.7,
    fontFace: FUENTE, fontSize: 14, bold: true, color: TINTA, margin: 0,
  });

  tarjeta(s, M + 6.05, 2.0, 5.75, 3.6, "FEF2F2");
  s.addText("Sin conexión", {
    x: M + 6.4, y: 2.28, w: 5.0, h: 0.35,
    fontFace: FUENTE, fontSize: 19, bold: true, color: ROJO_OSC, margin: 0,
  });
  cuerpo(s,
    "La app sigue funcionando normalmente y guarda todo en el dispositivo. " +
    "No se pierde nada por no tener señal.",
    { x: M + 6.4, y: 2.8, w: 5.0, h: 1.3, fontSize: 14 });
  s.addText("Al recuperar señal: botón 🔄 y confirmar que terminó.", {
    x: M + 6.4, y: 4.6, w: 5.0, h: 0.7,
    fontFace: FUENTE, fontSize: 14, bold: true, color: ROJO_OSC, margin: 0,
  });

  s.addText(
    "La sincronización se dispara cuando el formulario está correctamente lleno y finalizado. " +
    "Uno a medias puede quedarse en el dispositivo sin subir.",
    { x: M, y: 5.9, w: W - 2 * M, h: 0.6,
      fontFace: FUENTE, fontSize: 13.5, italic: true, color: GRIS, margin: 0 },
  );
}

// ---------------------------------------------------------------------------
// 12. No dupliques
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: TINTA };
  s.addText("EL ERROR MÁS CARO", {
    x: M, y: 1.35, w: W - 2 * M, h: 0.35,
    fontFace: FUENTE, fontSize: 13, bold: true, color: ROJO_CLARO, charSpacing: 2, margin: 0,
  });
  s.addText("Si algo no parece haberse\nguardado, no lo crees otra vez.", {
    x: M, y: 1.85, w: 11.5, h: 1.9,
    fontFace: FUENTE, fontSize: 36, bold: true, color: BLANCO, lineSpacing: 44, margin: 0,
  });
  const pasos = [
    ["1", "Presiona sincronizar 🔄"],
    ["2", "Confirma en pantalla que subió"],
    ["3", "Si sigue sin subir, repórtalo"],
  ];
  pasos.forEach((p, i) => {
    const x = M + i * 4.02;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 4.15, w: 3.72, h: 1.15, rectRadius: 0.12,
      fill: { color: "1E293B" }, line: { color: TINTA_MED, width: 1 },
    });
    ficha(s, x + 0.3, 4.45, p[0], 0.55);
    s.addText(p[1], {
      x: x + 1.0, y: 4.45, w: 2.6, h: 0.55,
      fontFace: FUENTE, fontSize: 13.5, color: BLANCO, valign: "middle", margin: 0,
    });
  });
  s.addText("Duplicar deja dos informes del mismo componente y alguien tiene que borrar uno.", {
    x: M, y: 5.65, w: W - 2 * M, h: 0.4,
    fontFace: FUENTE, fontSize: 14, color: GRIS_SUAVE, italic: true, margin: 0,
  });
}

// ---------------------------------------------------------------------------
// 13. Antes de cerrar
// ---------------------------------------------------------------------------
{
  const s = hoja("Antes de cerrar: verifica", "Numeral 4.4.2");
  const abc = [
    ["a", "Todos los campos obligatorios quedaron llenos."],
    ["b", "Lo registrado es preciso y coherente con lo que observaste."],
    ["c", "La inspección figura como “Finalizada” o “Cerrada”."],
  ];
  abc.forEach((v, i) => {
    const y = 1.95 + i * 1.3;
    tarjeta(s, M, y, 7.0, 1.1, BLANCO);
    ficha(s, M + 0.28, y + 0.3, v[0], 0.5);
    cuerpo(s, v[1], { x: M + 1.0, y: y + 0.35, w: 5.7, h: 0.55, fontSize: 13.5, color: TINTA });
  });

  tarjeta(s, M + 7.3, 1.95, 4.5, 3.9, "FEF2F2");
  s.addText("¿No puedes corregirlo?", {
    x: M + 7.6, y: 2.2, w: 3.9, h: 0.35,
    fontFace: FUENTE, fontSize: 16, bold: true, color: ROJO_OSC, margin: 0,
  });
  s.addText(
    [
      { text: "Qué estabas haciendo", options: { bullet: true, breakLine: true } },
      { text: "El mensaje de error exacto", options: { bullet: true, breakLine: true } },
      { text: "La sección y el número de la inspección", options: { bullet: true } },
    ],
    { x: M + 7.65, y: 2.75, w: 3.85, h: 2.0, valign: "top",
      fontFace: FUENTE, fontSize: 13, color: TINTA_MED, paraSpaceAfter: 8, margin: 0 },
  );
  s.addText("Con esos tres datos se resuelve rápido.", {
    x: M + 7.6, y: 5.05, w: 3.9, h: 0.45,
    fontFace: FUENTE, fontSize: 12.5, italic: true, color: GRIS, margin: 0,
  });
  pie(s, "Solo la información verificada sirve como base para la notificación formal al cliente.");
}

// ---------------------------------------------------------------------------
// 14. Qué pasa después
// ---------------------------------------------------------------------------
{
  const s = hoja("Qué pasa cuando cierras", "Numerales 4.5 y 4.6");
  const flujo = [
    ["Notificación", "El sistema avisa al supervisor"],
    ["Revisión", "Coherencia, completitud y fotos"],
    ["Retrabajo", "Si hay fallas, vuelve a ti"],
    ["Aprobación", "Sello con el 100 % correcto"],
    ["Reporte", "Se genera el documento final"],
  ];
  flujo.forEach((f, i) => {
    const x = M + i * 2.42;
    tarjeta(s, x, 2.15, 2.15, 2.8, i === 2 ? "FEF2F2" : BLANCO);
    ficha(s, x + 0.78, 2.55, i + 1, 0.6);
    s.addText(f[0], {
      x: x + 0.12, y: 3.42, w: 1.9, h: 0.32,
      fontFace: FUENTE, fontSize: 14, bold: true, color: i === 2 ? ROJO_OSC : TINTA,
      align: "center", margin: 0,
    });
    cuerpo(s, f[1], {
      x: x + 0.12, y: 3.8, w: 1.9, h: 0.95, fontSize: 11.5, align: "center",
    });
    if (i < 4) {
      s.addText("›", {
        x: x + 2.13, y: 3.05, w: 0.3, h: 0.4,
        fontFace: FUENTE, fontSize: 22, bold: true, color: GRIS_SUAVE,
        align: "center", margin: 0,
      });
    }
  });
  s.addText("Cada dato flojo devuelve el ciclo varios pasos atrás. Por eso el retrabajo se siente.", {
    x: M, y: 5.35, w: W - 2 * M, h: 0.45,
    fontFace: FUENTE, fontSize: 15, bold: true, color: ROJO_OSC, margin: 0,
  });
  pie(s, "IT-OPE-C-12, numerales 4.5 y 4.6");
}

// ---------------------------------------------------------------------------
// 15. Cómo reportar
// ---------------------------------------------------------------------------
{
  const s = hoja("Reportar fallas y proponer mejoras", "Numeral 5.3");
  cuerpo(s,
    "El instructivo es explícito: ante cualquier problema técnico, error, falla de " +
    "funcionamiento o dificultad de llenado, hay que informar directamente y de manera " +
    "inmediata al Área de Desarrollo.",
    { x: M, y: 1.85, w: 11.8, h: 0.9, fontSize: 15 });

  tarjeta(s, M, 2.95, 5.75, 2.7, BLANCO);
  s.addText("Ese canal ya existe", {
    x: M + 0.35, y: 3.2, w: 5.0, h: 0.35,
    fontFace: FUENTE, fontSize: 17, bold: true, color: TINTA, margin: 0,
  });
  s.addText(
    [
      { text: "Queda con número de radicado", options: { bullet: true, breakLine: true } },
      { text: "No se pierde ni se olvida", options: { bullet: true, breakLine: true } },
      { text: "Si dejas tu correo, te llega copia", options: { bullet: true } },
    ],
    { x: M + 0.4, y: 3.75, w: 5.0, h: 1.7, valign: "top",
      fontFace: FUENTE, fontSize: 13.5, color: TINTA_MED, paraSpaceAfter: 8, margin: 0 },
  );

  tarjeta(s, M + 6.05, 2.95, 5.75, 2.7, "FEF2F2");
  s.addText("Pestaña “Reportar”", {
    x: M + 6.4, y: 3.2, w: 5.0, h: 0.35,
    fontFace: FUENTE, fontSize: 17, bold: true, color: ROJO_OSC, margin: 0,
  });
  cuerpo(s,
    "En la misma página de la capacitación, arriba. Elige la aplicación, di qué pasó " +
    "y envía. Te devuelve un número tipo MEJ-0007.",
    { x: M + 6.4, y: 3.75, w: 5.0, h: 1.6, fontSize: 13.5 });

  s.addText("Una idea dicha de palabra en campo se olvida. Una radicada, no.", {
    x: M, y: 5.95, w: W - 2 * M, h: 0.45,
    fontFace: FUENTE, fontSize: 15, bold: true, color: ROJO_OSC, margin: 0,
  });
}

// ---------------------------------------------------------------------------
// 16. Cierre
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: TINTA };
  s.addShape(pres.ShapeType.roundRect, {
    x: W - M - 3.3, y: H - 1.75, w: 3.3, h: 1.05, rectRadius: 0.1,
    fill: { color: BLANCO }, line: { color: BLANCO, width: 0 },
  });
  s.addImage({ path: LOGO, x: W - M - 3.05, y: H - 1.55, w: 2.8, h: 0.64 });

  s.addText("PARA CERRAR", {
    x: M, y: 1.3, w: W - 2 * M, h: 0.35,
    fontFace: FUENTE, fontSize: 13, bold: true, color: ROJO_CLARO, charSpacing: 2, margin: 0,
  });
  s.addText("Registra tu constancia", {
    x: M, y: 1.75, w: 11.5, h: 0.85,
    fontFace: FUENTE, fontSize: 38, bold: true, color: BLANCO, margin: 0,
  });
  cuerpo(s,
    "Entra a la plataforma de capacitación, elige la aplicación con la que vas a trabajar, " +
    "recorre los módulos y presenta la evaluación. Al aprobarla registras tus datos y queda " +
    "tu constancia — es el registro de asistencia de esta sesión.",
    { x: M, y: 2.8, w: 8.2, h: 1.6, fontSize: 15, color: GRIS_SUAVE });

  // Bloque del enlace. Reemplazar por el QR cuando el sitio esté publicado.
  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 4.15, w: 8.2, h: 1.1, rectRadius: 0.12,
    fill: { color: "1E293B" }, line: { color: TINTA_MED, width: 1 },
  });
  s.addText("La plataforma", {
    x: M + 0.35, y: 4.32, w: 7.5, h: 0.3,
    fontFace: FUENTE, fontSize: 12, bold: true, color: ROJO_CLARO, charSpacing: 1.2, margin: 0,
  });
  s.addText("[ pega aquí la URL o el código QR de la plataforma ]", {
    x: M + 0.35, y: 4.66, w: 7.5, h: 0.4,
    fontFace: FUENTE, fontSize: 17, bold: true, color: BLANCO, margin: 0,
  });

  s.addText(
    [
      { text: "Diego Alejandro Hernández Blanco", options: { bold: true, color: BLANCO, breakLine: true } },
      { text: "Área de Desarrollo · 321 629 1861", options: { color: GRIS_SUAVE } },
    ],
    { x: M, y: 5.6, w: 6, h: 0.8, fontFace: FUENTE, fontSize: 14, margin: 0 },
  );
  s.addNotes("Repartir el enlace o el QR de la plataforma antes de terminar la sesión.");
}

pres.writeFile({ fileName: SALIDA }).then(() => {
  console.log("escrito:", SALIDA, fs.statSync(SALIDA).size, "bytes");
});
