# Equilibrio de iluminación interior

Se reduce el tinte ámbar de la iluminación global con relleno neutro y una
direccional cálida más suave. La luz lateral existente de la proa se ubica junto
al ventanal, por encima de las consolas, con tono frío. Las luces prácticas de
la cabina y el foco de techo conservan calidez con menor saturación naranja.

No se agregan luces, sombras, postprocesado, texturas ni geometrías. Se conservan
las fotos, los mapas PBR, la resolución y el sistema de preparación del arranque.
El pulso de emergencia y la restauración de intensidad no cambian.

## Revisión visual y coste

Capturas de Chromium nativo, Intel UHD, 1280×720, DPR 1:
`bridge-before.png`, `bridge-after.png` y `passage-after.png`.
El recorrido usa teclado, mouse y Pointer Lock reales.

| Vista   | Mediana antes/después | P95 antes/después | Draw calls |
| ------- | --------------------- | ----------------- | ---------- |
| Llegada | 25,7 / 27,9 ms        | 39,6 / 38,1 ms    | 327 / 327  |
| Proa    | 18,4 / 21,2 ms        | 22,8 / 23,0 ms    | 152 / 152  |
| Pasillo | 23,8 / 25,6 ms        | 26,7 / 28,4 ms    | 241 / 241  |

Una muestra de 90 cuadros por vista tras calentamiento; no es una prueba
estadística ni de tiempo GPU. La posición de proa/pasillo difiere unos 15 cm
por la tolerancia del recorrido. Se mantiene el número de triángulos dibujados
por vista; la variación de tiempo observada impide afirmar mejora de rendimiento.
Los datos completos están en `test-results/lighting-before/` y
`test-results/lighting-after/`, en `warm-interior-measurements.json`.

La revisión `warm-interior-review.spec.ts` posterior pasó completa sin errores
de consola ni excepciones. La ejecución anterior obtuvo capturas y mediciones,
pero falló luego al orientar el mouse hacia un acercamiento. El primer intento
posterior de `transition-shelves-review.spec.ts` falló al recuperar el indicador
de Crew Access tras cerrar el terminal. No se modificaron los controles ni los
helpers para ocultar esos fallos.

La repetición aislada de `transition-shelves-review.spec.ts` pasó completa
(58,6 s), incluidos recorrido y consola sin errores. Evidencia en
`test-results/lighting-shelves-recheck/`: las cuatro fotografías y los materiales
se mantienen visibles. Los fallos anteriores quedan registrados como
inestabilidad del recorrido automatizado, no como pruebas aprobadas.

## Comandos de validación

- `npm run typecheck`, `npm run lint`, `npm run test`: correctos, 292 pruebas.
- `npm run build`: correcto; conserva el aviso previo de bundle grande.
- `npm run format:check`: tres avisos históricos en los JSON de cabina y
  refinamientos de unified-ship, ajenos al cambio. Archivos editados formateados.
- `npx playwright test --config playwright.audit.config.ts e2e/warm-interior-review.spec.ts e2e/transition-shelves-review.spec.ts --output=test-results/lighting-after`:
  revisión general correcta; primer intento de estantes fallido como se describe arriba.

Se usó `PLAYWRIGHT_EXECUTABLE_PATH` apuntando al Chromium instalado, sin mocks
de Pointer Lock ni alteraciones de cámara desde la interfaz de diagnóstico.
