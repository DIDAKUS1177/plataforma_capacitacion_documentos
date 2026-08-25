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
Registro → Presentación → Instructivo → Puntos clave → Evaluación → Constancia
```

El **registro va primero y se guarda de una**, antes de que vea nada: así queda
rastro de quien empieza y no termina, y al llegar a la constancia ya no hay que
teclear nada.

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

## Estructura

```
src/contenido/curso.ts       ← EL ÚNICO ARCHIVO QUE SE EDITA para cambiar el curso
material/                     Los PDF y el PPTX de origen (ver material/README.md)
public/material/              El material convertido a imágenes, con su indice.json
src/pages/                    Registro · Material · PuntosClave · Evaluación · Constancia · Reportar
src/components/Visor.tsx      Pasa páginas del material, una a la vez
src/components/Layout.tsx     Dos niveles de pestañas y el avance
src/lib/aplicaciones.tsx      Catálogo del Listado Maestro, cargado una sola vez
src/lib/progreso.tsx          Quién es, qué pasos hizo y si aprobó
shared/validacion.ts          Validación compartida cliente ↔ servidor
functions/api/                Las cinco funciones y sus utilidades
scripts/init_sheet.py         Crea/completa las hojas y encabezados del Sheet
scripts/generar_imagenes.py   Rehace las imágenes del material
```

### Rutas

| Ruta | Qué es |
|---|---|
| `/capacitacion` | Registro. Sin esto no se abre nada más |
| `/capacitacion/diapositivas` | Las 16 diapositivas, una a la vez |
| `/capacitacion/manual` | Las 19 páginas del IT-OPE-C-12 |
| `/capacitacion/puntos-clave` | El repaso de lo que se evalúa |
| `/capacitacion/evaluacion` | Se abre al recorrer todo el material |
| `/capacitacion/constancia` | Se abre al aprobar |
| `/reportar?app=APP-022` | Buzón, con la app precargada |

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
