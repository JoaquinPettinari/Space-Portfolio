# Asterion: integración y revisión de ventanas

## Método

`e2e/asterion-review.spec.ts` pertenece a la suite optativa `test:audit`.
Recorre la llegada, las ventanas de proa y el pasillo mediante WASD, mouse y
Pointer Lock nativo. La acreditación y la puerta siguen las interacciones reales;
no teletransporta ni modifica el estado del juego. Verifica Escape y reentrada.
Cada vista guarda posición y orientación exactas, 150 muestras tras 30 cuadros de
calentamiento, estadísticas del renderer y una captura explícita para inspección.
No graba video ni trazas.

La descarga exterior cuenta exclusivamente texturas/modelos del fondo, separada
de la descarga total de la app. `resources.textures` es cantidad de texturas
residentes reportadas por Three, **no memoria GPU en bytes**. Draw calls y
triángulos corresponden a la vista completa, no exclusivamente al exterior.

La prueba de inicio separada mide el primer cuadro presentado del video y el
momento en que desapareció la intro y los controles son visibles, con caché de
Chromium deshabilitada. Un único arranque por versión no demuestra una mejora
estadística. El servidor local tampoco representa una conexión móvil.

## Baseline

Comandos ejecutados con Chromium nativo, sin Blender renderizando simultáneamente:

```powershell
$env:ASTERION_PHASE='before'
npm run test:audit -- e2e/asterion-review.spec.ts
npm run test:audit -- e2e/asterion-review.spec.ts --grep 'dedicated cold startup'
```

Ambos pasaron. Cero errores de consola/excepciones en el recorrido; hay avisos
preexistentes de Three.Clock, Rapier y precisión de shaders. Hardware reportado:
Intel UHD Graphics, ANGLE Direct3D11. Viewport/canvas 1280 × 720, DPR 1.

El inicio dedicado produjo: primer cuadro **2733 ms**, controles después de la
intro **25176 ms**, video **240 cuadros / 0 descartados**. Para comparación usar
`before-startup.json`: el observador del primer recorrido aún registraba la
presencia del HUD antes de que terminara la intro, y no es una medida válida de
controles disponibles.

Descarga exterior anterior: **1 967 354 bytes**, doce texturas solar-system.

| Vista            | Mediana ms | p95 ms | Draw calls | Triángulos |
| ---------------- | ---------: | -----: | ---------: | ---------: |
| llegada/babor    |       21.0 |   23.1 |         65 |     389326 |
| proa/frontal     |       14.0 |   18.2 |         98 |     291114 |
| proa/babor       |       12.7 |   16.5 |         68 |     289256 |
| proa/superior    |        7.2 |    9.4 |         77 |     308851 |
| proa/estribor    |        8.3 |   10.7 |         65 |     284664 |
| pasillo/babor    |       10.7 |   14.1 |         92 |     522559 |
| pasillo/estribor |       11.3 |   14.2 |         89 |     541207 |
| pasillo/superior |        9.5 |   12.6 |         68 |     479057 |

Los JSON contienen las muestras originales y las poses. Las capturas sirven para
revisar composición y materiales; la corrección funcional depende del recorrido
real, no de las imágenes. La comparación final se documenta a continuación.

## Integración final

La primera composición ocultaba Nacre y parte de Vesper tras las consolas. Queda
conservada en `initial-integration/`. La revisión final eleva ambos cuerpos junto
con sus anillos/atmósferas; `after-bow-forward.png` confirma anillos completos entre
la consola y el travesaño. Se inspeccionaron también las ocho vistas: babor muestra
el mundo azul-blanco, estribor su planeta de fase oscura, techo luna y campo estelar.
Las fases oscuras no son fallos de carga. No se observaron recuadros opacos en anillos.

Auditoría final: **2/2 pasaron**, cero errores de consola/excepciones; avisos
preexistentes se mantienen. Exterior **2 871 730 bytes**, incremento **904 376 bytes**
respecto a baseline. Los recursos finales sustituyen las doce texturas antiguas.

| Vista            | Mediana ms antes → después | p95 ms antes → después | Draw calls después |
| ---------------- | -------------------------: | ---------------------: | -----------------: |
| llegada/babor    |                21.0 → 21.5 |            23.1 → 26.4 |                 64 |
| proa/frontal     |                14.0 → 14.2 |            18.2 → 16.0 |                 99 |
| proa/babor       |                12.7 → 11.9 |            16.5 → 13.9 |                 67 |
| proa/superior    |                  7.2 → 9.1 |             9.4 → 12.1 |                 79 |
| proa/estribor    |                 8.3 → 10.5 |            10.7 → 12.2 |                 63 |
| pasillo/babor    |                10.7 → 10.8 |            14.1 → 12.3 |                 91 |
| pasillo/estribor |                11.3 → 11.8 |            14.2 → 15.8 |                 90 |
| pasillo/superior |                  9.5 → 9.2 |            12.6 → 11.5 |                 68 |

Texturas residentes en llegada: 174 → 170; al completar el recorrido: 201 → 201.
No equivale a una medición de VRAM. Las poses alcanzadas pueden diferir centímetros
por recorrido real y las naves pequeñas se mueven; consultar JSON para valores exactos.

