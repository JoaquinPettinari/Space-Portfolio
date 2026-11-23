# Suites de navegador

## Regresión de navegación nativa — 2026-11-21

El helper `lookAt` espera controles activos y la entrega de eventos confiables del
mouse, incluidos los del movimiento inicial al centro del viewport. Espera una
ventana de 150 ms sin nuevos eventos y dos cuadros antes de leer la cámara.
Conserva la tolerancia angular y registra los deltas recibidos si falla. El
observador se limpia por completo; no sustituye Pointer Lock ni modifica poses.

La prueba `native aim stays settled across large turns and pointer recapture`
verifica giros grandes y ausencia de rotación tardía, antes y después de Escape.
La tanda final de Chromium (`mouse-navigation-verified`) pasó cuatro recorridos:
acreditación/tablet, giros estables, captura/liberación/recaptura y radio. Sin
errores ni excepciones; permanecen avisos previos de deprecación/WebGL. No es una
ejecución de toda la suite ni una medición de rendimiento.

Los intentos iniciales detectaron carreras durante el regreso de cámara y
movimientos posteriores al criterio de dos cuadros. Se conservaron las
aserciones y se reemplazó la espera fija por observación de entrega y quietud.
También pasaron 18 pruebas de controles, typecheck, lint y build. El formato de
los archivos modificados es correcto; los tres JSON históricos ajenos mantienen
sus avisos de formato.

Cada spec tiene una clasificación primaria en `e2e/suites.ts`:

| Comando                       | Selección                                    | Servidor              | Resultados / informe HTML                                  |
| ----------------------------- | -------------------------------------------- | --------------------- | ---------------------------------------------------------- |
| `npm run test:e2e`            | 56 regresiones funcionales, 20 specs         | Vite :4173            | `test-results/regression` / `playwright-report/regression` |
| `npm run test:audit`          | 17 auditorías visuales/performance, 13 specs | Vite :4178            | `test-results/audit` / `playwright-report/audit`           |
| `npm run test:e2e:production` | 1 smoke de producción                        | build + preview :4174 | `test-results/production` / `playwright-report/production` |

Los números son el inventario al separar las suites; `-- --list` descubre el
inventario actual sin abrir el navegador. El test `src/test/e2eSuites.test.ts`
exige que todos los specs, también en subdirectorios nuevos, pertenezcan a una
sola suite. Añadir un spec exige clasificarlo; no se excluyen archivos por un
patrón silencioso ni se pierde cobertura.

Las regresiones verifican juego, entrada, colisiones, menús, contenido y contacto
con acciones reales. Adjuntar una observación o captura diagnóstica dentro de
un test funcional no lo transforma en una auditoría de FPS. El contacto puede
usar respuestas de red explícitamente mockeadas; eso no demuestra envío real.

Las auditorías reúnen recetas de revisión visual de versiones de assets y
mediciones. Algunas conservan comprobaciones funcionales o de movimiento
reducido junto con su recorrido medido: se conservan completas, accesibles por
el comando de auditoría. Las recetas que escriben `docs/audits` son opt-in y
pueden actualizar evidencia; no se ejecutan con `npm run test:e2e`.

`playwright.shared.config.ts` comparte navegador, controles de ejecución y
servidor. La elección de specs y los destinos de resultados pertenecen al entry
point. `PLAYWRIGHT_EXECUTABLE_PATH` permite utilizar Chromium instalado sin
modificar código ni recurrir al MCP.

## Entradas de revisión existentes

Se conservan `playwright.monitor.config.ts`, `playwright.arrival-validation.config.ts`,
`playwright.passage-review.config.ts` y `playwright.refined-review.config.ts` para
reproducir revisiones anteriores. Sus listas explícitas pueden combinar specs
funcionales y auditorías; no son las suites primarias ni modifican su
clasificación. Cada entrada escribe artefactos en su propia carpeta. Las que
producen HTML también usan carpetas distintas. Monitor y arrival comparten
puerto 4173 y por lo tanto se ejecutan en serie respecto de regresión. No ejecutar
dos instancias de la misma configuración simultáneamente sin darles distintos
`--output` e informe HTML.

