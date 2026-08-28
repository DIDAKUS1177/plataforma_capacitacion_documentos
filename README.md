# adc-capacitación

Capacitación de inspectores y buzón de mejoras de ADEMINCOL.

Una sola aplicación web con **dos pestañas**:

- **Capacitación** — el inspector se registra, recorre el material oficial,
  repasa los puntos clave, presenta la evaluación y firma su constancia.
- **Reportar** — el buzón de fallas y propuestas de mejora.

El recorrido es el mismo para todas las aplicaciones: el proceso no cambia
entre ellas, lo que cambia es el formato que se diligencia. Por eso el formato
se pregunta en el registro y no parte el contenido en cursos distintos.

```
Entrar → Formato → Presentación → Instructivo → Puntos clave → Evaluación → Constancia
```

Los 145 del listado tienen correo y cédula, sin repetidos ni vacíos, así que
todos pueden entrar. 142 son `@ademincol.com.co`; los 3 restantes son aprendices
del SENA con Gmail, y por eso **la entrada no exige dominio corporativo**.

**Se entra con el correo y la cédula**: el correo es el usuario y la cédula la
clave. Con eso la plataforma trae del listado de personal el nombre, el cargo y
el área, y por eso el primer paso del curso ya no pide seis datos: solo el
formato sobre el que se capacita.

Ese primer paso **se guarda de una**, antes de que vea nada, así queda rastro de
quien empieza y no termina; y al llegar a la constancia no hay que teclear nada.

Quien no aparece en el listado entra sin registro y escribe sus datos a mano. Un
contratista que llega hoy tiene que poder capacitarse hoy.

Todo se guarda en Google Sheets.

Mismo stack y mismo lenguaje visual que el frontend de ADEMINCOL Central:
React 19 + Vite + TypeScript + Tailwind 4, con los mismos tokens de color.

## Por qué no es Apps Script

La primera versión se hizo en Apps Script y se descartó: el editor y el runtime
dan problemas y no hay un flujo de trabajo con git de verdad.

Aquí no hay Apps Script en ninguna parte. La página es estática y las cuatro
funciones que hablan con Google corren en **Cloudflare Pages Functions**, con la
llave del service account guardada como secreto del proyecto — nunca en el
código que descarga el navegador.

Cloudflare Pages se eligió sobre Vercel porque su plan gratuito **sí permite uso
comercial**; el plan Hobby de Vercel no. Y sobre GitHub Pages porque Pages solo
sirve archivos estáticos: no puede escribir en un Sheet sin un backend aparte.

## Arquitectura

```
Inspector (celular)
   → Cloudflare Pages  ── estático: React
        └ /api/*       ── Pages Functions (service account)
             → Google Sheets   (constancias · respuestas · mejoras)
             → Gmail API       (constancia por correo)
```

| Ruta | Qué hace |
|---|---|
| `GET /api/config` | Dominio corporativo y si se exige firma. Nada secreto |
| `POST /api/registro` | Deja constancia de quién empezó, antes de ver nada |
| `GET /api/aplicaciones` | Catálogo de apps del Listado Maestro de Calidad (solo lectura, caché 6 h) |
| `POST /api/constancia` | Valida, evita duplicados, escribe y manda el correo |
| `POST /api/mejora` | Radica la falla o la sugerencia y devuelve el número |
| `GET /api/verificar` | Comprueba una constancia por su código. Público, datos mínimos |
| `POST /api/consulta` | Estado de un reporte del buzón. Pide número **y** correo |
| `POST /api/entrar` | Correo + cédula → los datos de esa persona. Los dos tienen que casar |
| `POST /api/bases` | Todo lo que guarda la plataforma. Solo para `CEDULAS_ADMIN` |
| `GET /api/historial` | Qué capacitaciones lleva una cédula. Solo formación |
| `POST /api/notificar` | Manda los correos de las respuestas nuevas. Protegido con clave |

## Estructura

