# Fondo e interior: revisión del 16 de noviembre de 2026

## Resultado

- Fondo con mapas planetarios de [Solar System Scope](https://www.solarsystemscope.com/textures/), CC BY 4.0, basados en imágenes y datos de NASA según el autor. Tierra con superficie 4K, nubes 2K y luces nocturnas 1K, combinadas en un solo shader con iluminación solar, brillo del océano y atmósfera. Vía Láctea 4K más discreta y puntos estelares pequeños. Las estrellas no se desplazan como una tarjeta.
- Luna y otros siete planetas, con mapas 512 px y pocas subdivisiones. Saturno incorpora bandas y separación de anillos procedurales. Son una composición cinematográfica distribuida alrededor de la nave; no una vista astronómicamente simultánea ni a escala.
- Los asteroides pasan de 95 a 24, más pequeños y oscuros. Se conservan instancias, movimientos independientes y preferencia de movimiento reducido. Sin luces, sombras ni postprocesado adicionales.
- Vidrio lateral del pasillo neutro y sin sombreado de luces interiores, opacidad 0,025; marcos y colisiones intactos.
- Pozos y barrotes de rejillas visualmente más profundos. Se conserva la geometría abierta y no se modifica la superficie física de desplazamiento.
- Se retiran el panel técnico sin función y su collider, y toda la interacción Inspect Project Photo: objeto, pantalla, modo, blancos, enfoque y prueba de inspección retirada. El portfolio conserva sus imágenes profesionales.
- Se retira el segundo texto decorativo Docking Access del detalle exportado; el cartel de la puerta funcional permanece.
- Libros y objetos de escritorio reubicados sobre una repisa con ménsulas; soporte inferior para los volúmenes bajo el tablero. Nichos exteriores del mamparo con libros, cajas, rebordes y tiras cálidas. Los objetos se mantienen dentro del puente y fuera del recorrido central, sin tapar el tablero ni la planta.
- Las dos ranuras del corredor de conexión reciben repisas, lomos de libros y cajas con cierres, detrás de los planos de colisión existentes: no invaden el paso ni aparecen fuera del vidrio.

## Fuentes y reproducción

`public/textures/solar-system/README.md` documenta archivos, fuentes y tamaños. `/credits.html` publica la atribución y las adaptaciones; se abre desde pausa y participa del recorrido de foco. Los originales están en `docs/assets/solar-system-sources`, fuera del build público.

`scripts/assets/export-refined-interior-live.py` exporta copias evaluadas y aplica correcciones solo al runtime. El Blender editable no se guardó ni modificó. Las tres versiones GLB anteriores se conservan en `before/`. `export.json` registra tamaños, lotes y triángulos; el detalle baja de 21 725 a 20 890 triángulos al retirar la leyenda duplicada. Puente y llegada conservan 239 066 y 62 317 triángulos respectivamente.

## Verificación y rendimiento

Las pruebas usan teclado, mouse y Pointer Lock reales. `interior-orbit-polish.spec.ts` captura puerta, fondo, huecos, libros, piso y vidrio, comprueba que ya no se puede abrir la foto y recoge errores del navegador. Las regresiones comprueban puerta bloqueada y abierta, retorno por el corredor, colisión lateral de vidrio y respeto por movimiento reducido.

`interiorOrbitPolish.test.ts` carga geometría GLB real sin texturas ni red para comprobar profundidad del pozo y apoyo de los libros. Verifica además que las repisas queden dentro del puente y fuera del tablero, y que los planetas queden fuera de la nave y dentro del rango de cámara. No sustituye la física por mocks.

La revisión de circulación en Chromium 1248, ANGLE Intel UHD, 1280 × 720, DPR 1 registró aproximadamente 17–19 ms de mediana en puente/entrada y 12 ms en el pasillo. Son muestras cortas, con variación de carga entre sesiones: no equivalen a 60 FPS sostenidos en todo el recorrido ni permiten atribuir toda diferencia respecto del día anterior a estos cambios. Datos completos en `after/`.

La repetición final, con las dos ranuras ya terminadas, registró:

| Vista             | Mediana |     P95 | Llamadas de dibujo |
| ----------------- | ------: | ------: | -----------------: |
| Puente, frente    | 18,6 ms | 20,8 ms |                172 |
| Puente, atrás     | 19,2 ms | 21,3 ms |                208 |
| Pasillo de vidrio | 12,7 ms | 15,8 ms |                100 |
| Entrada           | 16,6 ms | 20,4 ms |                308 |

Comandos de comprobación:

- `npm run typecheck`, `npm run lint`, `npm run build`: correctos; el build mantiene el aviso anterior de chunk grande.
- `npm run test -- src/game/world/interiorOrbitPolish.test.ts src/game/world/sceneryPerformance.test.ts src/game/interaction/station.test.ts src/game/world/bridgePlacement.test.ts src/game/useStationControls.test.ts src/game/ui/PauseMenu.test.tsx src/game/world/refinedArtAssets.test.ts --maxWorkers=1 --testTimeout=30000`: 29 pruebas correctas en la ejecución final.
- `npx playwright test interior-orbit-polish.spec.ts refined-interior.spec.ts panoramic-passage-review.spec.ts unified-interior.spec.ts --config playwright.refined-review.config.ts`: 5 pruebas correctas con Chromium 1248 mediante `PLAYWRIGHT_EXECUTABLE_PATH`. Se repitió la inspección visual al corregir la ubicación de los detalles; no se reemplazó movimiento ni Pointer Lock por mocks.
- La suite completa `npm run test -- --maxWorkers=1 --testTimeout=30000` se intentó y se interrumpió al no avanzar; no se declara aprobada a partir de los tests específicos.
- `npm run format:check`: las advertencias anteriores de los dos informes JSON de Blender siguen pendientes. Se formatearon los archivos de esta revisión y sus JSON de mediciones.
- `git diff --check`: correcto.

## Capturas

- [Tierra y fondo](after/earth-and-moon.png)
- [Libros sobre su repisa](after/supported-books.png)
- [Tablero y soporte inferior](after/expedition-board-shelf.png)
- [Nichos decorados](after/detailed-recesses.png)
- [Rejillas](after/deep-floor-grilles.png)
- [Vidrio lateral](after/clear-side-glass.png)
- [Ranura lateral del corredor](after/corridor-recess-shelves.png)
- [Un único Docking Access](after/single-docking-label.png)
