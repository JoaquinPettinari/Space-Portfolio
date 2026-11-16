# Revisión de fondo, interior y rendimiento

## Cambios

- Tierra completa sobre una esfera, con mapa equirectangular y borde atmosférico calculado en el mismo shader. Se retira la tarjeta fotográfica rectangular y su máscara de bordes.
- Cielo y nave fijos; estrellas con fases independientes de brillo y deriva mínima. Asteroides, planeta y nave auxiliar conservan movimiento propio. Movimiento reducido congela el ambiente.
- Los tres módulos del pasillo combinan superficies por material. Se mantienen todos sus triángulos y las mismas colisiones. El vidrio fino evita la segunda pasada transparente.
- Los grandes paneles claros laterales se reemplazan por revestimiento grafito, juntas, rejillas y luz cálida. Se agregan acabados en la cara del mamparo visible al atravesar el pasillo. Los paneles y marcos repetidos se instancian por acabado.
- Cafetera espresso con hueco frontal, grupo, portafiltro, depósito, bandeja ranurada, taza hueca y pantalla de estado. Cuatro grupos estáticos por acabado; la pantalla solo cambia al cambiar la fase del café. Se conservan posición, collider e interacción.
- Sin nuevas luces, sombras, postprocesado ni cambios de física. El archivo Blender no se modifica.

## Medición

Chromium 1248 completo, ANGLE Intel UHD Graphics, 1280 × 720, DPR 1. Mismo recorrido mediante teclado, mouse y Pointer Lock reales. Se toman 40 cuadros por vista tras estabilizar cámara. Datos originales en `before/measurements.json` y `after/measurements.json`.

| Vista             | Llamadas antes | Llamadas después | Mediana antes | Mediana después |
| ----------------- | -------------: | ---------------: | ------------: | --------------: |
| Puente, frente    |            163 |              157 |         36 ms |         29,9 ms |
| Puente, atrás     |            236 |              200 |       39,9 ms |         37,3 ms |
| Pasillo de vidrio |            119 |               89 |       41,4 ms |         32,7 ms |
| Entrada           |            359 |              301 |       41,5 ms |         36,4 ms |

La reducción de llamadas es reproducible; los tiempos de cuadro varían con la carga del equipo. Esta muestra posterior coincidió parcialmente con comprobaciones de código: no permite atribuir toda la variación temporal al cambio ni afirmar FPS sostenidos. Una revisión intermedia sin la pasada final también registró aproximadamente 32–41 ms. No se alcanzaron 60 FPS sostenidos: el presupuesto correspondiente es 16,7 ms.

`after/gpu.json` registra ocho consultas WebGL disjoint timer válidas de una vista inicial, aproximadamente 20–41 ms. Son muestras cortas del trabajo de GPU entre callbacks RAF, no un benchmark de toda la experiencia. `after/arrival.cpuprofile` conserva el perfil de CPU. Reducir la geometría repetida y las pasadas ayuda; cambiar el amarillo por otro color no elimina el costo de iluminar materiales.

## Validación

Las pruebas de navegador se ejecutan con `playwright.refined-review.config.ts`: recorrido de ida y vuelta, puerta bloqueada y abierta, colisión lateral del pasillo, bahía técnica, liberación y reentrada de Pointer Lock, movimiento reducido, preparación y consumo de café y uso del monitor físico. La suite de 10 pruebas pasó sin errores de consola ni excepciones observadas por sus colectores.

`sceneryPerformance.test.ts` compara geometría y rayos antes/después de combinar el pasillo, verifica el encuadre del globo y comprueba que la cafetera entra en su collider existente. Las comprobaciones generales y sus límites se reportan en la entrega.

Comandos ejecutados:

- `npm run typecheck`, `npm run lint` y `npm run build`: correctos. Build conserva el aviso sobre el tamaño del chunk del juego.
- `npx playwright test --config playwright.refined-review.config.ts`, con `PLAYWRIGHT_EXECUTABLE_PATH` apuntando a Chromium 1248: 10 pruebas correctas.
- `npm run test -- src/game/world/sceneryPerformance.test.ts src/game/coffee.test.ts src/game/world/bulkhead.test.ts src/game/world/arrivalShoulderClosure.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=verbose`: 16 pruebas correctas.
- La ejecución general inicial de Vitest reportó tiempos límite en pruebas existentes de muebles, arquitectura y Computer. Se interrumpieron repeticiones sin progreso, incluida una ejecución que excluía los dos tests de assets antiguos; no se considera aprobada la suite completa por el resultado de las pruebas específicas.
- `npm run format:check`: quedan dos advertencias anteriores en `docs/assets/unified-ship/chairs-plants-refinement/audit.json` y `docs/assets/unified-ship/consoles-orbit-refinement/audit.json`. Los archivos de esta revisión se formatearon con Prettier.
- `git diff --check`: correcto.

Una consulta de identificación de procesos no se ejecutó porque la revisión automática de aprobación falló (`Bad Request`). No se terminaron procesos ajenos mediante esa consulta.

## Arte generado

Mapa de superficie generado con la herramienta integrada ImageGen. Prompt exacto: [earth-prompt.txt](earth-prompt.txt). Archivo utilizado: `public/textures/cruz-del-sur/earth-surface.png`. Es arte ilustrativo generado, no un mapa científico ni una captura satelital acreditada. La fotografía orbital anterior se conserva en disco, pero no se carga en el fondo actual.

## Capturas

- [Tierra sin recorte](after/complete-earth.png)
- [Revestimiento lateral](after/pressure-wall.png)
- [Cafetera lista para servir](after/espresso-ready.png)
