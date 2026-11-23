# Nuevos subtítulos de la IA

## Guion recibido

Se recibió el [plan CDS-01 v1](CRUZ_DEL_SUR_CDS01_AUDIO_INTEGRATION_v1.md).
El [reporte de integración](audio/cds01-stage-a.md) registra los audios encontrados,
los eventos conectados y los que quedan pendientes. La tabla de abajo conserva
los IDs del catálogo anterior como referencia para futuras propuestas; no es el
manifiesto vigente ni se importa automáticamente en la aplicación.

## Plantilla de propuestas

Escribí acá los diálogos que querés usar. Es un documento de trabajo: editarlo
no cambia automáticamente la app. El inventario de textos y disparadores actuales
está en [ia-dialogos.md](ia-dialogos.md); la implementación está en
`src/game/dialogue.ts` y sus eventos se conectan en `src/game/Game.tsx`.

Podés escribir en español o en el idioma final deseado. Conservá el ID cuando
reescribas un diálogo existente. Dejá vacías las filas que no quieras cambiar.
Para eliminar uno, escribí «ELIMINAR» en su texto nuevo.

| ID                                | Texto nuevo | Cambios de momento o duración (opcional) |
| --------------------------------- | ----------- | ---------------------------------------- |
| `arrival`                         |             |                                          |
| `restored` (actualmente inactivo) |             |                                          |
| `unlocking`                       |             |                                          |
| `opening`                         |             |                                          |
| `open`                            |             |                                          |
| `tabletPrompt`                    |             |                                          |
| `tablet`                          |             |                                          |
| `identity`                        |             |                                          |
| `archives`                        |             |                                          |
| `communications`                  |             |                                          |
| `transmissionAccepted`            |             |                                          |
| `transmissionSkipped`             |             |                                          |
| `dossier`                         |             |                                          |
| `complete`                        |             |                                          |

## Diálogos nuevos

Copiá este bloque para cada mensaje que no exista en el catálogo:

- **Nombre o ID propuesto:**
- **Texto exacto:**
- **Cuándo debe aparecer:**
- **Una vez o repetible:**
- **Duración aproximada (opcional):**
- **Notas:**

También podés pegar acá un guion libre si ya lo tenés escrito, indicando el
momento de cada intervención. Después lo mapeamos a los eventos de la app.
