# Materiales, iluminación y nicho EVA

Revisión basada en la referencia cálida del usuario, sobre la cabina de sección
recta. Se conserva el perfil estructural y la distribución de circulación.

## Arte y geometría

- Tapizado grafito, ribetes cálidos, frente de cajones metálico y luz inferior.
  Se retiran los pequeños bloques lumbares superpuestos al respaldo.
- El traje se aloja en un nicho con marco achaflanado, laterales retraídos y
  alero superior. La base llega al piso y las botas apoyan en su plataforma.
  La primera variante tenía paredes demasiado profundas y tapaba el traje desde
  el pasillo; la versión final conserva su visibilidad desde ese ángulo.
- `EVA_ALCOVE` comparte las medidas del nicho con su collider. La prueba carga el
  GLB real para comprobar apoyo de botas, manos, casco y separación de la puerta,
  además de comprobar la línea de visión desde el pasillo.

Las caras metálicas de las tapas centrales estaban por debajo de su respaldo
negro (8 frente a 13 mm). El exportador corrige el orden de esas capas y eleva
sus rótulos junto con ellas; conserva las cavidades oscuras de las rejillas.
Los detalles centrales también reciben el acabado de piso compartido, usando
coordenadas locales de la habitación para alinear sus mapas.

El mobiliario se reproduce con `export-arrival-cleanup.py -- --reference-cabin`
en Blender, conservando la fuente original. El nicho se compone en
`ArrivalOutfitting.tsx`; no forma parte del archivo Blender del decorado.

## Verificación

La comparación usa la auditoría nativa `cabin-lighting-review.spec.ts`. Las
capturas y mediciones se guardan en `../cabin-reference/material-*`. La auditoría
observa movimiento y render reales, sin modificar el estado del juego. Resultados
finales corresponden a la variante `material-balanced`.

- `npm run test`: 78 archivos y 258 pruebas aprobadas.
- `npm run typecheck`, `npm run lint` y `npm run build`: aprobados.
- Build conserva el aviso de chunk mayor a 500 kB; el formato global señala
  únicamente dos JSON de auditorías previas ajenas a esta revisión.
- Auditoría visual final aprobada sin errores de consola ni excepciones.
- `npm run test:e2e -- cabin-revision.spec.ts identity.spec.ts`: 3 aprobadas.
  Recorrido, saltos, acreditación y salida/reentrada en Pointer Lock nativo,
  sin errores de consola ni excepciones.
- Intel UHD, Chromium, 1280×720 y DPR1: mediana de 15,8 ms / P95 de 18,6 ms,
  frente a 15,6 / 19,3 ms antes, con 71 draw calls en ambas. Son muestras de una
  pasada, no una mejora estadística ni una garantía de 60 FPS.

[Vista amplia](../cabin-reference/material-balanced-wide.png),
[piso](../cabin-reference/material-balanced-floor.png),
[nicho EVA](../cabin-reference/material-balanced-suit.png).
Método, ensayos descartados y límites en [iluminación](lighting.md).

El acabado sigue siendo estilizado. Los reflejos y el contacto del piso son
aproximaciones estáticas; no se incorporaron sombras dinámicas ni reflejos
trazados de la escena.
