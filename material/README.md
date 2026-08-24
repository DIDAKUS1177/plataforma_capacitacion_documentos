# Material fuente de la capacitación

De aquí sale el contenido de `src/contenido/curso.ts`. Cuando se actualice
alguno de estos documentos, se actualizan los módulos **y se sube la `version`
del curso** — esa versión queda escrita en cada constancia.

| Archivo | Qué es |
|---|---|
| `IT-OPE-C-12_instructivo_...pdf` | Instructivo del proceso, rev. 01, aprobado 09-04-2026. Es la fuente formal de los módulos |
| `presentacion_dominando_la_app_v1.pdf` | La presentación original (v1). Se conserva como referencia |
| `presentacion_capacitacion_v2.pptx` | **La presentación vigente**, 16 diapositivas, reconstruida desde el instructivo |
| `generar_presentacion.js` | El script que produce el `.pptx`. Editarlo y volver a correrlo, no editar el pptx a mano |

## Regenerar la presentación

```bash
node material/generar_presentacion.js material/presentacion_capacitacion_v2.pptx
```

Necesita `pptxgenjs` (`npm i -D pptxgenjs`). Editar el script y no el `.pptx`:
así el diseño queda versionado y el diff se puede leer.

En la última diapositiva hay un espacio marcado
`[ pega aquí la URL o el código QR de la plataforma ]` — se reemplaza cuando el
sitio esté publicado.

## Lo que NO va en esta carpeta

**El `F-SIG-19 — Registro de asistencia de participación de actividades`
diligenciado no se guarda aquí ni en ninguna parte del repositorio.**

Las hojas firmadas traen nombre completo, número de cédula, cargo y firma de
más de 200 personas. Eso es dato personal (Ley 1581 de 2012) y en git no se
puede borrar de verdad: queda en el historial para siempre, y cualquiera con
acceso al repo lo tiene.

Ese registro vive donde vivan los demás registros del SGC (Drive de calidad, con
permisos), no aquí.

Lo que sí reemplaza este proyecto es el **formato en blanco**: la hoja
`constancias` del Sheet captura los mismos campos que el F-SIG-19 pide por
participante, sin papel y sin transcripción.