Para una selección pequeña se usan los filtros de Playwright dentro de su
suite: `npm run test:e2e -- airlock.spec.ts`,
`npm run test:audit -- roof-performance.spec.ts`. Pasar el nombre de una auditoría
al comando de regresión no la habilita: hay que elegir la configuración correcta.

## Profiling del puente

En PowerShell:

```powershell
$env:PROFILE_BRIDGE = '1'
npm run test:audit -- roof-performance.spec.ts
Remove-Item Env:\PROFILE_BRIDGE
```

Si Chromium no está en la ubicación esperada por Playwright, establecer antes
`PLAYWRIGHT_EXECUTABLE_PATH` con la ruta de una instalación compatible. El
perfil opcional conserva su nombre `bridge.cpuprofile` dentro de
`test-results/audit/roof-performance-*/` y se adjunta al informe como
`bridge-cpu-profile`; el JSON `bridge-observational-profile` contiene las
muestras y metadatos. Abrir el CPU profile con las herramientas de rendimiento
de Chromium. Los mismos archivos se guardan bajo la carpeta de resultados de
la configuración elegida si se usa un entry point de revisión compatible.

El profiling usa el protocolo público de DevTools de Chromium y la interfaz
de observación de solo lectura del juego en desarrollo. Mide la escena real,
sin acceder a `_roots` de Fiber, rutas del caché de Vite ni modificar raycasts
o resolución. No incluye comparaciones ablativas ni atribuye diferencias a
una técnica aislada. El profiler agrega sobrecarga: sus tiempos no equivalen a
una medición de FPS sin instrumentación ni garantizan60 FPS sostenidos.

## Presupuestos y verificación de la migración

Las regresiones comparten un presupuesto máximo de 120 s por caso para permitir
carga de GLB, identificación y recorridos nativos; cada acción conserva sus
aserciones y esperas acotadas. Los casos largos pueden definir su propio límite.
Las métricas de rendimiento se ejecutan aparte para no confundir carga de CI o
instrumentación de CPU con fluidez del juego. Evitar comparar FPS mientras se
compila o se ejecuta otro navegador en el mismo equipo.

Al activar la suite completa se encontraron fixtures antiguos: selector del
botón de tablet retirado, contador de seis misiones, valores de iluminación
anteriores y waypoints ocupados por consolas nuevas. Se actualizan a la interfaz
y geometría vigentes conservando entradas reales, distancias de colisión y
retorno. No se desactivan pruebas ni se cambian colliders para obtener verde.

El acceso táctil a la tablet se restituye mediante un botón DOM disponible con
`pointer: coarse`, que llama al mismo control de apertura. El grupo de
instrucciones incorpora semántica de grupo para su nombre accesible. No se
introducen recursos WebGL, luces ni lógica de física con estos ajustes.

## Intro de acople y carga

`e2e/docking-intro.spec.ts` reproduce el MP4 real con Chromium. Observa el primer
cuadro presentado antes de solicitar `Game`, el reloj y los cuadros del medio,
la visibilidad calculada del canvas, la apertura central, la bienvenida única y
Pointer Lock nativo. Retiene una descarga para comprobar la espera y bloquea
JavaScript 550 ms para comprobar que el video puede seguir avanzando.

El caso normal registra cuadros perdidos; comprobar fases DOM por sí solas no
detectaba la congelación anterior. Ejecutar sin renders Blender, compilaciones
o suites de CPU simultáneas. Los contadores del navegador no sustituyen revisar
la reproducción en otros equipos y no garantizan FPS del interior.
Estos casos desactivan capturas, video y trazas; adjuntan telemetría JSON.
