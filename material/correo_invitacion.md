# Correo de invitación a la capacitación

Para enviar al personal operativo (102 personas en OPERACIONES según el listado).
Hay tres textos: la invitación, un recordatorio para dos semanas después, y una
línea corta para WhatsApp o para pegar en la descripción de las apps.

**Envíalo desde el correo corporativo**, no desde la plataforma. Y mándalo en
copia oculta (CCO) si va a varios: 102 correos visibles en el encabezado es
regalar el directorio.

---

## 1. Invitación

**Asunto:** Capacitación del proceso de inspección — 25 minutos, desde el celular

> Hola,
>
> Ya está lista la capacitación sobre el proceso de inspección y la generación
> automática de reportes. Es sobre lo que hacemos todos los días: desde que te
> asignan la inspección hasta que sale el reporte que se le entrega al cliente.
> Está basada en el instructivo IT-OPE-C-12.
>
> **Se hace aquí:** https://adc-capacitacion.pages.dev
>
> Para entrar necesitas dos cosas:
>
> - **Tu correo corporativo**, el mismo al que te llegó este mensaje.
> - **Tu número de cédula**, sin puntos ni comas.
>
> No te pedimos la contraseña del correo ni ninguna otra clave. Si alguna
> página te pide la contraseña de tu correo, no es esta: ciérrala y avísame.
>
> Toma unos **25 minutos** y se puede hacer desde el celular. Son la
> presentación, el instructivo, un repaso de los puntos clave y una evaluación
> de 8 preguntas; se aprueba con 6. Si no la pasas la puedes repetir, no queda
> penalizado nada.
>
> Al empezar te pide escoger **el formato sobre el que trabajas** (espesores,
> partículas magnéticas, visual de recipientes, el que sea). El contenido es el
> mismo para todos; eso es solo para que quede en tu constancia.
>
> Cuando termines te llega **la constancia al correo**. Esa constancia reemplaza
> el formato de asistencia en papel (F-SIG-19), así que no hay que firmar nada
> más ni mandar nada de vuelta.
>
> **Una cosa más.** En la misma página hay una pestaña para **reportar fallas de
> las aplicaciones o proponer mejoras**. Esa no pide entrar con nada. Si una app
> se te cae, si un formato te pide algo que en campo no tiene sentido, o si se
> te ocurre cómo hacerlo más rápido, escríbelo ahí: cada reporte queda con un
> número y se responde. Es la vía para que eso deje de quedarse en el comentario
> de pasillo.
>
> Si tu correo o tu cédula no te dejan entrar, escríbeme y lo reviso. Puede ser
> que el dato esté desactualizado en el listado de Talento Humano.
>
> Diego Alejandro Hernández Blanco
> Ingeniero de Desarrollo e Integridad
> Área de desarrollo — ADEMINCOL S.A.S.

---

## 2. Recordatorio (dos semanas después)

Mándalo solo a quienes falten. La lista sale de la pestaña **Bases → Faltan**,
con botón de CSV.

**Asunto:** Te falta la capacitación del proceso de inspección (25 minutos)

> Hola,
>
> Te escribo porque todavía no aparece tu constancia de la capacitación del
> proceso de inspección y reportes.
>
> Son 25 minutos y se hace desde el celular: https://adc-capacitacion.pages.dev
> Entras con tu correo corporativo y tu cédula.
>
> Si ya la empezaste y se te quedó a medias, se retoma desde el principio —
> perdón por eso, pero son 25 minutos.
>
> Si tienes algún problema para entrar, dime y lo reviso.
>
> Diego Alejandro Hernández Blanco
> Área de desarrollo — ADEMINCOL S.A.S.

---

## 3. Línea corta

Para WhatsApp, para la cartelera o para pegar en la descripción de cada
aplicación de AppSheet:

> **Capacitación del proceso de inspección** (25 min, desde el celular):
> https://adc-capacitacion.pages.dev — entras con tu correo corporativo y tu
> cédula. Al terminar te llega la constancia.
>
> ¿Falla algo de la app o se te ocurre una mejora? Repórtalo en la misma página,
> pestaña **Reportar**. No hay que entrar con nada.

Para imprimir o proyectar hay un código QR del enlace en
`material/qr/qr_plataforma.png`.

---

## Notas para quien envía

- **Copia oculta.** 102 correos en el encabezado es regalar el directorio.
- **Un correo antes del cierre de mes** funciona mejor que uno a mitad: la gente
  de campo revisa el correo cuando está en oficina.
- **No prometas plazo si no lo vas a hacer cumplir.** La versión de arriba no
  pone fecha límite a propósito; si Talento Humano quiere una, agrégala tú, que
  eres quien puede sostenerla.
- **Lo del phishing es en serio.** El correo pide entrar a un dominio que no es
  `ademincol.com.co` y escribir el correo corporativo: es la forma exacta de un
  ataque de suplantación. Por eso el texto dice explícitamente que no se pide la
  contraseña del correo. Lo que resolvería el problema de raíz es poner la
  plataforma en un subdominio propio — `capacitacion.ademincol.com.co` — que en
  Cloudflare Pages no cuesta nada. Ver README.