```
src/contenido/curso.ts       ← EL ÚNICO ARCHIVO QUE SE EDITA para cambiar el curso
material/                     Los PDF y el PPTX de origen (ver material/README.md)
public/material/              El material convertido a imágenes, con su indice.json
src/pages/                    Entrar · Registro · Material · PuntosClave · Evaluación · Constancia · Reportar
src/components/Visor.tsx      Pasa páginas del material, una a la vez
src/components/Layout.tsx     Dos niveles de pestañas y el avance
src/lib/aplicaciones.tsx      Catálogo del Listado Maestro, cargado una sola vez
src/lib/sesion.tsx            Quién entró. sessionStorage, no localStorage
src/lib/progreso.tsx          Qué pasos hizo y si aprobó
shared/validacion.ts          Validación compartida cliente ↔ servidor
functions/api/                Las funciones del servidor y sus utilidades
scripts/init_sheet.py         Crea/completa las hojas y encabezados del Sheet
scripts/generar_imagenes.py   Rehace las imágenes del material
```

### Rutas

| Ruta | Qué es |
|---|---|
| `/entrar` | Se escribe la cédula y se confirma la identidad |
| `/capacitacion` | Escoger el formato. Sin esto no se abre nada más |
| `/capacitacion/diapositivas` | Las 16 diapositivas, una a la vez |
| `/capacitacion/manual` | Las 19 páginas del IT-OPE-C-12 |
| `/capacitacion/puntos-clave` | El repaso de lo que se evalúa |
| `/capacitacion/evaluacion` | Se abre al recorrer todo el material |
| `/capacitacion/constancia` | Se abre al aprobar |
| `/reportar?app=APP-022` | Buzón, con la app precargada. **Sin sesión** |
| `/mis-cursos` | Qué capacitaciones lleva una persona |
| `/bases` | Todas las hojas, de solo lectura. Solo la ve quien esté en `CEDULAS_ADMIN` |
| `/mi-reporte?id=MEJ-0007` | Consultar en qué quedó lo reportado. **Sin sesión** |
| `/verificar/<id>` | Lo que abre el QR. Público y fuera del curso |

### El listado de personal

`scripts/importar_personal.py` carga el Excel de RR. HH. a la hoja `personal`
(145 personas). Se usa para tres cosas: la entrada a la plataforma, llenar los
datos del registro, y saber quién falta por capacitarse.

```bash
python scripts/importar_personal.py <service-account.json> "Base personal activo.xlsx"
```

La hoja se reemplaza entera en cada corrida: la fuente de verdad es el Excel.
**No se importa el correo personal** — para lo que hace la plataforma basta el
corporativo.

Quien no esté en el listado **puede capacitarse igual**, llenando los datos a
mano: un contratista nuevo tiene que poder hacerlo el mismo día que llega.

### Tablero de cobertura

```bash
python scripts/tablero_cobertura.py <service-account.json>
```

Crea las hojas `cobertura` y `pendientes` en el mismo Sheet. Los números son
**fórmulas**, no valores copiados: se actualizan solos a medida que la gente se
capacita. Solo hay que volver a correr el script si RR. HH. agrega un área
nueva, para que aparezca su fila.

Vive en el Sheet y no en la plataforma a propósito: son datos de gestión —quién
falta, con nombre y correo— y la plataforma la abre cualquiera que tenga el
enlace.

Mide dos coberturas, y la segunda es la que importa: **todo el personal** (145)
y **solo OPERACIONES** (102). Contabilidad o los conductores no ejecutan
inspecciones, así que contarlos en el denominador solo hace ver peor un número
que no les corresponde.

### Qué pide sesión y qué no

Solo **Capacitación** y **Mis cursos**, que son las que dejan un registro a
nombre de alguien. El buzón queda abierto a propósito:

- El acuse por correo trae el enlace `/mi-reporte?id=MEJ-0007`. Con login de por
  medio ese enlace deja de servir.
- Los enlaces `/reportar?app=APP-022` van pegados en la descripción de cada app
  de AppSheet. Son una puerta de una pulsación; un muro les quita el sentido.
- Un buzón de quejas con muro de entrada recibe menos quejas, y las que más
  sirven son justo las que la gente no manda si siente que queda marcada.

Quien llega directo al buzón ve un botón **Entrar** en la cabecera, por si de
paso quiere capacitarse.

### Sobre la entrada

Hay que decirlo sin rodeos: **esto identifica, no autentica.** La cédula no es un
secreto — está en los formatos en papel, en RR. HH. y la saben los compañeros.
Pedirla junto con el correo sube bastante el listón frente a pedir solo la
cédula, pero no la convierte en una contraseña.

