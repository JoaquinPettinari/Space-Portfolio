# Envolvente unificada en el juego

El juego monta la nueva versión de Blender. Las fuentes y los GLB anteriores se
conservan; se sustituyen las URLs usadas por el runtime, sin superponer la caja
de llegada antigua a la envolvente nueva.

## Assets y coste

| Asset                                | Mallas por zona/material | Triángulos |   Bytes |
| ------------------------------------ | -----------------------: | ---------: | ------: |
| `cruz-del-sur-unified-envelope.glb`  |                       33 |     114135 | 8201664 |
| `cruz-del-sur-unified-arrival.glb`   |                       14 |      62317 | 7186336 |
| `cruz-del-sur-unified-collision.glb` |        1, sin renderizar |       1698 |   91500 |

Estos reemplazan casco de 5508652 bytes y llegada de 9449428 bytes: el cambio
neto de descarga es +521420 bytes. La geometría visual conjunta pasa de 167968 a
176452 triángulos. Son cifras de estos assets, no del juego completo.
La agrupación espacial permite descartar por encuadre las zonas no visibles.
Los recursos antiguos en `public/models` no se solicitan por estos componentes.

Se mantienen las nueve luces del juego y la iluminación cálida. No se exportan
las ocho luces de revisión de Blender ni se añaden sombras. El vidrio nuevo usa
`KHR_materials_unlit`, opacidad 0.045 y `depthWrite=false`, sin transmisión ni
render de refracción. Los paneles de vidrio del puente y el conector existentes
se conservan, evitando una segunda capa del canopy de presentación de Blender.

`PlayerShipHull` carga la envolvente y el collider. La envolvente y los muebles
de llegada usan BVH para acelerar la búsqueda de la superficie más cercana en
las interacciones, conservando su comportamiento de oclusión.

## Física y puertas

La colisión nueva procede de las superficies estructurales sin sus biseles:
paredes, cubierta, collares, costillas y paños inclinados. Detalles pequeños,
emisores y decoración exterior no se convierten en miles de colliders. Se usa
una malla estática de 1698 triángulos, transformada a metros de mundo una vez
al cargar; esa escena no se monta como objeto visible.

`EntryAirlock` conserva las doce franjas del piso y los colliders del mobiliario.
Retira las paredes/techo antiguos para no dejar barreras invisibles. Las franjas
laterales de piso nuevas cubren el espacio que gana el pod, con la misma
superficie en el collider y la geometría visible, 5 mm por debajo de las placas.

El mamparo automático, sus hojas y colliders cinemáticos, bolsillos, anclajes de
Crew Access, docking cerrado y colliders del pasillo siguen en sus componentes
actuales. Los placeholders de la escotilla de Blender no se exportan. El hueco
y el barrido del mamparo tienen pruebas contra el GLB final.

En la revisión interior se separaron 22 cm hacia afuera los paños técnicos que
tapaban parcialmente los armarios y se extendieron tres patas de costillas hasta
el piso. La corrección se hizo en la fuente guardada y en sus scripts, y después
se reexportaron envolvente y colisión.

## Evidencia y reproducción

Exportador: `scripts/assets/export-unified-runtime-live.py`, desde la escena
`CRUZ DEL SUR / Unified compact vessel`. Usa una escena temporal, conserva la
fuente abierta y genera el informe `runtime-export.json`. Las fotos de la fuente
usan su iluminación de estudio; las capturas en `game-unified/` son del juego.
La muestra anterior está en `game-before-unified/`.

`unifiedShipAsset.test.ts` comprueba presupuestos, ausencia de luces/cámaras,
vidrio sencillo, suelo con normal ascendente, piso/barrido/hueco de puerta y
líneas de visión hacia el lector real de credenciales. `readUnifiedCollision`
es la misma conversión de coordenadas que usa Rapier en producción.

Playwright usa entrada real: puerta cerrada antes de identidad, apertura con
credenciales, docking cerrado, banco, empuje contra el paño técnico inclinado,
ida y vuelta por el pasillo, paredes de vidrio, salida/reentrada de Pointer Lock
y archivo físico con descarga de CV. Los tests no dependen de MCP.

La primera ejecución del test del pasillo llegó a su límite de tiempo porque
consultaba `isVisible()` antes de que React montara el menú tras Escape e
intentaba pulsar el canvas cubierto por la pausa. La prueba ahora espera el
botón real `Resume mission` y su cierre, sin forzar clicks ni falsear Pointer Lock.
Una repetición del archivo no logró converger el mouse nativo al inicio; la
ejecución aislada posterior completó el mismo recorrido en 27.3 s, sin cambiar
el helper ni sus tolerancias. Se conserva esa limitación de repetibilidad de la
entrada automatizada, en lugar de considerarla una prueba de física fallida.

Las muestras son de 90 cuadros tras calentamiento, a 1280 × 720 y DPR 1 en Intel
UHD/ANGLE. La previa dio 41.9 / 74.4 ms p95 hacia proa y 44.9 / 59.8 ms hacia
entrada; una primera muestra posterior dio 20.0 / 22.4 y 22.7 / 27.6 ms. La carga
del sistema, cachés y pequeños cambios del waypoint impiden atribuir toda esa
diferencia a la optimización. No se promete una duplicación de FPS ni 60 FPS
sostenidos. Los draw calls observados sí suben aproximadamente 7–16 según vista;
las texturas observadas permanecen en 22/24 según encuadre.

La captura final tras despejar los armarios dio 24.2 / 27.2 ms p95 en la entrada,
21.5 / 24.2 ms hacia proa y 24.3 / 30.3 ms hacia la llegada. El pasillo, tras
corregir la espera del menú, dio 19.5 / 21.6 ms p95 y completó la reentrada real.
La entrada es la vista más cargada: se observan 347 draw calls mirando hacia
el conjunto desde popa, frente a 159/213 en las vistas del puente. Se deja
registrado para una optimización específica posterior, sin ocultar ese coste.

Comandos: `npm run check`, `npx tsc -p tsconfig.e2e.json --noEmit`, Playwright con
`playwright.passage-review.config.ts` y los filtros de llegada, pasillo, revisión
visual, `unified interior blocks` y `approaches the physical Archive`.
