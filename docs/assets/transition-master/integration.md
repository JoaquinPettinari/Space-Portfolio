# Integración de estantes en la aplicación

La aplicación carga `cruz-del-sur-transition.glb`, exportado de
`transition-shelves-finished.blend`, en coordenadas mundiales y sin escala extra.
Incluye las cuatro fotos, libros, plantas, zapatilla, medalla, raqueta, marcos,
repisa, piso y techo. Las colecciones de contexto y las cámaras y luces de
previsualización quedan excluidas. El maestro y las fotografías originales se
conservan intactos.

## Preparación reproducible

1. Ejecutar Blender en background con dos threads y
   `scripts/assets/export-transition-shelves.py`.
2. Ejecutar `node --experimental-strip-types scripts/assets/prepare-transition-runtime.ts`.

El segundo paso recorta únicamente las superficies antiguas sustituidas de los
modelos del puente y de la envolvente. Produce variantes `-transition-ready.glb`
y conserva imágenes, materiales y zonas vecinas; no modifica los originales.
El recorte se hace antes de distribuir la app, porque medirlo en tiempo de carga
mostró un costo innecesario (2,52 segundos en Node sin carga; 8,94 en Vitest bajo
carga). Los scripts y sus pruebas comparten las mismas reglas de recorte.

## Materiales e iluminación

El GLB contiene 45 lotes de material, 316.069 triángulos y pesa 23.636.444 bytes.
Los acabados procedurales se convierten a mapas PBR de 512 px; las normales se
conservan en PNG sin pérdida para evitar borrar el microrelieve. Las cuatro
fotografías conservan sus UV y proporciones. El archivo contiene las imágenes,
sin peticiones a servicios externos ni decodificadores nuevos.

`TransitionShelves` utiliza materiales propios que comparten las texturas y
geometría cacheadas. Reutiliza el mapa de reflejos local de la cabina y añade una
luz cálida de techo sin sombras. Los emisores de las repisas permanecen en el
modelo. La intensidad respeta la alimentación de la nave. La estructura sólida
descarta caras posteriores; las hojas y los detalles delgados mantienen sus caras.

## Encaje y física

Se retiran las repisas procedurales anteriores, el marco de transición anterior
y el adaptador visual delantero del pasillo panorámico. Se conservan los flancos
externos de la pared de proa. El adaptador físico, el suelo y las colisiones
estructurales siguen separados de la geometría decorativa. Las columnas centrales
tienen colisión adicional por su nuevo relieve, con frente a X ±1,34 m.

Las pruebas del asset comprueban las fotos y mapas embebidos, ausencia de cámaras
y luces, conservación de las imágenes y materiales originales en los derivados,
rayos libres en las regiones reemplazadas y conservación de superficies vecinas.
Los E2E recorren el corredor con controles reales, comprueban la colisión lateral
y el acceso a la mesa. Las capturas por sí solas no prueban colisiones.

## Validación de la entrega

- `npm run typecheck`, `npm run lint`, `npm run test` y `npm run build`:
  correctos; 286 pruebas en 90 archivos.
- E2E de revisión visual y E2E de transición/colisión/mesa: correctos, con
  Pointer Lock y movimiento nativos; sin excepciones ni errores de consola.
- Formato de esta entrega correcto. `npm run format:check` sigue señalando
  tres JSON históricos de cabina/unified-ship ajenos a esta tarea.
- La primera prueba detectó carga excesiva con el recorte en runtime. Se trasladó
  offline antes de validar la entrega. La prueba lateral se orientó al frente
  de la columna: la orientación antigua dejaba deslizar al jugador hasta el
  hueco entre columnas, que conserva correctamente su collider más retrasado.

Evidencia final: `runtime-overview.png`, `runtime-photos.png`,
`runtime-sports.png` y `runtime-measurements.json`. Chromium en Intel UHD,
1280×720, DPR 1, 120 cuadros tras calentamiento: mediana 25 ms, P95 28,1 ms;
230 draws y aproximadamente 1,04 millones de triángulos para la escena completa.
La carga local observada hasta mostrar controles fue de 34,6 segundos. Es una
medición de desarrollo en un equipo, no una garantía de 60 FPS ni una prueba de
carga de producción. El tamaño y la carga del conjunto siguen siendo una deuda
de rendimiento; el peso del GLB no representa memoria GPU.

Una medición aislada del nuevo modelo en Node 24/i7-10750H encontró ~45 ms
para lectura/decodificación geométrica y ~737 ms para construir el BVH con SAH.
CENTER tardó ~133 ms, pero no se cambió la estrategia: el ahorro de ~604 ms no
explica la carga observada y no se midió su efecto en el raycasting. Esta prueba
no mide decodificación de texturas, shaders ni GPU.

La integración no cambia los modelos simplificados de inspección exterior de
las consolas. Su envolvente original continúa siendo apropiada para esa vista.

La medición de carga anterior corresponde a esta integración original. La
[optimización posterior del arranque](../../audits/startup-loading/README.md)
prepara el holograma offline e instala los hooks de materiales antes del primer
frame; conserva este GLB, sus fotografías y sus materiales sin cambios.