Lo que sostiene el valor de la constancia sigue siendo la declaración que se
acepta al final, igual que la firma del F-SIG-19 en papel que reemplaza. La
plataforma no empeora nada respecto de lo que había; lo que agrega es rastro:
fecha, hora, resultado y un código verificable.

Lo que sí se hizo:

- **Los dos campos tienen que casar en la MISMA fila** de `personal`. No basta
  con que ambos existan por separado.
- **Un solo mensaje de error** para los tres fallos —correo que no existe, cédula
  que no coincide, o ninguno—, para no confirmar qué correos están en el listado.
- **Se eliminó `GET /api/persona?cedula=`**, que devolvía nombre y correo con
  solo la cédula: cualquiera podía recorrer números y sacar el directorio.
- **La constancia va al correo del listado**, nunca a uno escrito a mano.
- **`/api/historial` devuelve únicamente formación**: curso, formato, fecha,
  resultado y el código. Ni correo, ni cargo, ni teléfono.
- **La sesión vive en `sessionStorage`.** En una tablet compartida en campo,
  cerrar el navegador basta para salir; Salir además recarga la página para que
  el siguiente no herede el progreso del anterior.

Lo que **no** hace, y conviene saberlo: no resiste fuerza bruta. Una cédula son
de 7 a 10 dígitos y no hay bloqueo por intentos fallidos. Si algún día eso
importa, lo indicado es un código de seis dígitos al correo; el cambio sería
pedirlo después de validar la cédula, sin tocar el resto.

### La pestaña Bases

Muestra en un solo lugar y **de solo lectura** todo lo que guarda la plataforma:
resumen y cobertura, constancias, inicios, buzón, quiénes faltan y el listado de
personal. Cada tabla tiene buscador y botón de CSV.

**No hay ningún enlace al Sheet**, a propósito: esta pantalla no puede volverse
la puerta de entrada para editar o borrar las bases. Para escribir se abre el
Sheet a mano, sabiendo lo que se hace.

Quién la ve sale de la variable `CEDULAS_ADMIN` (cédulas separadas por coma), en
el servidor. **No puede ir en el código del navegador**: la cédula es la mitad
de la credencial de entrada, así que publicarla en el bundle sería regalarla.

Esconder la pestaña no protege nada — cualquiera puede fabricarse una sesión
desde la consola del navegador, y de hecho se probó. Lo que protege es que
`POST /api/bases` vuelva a verificar, en cada petición y sin creerle nada al
cliente:

1. que el correo y la cédula casen en la misma fila de `personal`;
2. que esa cédula esté en `CEDULAS_ADMIN`;
3. que, si `CLAVE_ADMIN` está configurada, venga también esa clave.

Cuando algo falla responde **404 y no 403**: un 403 confirmaría que la pestaña
existe y que esa cédula es de un administrador.

`CLAVE_ADMIN` viene vacía. Ponerla es una variable, no un cambio de código, y
vale la pena si algún día preocupa que la cédula no sea un secreto y esa
pantalla muestre el directorio completo.

### El ciclo del buzón

1. El inspector reporta y recibe un acuse con su número y el enlace de consulta.
2. **Tú escribes en el Sheet**: `estado`, `responsable`, `respuesta`,
   `fecha_respuesta`.
3. Cada 15 minutos, el Worker `notificador/` le toca el timbre a
   `POST /api/notificar`, que manda el correo de las filas con `respuesta`
   escrita y `notificado_en` vacía, y luego las marca.
4. El inspector también puede consultar cuando quiera en **Mi reporte**, con su
   número y su correo.

**Por qué un Worker aparte:** Cloudflare Pages **no soporta tareas
programadas**; los disparos por tiempo solo los tienen los Workers. Ese Worker
no guarda ninguna credencial de Google — solo la URL de la plataforma y la
clave compartida.

```bash
cd notificador && npx wrangler deploy        # desplegarlo
curl "https://adc-notificador.<cuenta>.workers.dev/?clave=<CLAVE>"   # dispararlo a mano
```

**La consulta pide número Y correo** porque los números son consecutivos: solo
con el número, cualquiera recorrería los reportes de todos, y ahí están el
nombre y el correo de quien reportó. Un número inexistente y un correo que no
corresponde dan **el mismo mensaje**, para no confirmar qué números existen.

### El QR de la constancia

