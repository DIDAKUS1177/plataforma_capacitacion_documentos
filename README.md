# adc-capacitación

Capacitación de inspectores y buzón de mejoras de ADEMINCOL.

Una sola aplicación web: el curso por módulos, la evaluación, la constancia
firmada y el formulario para reportar fallas o proponer mejoras. Todo se guarda
en Google Sheets.

Mismo stack y mismo lenguaje visual que el frontend de ADEMINCOL Central:
React 19 + Vite + TypeScript + Tailwind 4, con los mismos tokens de color.

## Por qué no es Apps Script

La primera versión se hizo en Apps Script y se descartó: el editor y el runtime
dan problemas y no hay un flujo de trabajo con git de verdad.

Aquí no hay Apps Script en ninguna parte. La página es estática y las tres
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
| `GET /api/aplicaciones` | Lista para el desplegable del buzón (Listado Maestro, con respaldo) |
| `POST /api/constancia` | Valida, evita duplicados, escribe y manda el correo |
| `POST /api/mejora` | Radica la falla o la sugerencia y devuelve el número |

## Estructura

```
src/contenido/curso.ts    ← EL ÚNICO ARCHIVO QUE SE EDITA para cambiar el curso
src/pages/                 Inicio · Módulo · Evaluación · Constancia · Reportar
src/components/            Layout (pestañas + progreso), ui, FirmaPad
src/lib/progreso.tsx       Qué módulos vio y si aprobó
shared/validacion.ts       Validación compartida cliente ↔ servidor
functions/api/             Las cuatro funciones y sus utilidades
scripts/init_sheet.py      Crea las hojas y encabezados del Sheet
```

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

- `npm run dev` levanta solo el frontend (las llamadas a `/api` fallan con
  mensaje claro, útil para trabajar el diseño).
- `npm run dev:full` levanta también las funciones, contra el Sheet real.

### 3. Cloudflare Pages

1. Sube el repo a GitHub.
2. Cloudflare → **Workers & Pages** → **Create** → **Pages** → conecta el repo.
3. Build command `npm run build`, output directory `dist`.
4. **Settings → Environment variables** — las de `.dev.vars.example`.
   `GOOGLE_PRIVATE_KEY` va marcada como **Secret**, no como texto plano.
5. Cada `git push` a `main` despliega solo.

### 4. Correo (opcional)

Los correos salen del propio Workspace con la API de Gmail, sin proveedores
externos. Hace falta autorizar el service account una vez:

**Admin de Workspace → Seguridad → Control de datos y acceso → Delegación de
todo el dominio** → agregar el *client ID* del service account con el scope
`https://www.googleapis.com/auth/gmail.send`. Luego poner en `GMAIL_REMITENTE`
el buzón desde el que se envía (ej. `capacitaciones@ademincol.com`).

Sin esto configurado, la constancia **igual se guarda**; solo no se manda el
correo.

## Editar el curso

Todo está en [`src/contenido/curso.ts`](src/contenido/curso.ts):

- `modulos` — agregar, quitar o reordenar. Las pestañas, la barra de progreso y
  los botones Anterior/Siguiente se rearman solos.
- `preguntas` — `correcta` es el **índice** de la opción correcta, desde 0.
- `version` — **súbela cada vez que cambies el contenido.** Queda escrita en
  cada constancia, así se sabe quién se capacitó con qué material.

Para imágenes: súbelas a Drive con permiso de lectura y usa
`<img src="https://lh3.googleusercontent.com/d/ID_DEL_ARCHIVO">`.

## Reglas ya implementadas

- La evaluación no se abre hasta recorrer **todos** los módulos.
- La constancia no se abre hasta **aprobar** (4 de 5 por defecto).
- Se puede repetir la evaluación; las falladas quedan marcadas.
- Se guarda `minutos_en_capacitacion`: si alguien "hizo" el curso en 40
  segundos, se nota.
- No se registra dos veces la misma cédula en el mismo curso — pasa cuando se
  cae la señal y vuelven a enviar.
- Correo obligatoriamente del dominio corporativo.
- Casilla de autorización de tratamiento de datos (Ley 1581), porque se guarda
  la cédula.
- Las fechas se escriben en hora de Bogotá, no en UTC: si no, un registro de las
  8 p.m. queda con la fecha del día siguiente.

## Enlaces desde las apps de AppSheet

En la descripción de cada app, dos líneas y dos enlaces. El de reportar acepta
la app precargada:

```
https://<tu-sitio>.pages.dev/reportar?app=APP-022%20Part%C3%ADculas%20Magn%C3%A9ticas%20MT
```

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
