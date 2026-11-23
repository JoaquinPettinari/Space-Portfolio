# Asterion: deriva exterior

## Baseline antes de editar runtime

```powershell
$env:ASTERION_PHASE='before'
$env:ASTERION_AUDIT='motion'
npm run test:audit -- e2e/asterion-review.spec.ts --grep 'reviews exterior'
```

Pasó 1/1 (2,9 minutos). Ocho poses mediante controles nativos, 30 cuadros de
calentamiento y 150 muestras por vista. Los JSON contienen posiciones reales,
frame times, draw calls, triángulos, programas y recursos descargados. Evidencia de
la integración anterior permanece intacta en `../asterion-integration/`.

Esta ejecución fue considerablemente más lenta que la sesión anterior sin cambiar
el runtime: medianas 21,3–38,4 ms, p95 27,6–61 ms. La intro presentó su primer cuadro
a los 9,1 s y controles a los 67,8 s; reportó 1 cuadro descartado de 240. Son datos
de esta sesión, no una regresión causada por el movimiento todavía no implementado.
No deben mezclarse con el baseline de integración para atribuir mejoras o pérdidas.

Descarga exterior: 2 871 730 bytes. Sin errores de consola; avisos preexistentes.

Pausa anterior: `shuttle` cambió de 21,1938 a 21,1543 durante 350 ms de menú Escape;
worlds y orbit permanecieron 0. Se registra ese comportamiento sin exigir que una
función futura ya exista. Movimiento reducido sí congeló la escena correctamente.
El caso posterior exige además congelación durante pausa.

Pendiente: medición posterior y regresiones del nuevo contrato XYZ.

## Condiciones del equipo

La revisión de procesos del coordinador detectó actividad externa considerable:
un Vite existente desde el 21/11 y procesos Opera consumían CPU durante el muestreo.
No se cerraron sesiones del usuario. Blender no mostraba carga fuerte comparable.
Las mediciones antes/después describen un equipo con contención; no permiten
prometer FPS absolutos ni atribuir diferencias de una sola pasada sólo al código.
El nuevo contador de cuadros permitirá comprobar ahorro en pausa por separado de
la velocidad del equipo.

## Después: deriva y pausa bajo demanda

Auditoría posterior **1/1 pasó** (1,5 minutos), ocho vistas nativas sin errores de
consola ni excepciones. La composición frontal conserva el planeta con anillos
por encima de la consola. El campo mantiene la geometría y las texturas originales.
Descarga exterior idéntica: **2 871 730 bytes**.

Ahorro en pausa verificado con contador de cuadros de Fiber (callbacks de `useFrame`): después de 300 ms de
asentamiento, **0 cuadros durante 750 ms** de menú Escape (3812 → 3812). Tras Resume,
**55 cuadros durante 500 ms** (3818 → 3873). No depende de comparar FPS entre equipos.
Los transforms XYZ de mundos/escombros y la nave auxiliar permanecieron idénticos
en pausa y movimiento reducido; tras reanudar volvieron a avanzar, manteniendo
`orbit=0`. En 500 ms los mundos se desplazaron aproximadamente 0,0205 unidades y
los escombros 0,0451: movimiento más rápido del primer plano, sin girar el cielo.

| Vista            | Mediana antes/después ms | p95 antes/después ms | Draw calls antes/después |
| ---------------- | -----------------------: | -------------------: | -----------------------: |
| llegada/babor    |              38.4 / 20.9 |          61.0 / 28.1 |                  64 / 64 |
| proa/frontal     |              28.7 / 13.8 |          37.9 / 16.3 |                 100 / 98 |
| proa/babor       |              25.9 / 11.3 |          32.9 / 13.1 |                  69 / 67 |
| proa/superior    |               21.3 / 7.1 |           27.6 / 8.4 |                  76 / 78 |
| proa/estribor    |               24.2 / 8.5 |          31.3 / 10.6 |                  64 / 63 |
| pasillo/babor    |              25.8 / 10.3 |          30.5 / 13.7 |                  91 / 91 |
| pasillo/estribor |              23.7 / 11.7 |          32.7 / 14.8 |                  90 / 91 |
| pasillo/superior |               22.8 / 9.4 |          29.1 / 12.5 |                  68 / 68 |

No atribuimos esta diferencia global a la deriva: la sesión posterior tuvo mucha
menos contención externa. Programas reportados al final: 36 → 40; texturas: 201 →
201, geometrías: 374 → 374. Son contadores de la escena completa, no memoria GPU.

Inicio de la ruta posterior: primer cuadro 2,72 s, controles 23,89 s, 240 cuadros
sin descartes. No se trató de una prueba estadística de carga ni de red móvil.

```powershell
$env:ASTERION_PHASE='after'
$env:ASTERION_AUDIT='motion'
npm run test:audit -- e2e/asterion-review.spec.ts --grep 'reviews exterior'
```

## Regresiones y límites

Prueba nativa `station` y dos casos de intro (normal y movimiento reducido):
**3/3 pasaron en 58 s**. Verifican traslación de mundos/escombros, cielo fijo,
congelación de todos los transforms durante Escape, reanudación, movimiento
reducido, colisión contra esclusa, bienvenida única y continuidad de la intro.
ESLint focalizado de los tres archivos editados pasó.

```powershell
npm run test:e2e -- e2e/station.spec.ts e2e/docking-intro.spec.ts --grep 'animates the exterior|docks, opens|reduced motion completes' --trace off
npm run test:audit -- e2e/refined-interior.spec.ts --grep 'keeps the sky fixed' --trace off
npx eslint e2e/asterion-review.spec.ts e2e/station.spec.ts e2e/refined-interior.spec.ts
```

Ocultar una pestaña nativa no se simuló mediante un mock de `document.hidden`:
ese camino queda cubierto por las pruebas de la función de movimiento del runtime,
no por esta regresión E2E. No se afirma haber medido toda la VRAM ni eficiencia
energética del equipo: el contador prueba que no hubo bucle continuo de Fiber en pausa, no el número exacto de draw calls de GPU.

La comprobación adicional `refined-interior` también pasó **1/1 en 29,9 s**:
cielo fijo con deriva independiente y movimiento reducido, sin excepciones.

## Chequeos de código

Pasaron `npm run typecheck`, `npm run lint`, `npm run build` y
`git diff --check`. La compilación mantiene el aviso previo del chunk Game grande.
La ejecución focalizada final aprobó **34 pruebas en 11 archivos**:

```powershell
npm run test -- src/game/world/asterionMotion.test.ts src/game/world/shuttleRoute.test.ts src/game/world/asterionAsset.test.ts src/game/world/asterionModel.test.ts src/game/world/exteriorPicking.test.ts src/game/world/sceneryPerformance.test.ts src/game/world/interiorOrbitPolish.test.ts src/game/rendering/GzipGLTFLoader.test.ts src/game/intro/InteriorReady.test.tsx src/game/intro/introSequence.test.ts src/game/intro/useDockingIntro.test.tsx --maxWorkers=1
```

Se comprueba avance equivalente a 15/30/60/144 FPS, curvas cerradas sin reinicios,
pausa y rechazo de deltas largos, propiedad de recursos, alineación de anillos,
atmósferas y alcance de cámara con el margen completo de movimiento. El GLB y
sus texturas no se modificaron. No se añadieron dependencias.

`npm run format:check` únicamente sigue marcando los tres JSON preexistentes:
`docs/assets/cabin-master/assembly.json`,
`docs/assets/unified-ship/chairs-plants-refinement/audit.json` y
`docs/assets/unified-ship/consoles-orbit-refinement/audit.json`.
El formato de los archivos de este cambio está verificado.