Al registrar la constancia se genera un `id_constancia` **aleatorio de 64 bits**
y se guarda al final de la hoja. El QR aparece en la pantalla de "Listo" y
apunta a `/verificar/<id>`; el correo lleva el mismo enlace en texto —
**dentro del correo no va el QR como imagen** porque Gmail bloquea las
imágenes en `data:` URI y no se vería.

La página de verificación es pública, así que devuelve lo mínimo: nombre,
curso, formato, fecha y resultado, con la **cédula enmascarada** (`****6432`).
Ni correo, ni cargo, ni las respuestas. Y el id es aleatorio y no consecutivo:
con ids seguidos cualquiera podría recorrer la página sacando nombres y
cédulas.

### Actualizar el material

Cambia el PDF o el PPTX en `material/` y vuelve a correr:

```bash
python scripts/generar_imagenes.py
```

Regenera `public/material/` y su `indice.json` (cuántas páginas tiene cada
documento). Va como imágenes y no como PDF embebido porque en el navegador del
celular el visor de PDF a veces no renderiza y termina descargando el archivo.

`shared/validacion.ts` lo usan los dos lados a propósito: si viviera duplicado
se desincroniza y el servidor termina aceptando lo que el formulario rechazaba.
El servidor **no confía** en la validación del navegador — se puede saltar desde
la consola —, por eso la vuelve a correr.

## Puesta en marcha

### 1. El Sheet

Ya está creado y con sus tres hojas:
`1z0Wcc2-A0S6JCVjm_e3kfcXZgZMgr3g_VpOTMq6X3IU` (`capacitacion_recomendaciones`).

Para recrearlo o repararlo (es idempotente y no borra nada):

```bash
python scripts/init_sheet.py ruta/al/service-account.json
```

### 2. Local

```bash
npm install
cp .dev.vars.example .dev.vars   # y llenar la llave privada
npm run dev:full
```

- `npm run dev` — solo el frontend, con recarga en caliente. Las llamadas a
  `/api` fallan con mensaje claro; sirve para trabajar el diseño.
- `npm run local` — **el despliegue local de verdad**: compila y levanta el
  runtime de Cloudflare con las funciones, contra los Sheets reales. Es
  exactamente lo que va a correr en producción.

### 3. Cloudflare Pages

1. Sube el repo a GitHub.
2. Cloudflare → **Workers & Pages** → **Create** → **Pages** → conecta el repo.
3. Build command `npm run build`, output directory `dist`.
4. **Settings → Environment variables** — las de `.dev.vars.example`.
   `GOOGLE_PRIVATE_KEY` va marcada como **Secret**, no como texto plano.
5. Cada `git push` a `main` despliega solo.

### 4. Correo — hay que habilitarlo una vez

Se manda correo en dos momentos:

| Cuándo | A quién |
|---|---|
| Al terminar la capacitación | Constancia a quien se capacitó, con copia a calidad |
| Al radicar en el buzón | Acuse con el número `MEJ-XXXX` a quien reportó (si dejó correo), con copia a calidad. Si no dejó correo, el aviso va solo a calidad |

Los correos salen de un buzón de Gmail propio, sin proveedores externos. Hay
**dos vías** y la app soporta las dos; cuál sirve depende de si la empresa tiene
Google Workspace.

#### Vía A — delegación de dominio (solo con Google Workspace)

El admin autoriza al service account y no hay tokens que rotar.

1. **Admin de Workspace → Seguridad → Acceso y control de datos → Controles de API → Delegación de todo el dominio → Añadir nueva.**
2. *ID de cliente:* `115739041447549151454`
3. *Ámbito:* `https://www.googleapis.com/auth/gmail.send`
4. `GMAIL_REMITENTE` = el buzón desde el que sale, ej. `capacitaciones@tudominio.com`.

**No sirve con un `@gmail.com` corriente.** Un service account solo puede
suplantar cuentas de un dominio que administra; con una cuenta personal Google
responde `invalid_grant / Invalid email or User ID`.

#### Vía B — OAuth de usuario (sirve con `@gmail.com` y con Workspace)

El dueño del buzón autoriza una vez desde el navegador:

```bash
pip install google-auth-oauthlib
python scripts/autorizar_gmail.py ruta/al/drive-oauth-client.json
```