Inicio dedicado final: primer cuadro **489 ms**, controles **12694 ms**, **240/0**
cuadros totales/descartados. Sin embargo, el inicio de la ruta final fue **2770 ms**
y **27619 ms**; la amplia variación del servidor local muestra por qué no se afirma
que la carga se haya acelerado. No hubo congelamiento/pérdida de cuadros del video
en ninguna de estas muestras. La descarga añadida está cuantificada por separado.

Comando final:

```powershell
$env:ASTERION_PHASE='after'
npm run test:audit -- e2e/asterion-review.spec.ts
```

## Regresiones finales

**7/7 pasaron en 2,6 minutos** con Pointer Lock nativo:

- Intro completa, apertura central, bienvenida única y controles reales.
- Descarga retenida de `cabin-master-static.glb` y, por separado,
  `asterion-worlds.glb.gz`: permanece negro, sin controles ni bienvenida hasta
  liberar el recurso. La misma prueba parametrizada evita duplicar lógica.
- Recuperación ante fallo de descarga deliberado (los errores de fetch de este
  caso son esperados y verifican el límite de error).
- Intro con movimiento reducido y subtítulos de bienvenida.
- Movimiento exterior, movimiento reducido y colisión real del muro de esclusa.
- Navigation: arrastre, rueda, botones, teclado, reset exacto, salida y recaptura
  nativa. `navigation-dragged.png` confirma visualmente el cielo integrado.

```powershell
npm run test:e2e -- e2e/docking-intro.spec.ts e2e/navigation.spec.ts e2e/station.spec.ts --grep 'docks, opens|keeps the black gate|a failed critical|reduced motion completes|inspects the exterior|animates the exterior' --trace off
npx eslint e2e/asterion-review.spec.ts e2e/docking-intro.spec.ts e2e/suites.ts
```

ESLint focalizado pasó. Se aplicó Prettier a los archivos editados y JSON de
auditoría. No se ejecutó la suite E2E completa: se seleccionaron los comportamientos
afectados. Build, typecheck y pruebas unitarias se reportan desde la integración
principal. Queda fuera de esta medición el rendimiento móvil y con red limitada.

## Pulido final del filtrado del cielo

Se conservó la pasada anterior en `pre-anisotropy/` y se repitió sólo el recorrido
tras activar anisotropía 8. **1/1 pasó**, sin errores ni recursos adicionales:
**2 871 730 bytes**. Las estrellas al mirar cerca del polo se ven más compactas,
sin las estelas largas anteriores; queda algo de distorsión propia de la proyección.
No se repitieron inicio dedicado ni las siete regresiones porque el cambio afecta
únicamente el filtrado de la textura ya cargada.

Los valores de la tabla anterior corresponden a `pre-anisotropy/after.json`;
`after.json` y las capturas raíz corresponden ahora al filtro final:

| Vista            | Mediana ms | p95 ms | Draw calls |
| ---------------- | ---------: | -----: | ---------: |
| llegada/babor    |       21.5 |   26.9 |         63 |
| proa/frontal     |       15.8 |   22.0 |        118 |
| proa/babor       |        9.7 |   11.6 |         65 |
| proa/superior    |        7.5 |    9.4 |         78 |
| proa/estribor    |        8.6 |   10.4 |         64 |
| pasillo/babor    |       10.6 |   12.8 |         91 |
| pasillo/estribor |       11.4 |   15.0 |         90 |
| pasillo/superior |        9.5 |   12.6 |         68 |

No aparece una regresión consistente entre vistas. La pose frontal de este
recorrido incluye más geometría (118 frente a 99 draw calls), por lo que su
incremento no se puede atribuir al filtrado. Las poses de techo también varían
ligeramente; se comparó la forma de las estrellas, no igualdad absoluta de píxeles.

```powershell
$env:ASTERION_PHASE='after'
npm run test:audit -- e2e/asterion-review.spec.ts --grep 'reviews exterior'
```

## Comprobación de código y entrega

Sobre la versión final pasaron `npm run typecheck`, `npm run lint`,
`npm run build` y `git diff --check`. La compilación conserva el aviso previo
de tamaño del chunk Game; no se introdujeron dependencias nuevas.

Pruebas focalizadas: **9 archivos, 29 pruebas aprobadas**. Cubren recursos
compartidos, materiales unlit, transparencia, geometría y alcance de cámara,
alineación real de anillos/atmósferas, orientación del panorama, exclusión del
raycast, descompresión y estados de la intro:

```powershell
npm run test -- src/game/world/asterionAsset.test.ts src/game/world/asterionModel.test.ts src/game/world/exteriorPicking.test.ts src/game/world/sceneryPerformance.test.ts src/game/world/interiorOrbitPolish.test.ts src/game/rendering/GzipGLTFLoader.test.ts src/game/intro/InteriorReady.test.tsx src/game/intro/introSequence.test.ts src/game/intro/useDockingIntro.test.tsx --maxWorkers=1
```

`npm run format:check` sigue fallando únicamente por tres informes JSON
preexistentes, ajenos a este cambio: `docs/assets/cabin-master/assembly.json`,
`docs/assets/unified-ship/chairs-plants-refinement/audit.json` y
`docs/assets/unified-ship/consoles-orbit-refinement/audit.json`.
Los archivos de esta integración están formateados.

Se volvió a verificar el SHA-256 de `asterion-expanse-v2.blend`: coincide con
la fuente aprobada registrada en `runtime-export/export-audit.json`.
