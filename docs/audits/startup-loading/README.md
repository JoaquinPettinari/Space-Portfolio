# Carga inicial: medición antes y después

Estas mediciones preceden la cinemática de llegada. El tiempo hasta controles
ahora incluye intencionalmente aproximación y apertura; no compararlo como si
fuera exclusivamente tiempo de carga. La intro descarga y monta recursos en
paralelo; su preparación GPU espera al fundido negro para preservar el video.
Espera la disponibilidad real del interior antes de mostrarlo.

Con el mismo protocolo local, producción pasó de **41,4 s a 11,9 s**, una
reducción observada de aproximadamente **71 %**. Desarrollo pasó de
52,1/39,4 s a 17,6/10,5 s. Son dos cargas dev y una de producción por etapa;
no constituyen una garantía de carga ni una muestra estadística amplia.

## Método reproducible

`e2e/startup-loading-review.spec.ts`, registrado en la suite audit: Chromium real
con ANGLE Intel UHD/D3D11, 1280×720, DPR 1, contexto nuevo por prueba, caché HTTP
desactivada y service workers omitidos. Sin throttling de CPU o red. Profiler
CDP con muestreo de 5 ms, PerformanceObserver de long tasks y Resource Timing.
El punto final es la visibilidad de Game controls. No se capturan screenshots,
video ni traces durante la ventana medida; la captura final ocurre después.

Desarrollo se ejecutó con la configuración audit. Producción usó una configuración
temporal que extiende `playwright.production.config.ts` y selecciona el mismo
spec, con `STARTUP_REVIEW_RUNS=1` y `STARTUP_REVIEW_MODE=production`. El servidor
de preview se levanta después de construir la app. No hubo renders Blender ni
otras pruebas concurrentes durante las cargas.

## Evidencia y atribución

Los perfiles dev anteriores atribuían 12,1/12,9 s propios a EdgesGeometry. Los
posteriores no contienen muestras de esa función: las aristas del modelo táctico
ya llegan preparadas. Las tres cargas posteriores solicitaron el asset
`tactical-ship-display.glb.gz`, con 5.155.834 bytes transferidos cada vez, y ninguna
solicitó el envelope original para esa construcción.

La primera utilización/validación de programas WebGL también redujo su tiempo
propio observado en producción, aproximadamente de 23,2 s a 5,9 s. La baseline
insertaba los controles a los 28,2 s y luego bloqueaba otros 13,1 s; después se
insertan a los 11,4 s sin ese bloqueo posterior. Esto distingue aparición de DOM
de disponibilidad observada por la prueba. No se midió tiempo GPU ni se contó
directamente cada compilación.

`measurements.json` conserva resultados pequeños, dispositivo, método y límites.
Los perfiles completos, recursos y screenshots quedan en
`test-results/startup-baseline/` y `test-results/startup-after/`, fuera de los
artefactos versionados. Las seis cargas pasaron sin pageerror. La igualdad de los
assets, el comportamiento de juego y la comparación visual se verifican aparte.

## Conservación visual y validación

El GLB de los estantes conserva su SHA-256
`794e41b614952d9345624404d28020ef9b0952a9fbbf6180d2f3f025a6db42cb`.
No se modificaron sus fotos, texturas, materiales ni luces. La revisión visual
posterior muestra las cuatro fotos, los libros, plantas y objetos deportivos;
capturas en `test-results/loading-quality/`.

`npm run typecheck`, `npm run lint`, `npm run test` (292 pruebas, 93 archivos)
y `npm run build` pasaron. El formato de los archivos de esta tarea y
`git diff --check` pasaron. `npm run format:check` global continúa señalando
tres JSON anteriores ajenos a esta tarea: `cabin-master/assembly.json`,
`chairs-plants-refinement/audit.json` y `consoles-orbit-refinement/audit.json`.
El build conserva el aviso de bundle grande; no se interpreta su tamaño como
una medición de fluidez.

También pasaron los tres E2E ejecutados con Chromium nativo:

- `npx playwright test --config playwright.audit.config.ts e2e/transition-shelves-review.spec.ts --output=test-results/loading-quality`:
  recorrido, fotografías y materiales sin errores de consola ni excepciones.
- `npx playwright test e2e/bridge-transition.spec.ts e2e/navigation.spec.ts --output=test-results/loading-regression`:
  colisión lateral, recorrido en ambos sentidos, mesa táctica e inspección exterior
  con arrastre, zoom, restablecimiento y retorno a Pointer Lock reales.

Se configuró `PLAYWRIGHT_EXECUTABLE_PATH` al Chromium instalado. Permanecen
avisos existentes de deprecación y precisión del compilador WebGL; no fueron
errores de consola. La prueba exterior cubre la primera carga de su modelo,
que ahora ya no se solicita durante el arranque para construir el holograma.

## Límites de la medición

No se vació caché de disco del SO ni caché del driver/proceso del navegador:
el calentamiento de shaders explica parte de la variación entre cargas. El
profiler introduce instrumentación, aplicada igual antes y después. La red es
localhost: un tamaño de descarga menor beneficia otras redes, pero no permite
inferir sus tiempos. Varias mejoras se evaluaron juntas; no se atribuye todo el
delta a una sola. La carga inicial y el tiempo por cuadro son métricas distintas.