Deja los valores en `gmail-token.local.json` (ignorado por git). Se copian a las
variables de entorno: `GMAIL_REMITENTE`, `GMAIL_CLIENT_ID`,
`GMAIL_CLIENT_SECRET` y `GMAIL_REFRESH_TOKEN` — las dos últimas como **Secret**.

**La API de Gmail tiene que estar habilitada en el proyecto de Google Cloud**
(APIs y servicios → Biblioteca → Gmail API → Habilitar). Si no lo está, Google
responde `PERMISSION_DENIED: Gmail API has not been used in project … or it is
disabled`, aunque el token sea válido.

Límite de una cuenta Gmail gratuita: ~500 destinatarios al día. Con Workspace,
2.000.

Configurado el 2026-08-25: los correos salen de `desarrolloademincol@gmail.com`.

Si están configuradas las dos vías gana la B, por ser la explícita.

**Mientras no haya ninguna nada se rompe:** el registro se guarda igual, la
pantalla no promete un correo que no salió, y en los logs de Cloudflare queda
`Correo NO enviado …: falta GMAIL_REMITENTE`.

## Editar el curso

Todo está en [`src/contenido/curso.ts`](src/contenido/curso.ts).

- `modulos` — agregar, quitar o reordenar. Las pestañas, la barra de progreso y
  los botones Anterior/Siguiente se rearman solos.
- `preguntas` — `correcta` es el **índice** de la opción correcta, desde 0.
- `version` — **súbela cada vez que cambies el contenido.** Queda escrita en
  cada constancia, así se sabe quién se capacitó con qué material.

Para imágenes: súbelas a Drive con permiso de lectura y usa
`<img src="https://lh3.googleusercontent.com/d/ID_DEL_ARCHIVO">`.

## Reglas ya implementadas

- Nada se abre hasta registrarse, y la evaluación hasta llegar al final de los
  dos documentos.
- La constancia no se abre hasta **aprobar** (4 de 5 por defecto).
- Se puede repetir la evaluación; las falladas quedan marcadas.
- Se guarda `minutos_en_capacitacion`: si alguien "hizo" el curso en 40
  segundos, se nota.
- No se registra dos veces la misma cédula **en la misma aplicación** — pasa
  cuando se cae la señal y vuelven a enviar. En otra app sí puede registrarse.
- Las apps en estado `Out` del Listado Maestro no aparecen en el selector.
- Correo obligatoriamente del dominio corporativo.
- Casilla de autorización de tratamiento de datos (Ley 1581), porque se guarda
  la cédula.
- Las fechas se escriben en hora de Bogotá, no en UTC: si no, un registro de las
  8 p.m. queda con la fecha del día siguiente.

## Cómo entra el inspector

No hay usuario ni contraseña: se entra por el enlace.

1. Abre `https://<tu-sitio>.pages.dev`.
2. Elige en el buscador la aplicación sobre la que se va a capacitar.
3. Módulos → evaluación → constancia con nombre, cédula y correo.

La forma práctica de repartirlo es un **QR** de esa URL, pegado en la tablet y
puesto en la descripción de cada app de AppSheet.

### Enlaces desde las apps de AppSheet

En la descripción de cada app, dos líneas y dos enlaces:

```
📘 Capacitación → https://<tu-sitio>.pages.dev/capacitacion/APP-022
💡 Reportar     → https://<tu-sitio>.pages.dev/reportar?app=APP-022
```

Los dos abren directo en la app correcta, sin que el inspector tenga que
buscarla en la lista.

## Qué NO toca

Ningún Sheet de producción de AppSheet. Del Listado Maestro solo **lee**, y con
caché de 6 horas porque comparte la cuota de 60 lecturas/minuto con los reportes
de ADEMINCOL Central.

## Pendiente

- [ ] Reemplazar los módulos marcados `PENDIENTE` con el manual y el PPT.
- [ ] Revisar las 5 preguntas (están en borrador).
- [ ] Confirmar `DOMINIO_CORPORATIVO`.
- [ ] Delegación de dominio para el correo.
- [ ] Conectar `LISTADO_MAESTRO_ID`.
- [ ] Borrar la pestaña `Hoja 1` del Sheet: tiene una fila de prueba de escritura.
- [ ] Panel de seguimiento en ADEMINCOL Central leyendo estas tres hojas.
