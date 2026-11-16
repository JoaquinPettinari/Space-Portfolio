# FPS del interior unificado — 2026-11-14

Objetivo: acercarse a 60 FPS sin retirar decoración, cambiar la iluminación
cálida, reducir resolución ni modificar movimiento, colliders o puertas.

## Medición y cambios retenidos

Chromium/ANGLE, Intel UHD Graphics, 1280 × 720, DPR 1. Cada muestra del test
`warm-interior-review` usa 30 cuadros de calentamiento y 90 observaciones sin
recorrer la escena durante la medida. Los waypoints se alcanzan con teclado,
mouse y Pointer Lock reales; pueden variar unos centímetros entre ejecuciones.
Son muestras cortas en desarrollo, no una garantía de 60 FPS sostenidos.

La base (`before/measurements.json`) fue 23.6 ms de mediana en llegada,
20.5 hacia proa y 23.2 hacia el pasillo. El perfil de CPU de cuatro segundos
concentró trabajo en renderer/materiales/llamadas WebGL; Rapier no dominó las
muestras. El tiempo inactivo del perfil no es una medición directa de GPU.

- Orden opaco de delante hacia atrás, conservando `groupOrder` y `renderOrder`.
  Facilita que el depth buffer descarte fragmentos tapados antes del sombreado.
  La lista transparente mantiene su orden original.
- Copias evaluadas de sólidos cerrados: normales coherentes y backface culling.
  Se comprueba topología manifold por objeto antes de agrupar por material.
  Las caras abiertas, fotografías y cristales se conservan. No se elimina ningún
  triángulo ni se modifica la fuente `.blend`.
- El mamparo agrupa piezas por material dentro de cada conjunto rígido. Conserva
  separados los dos cuerpos cinemáticos y las regiones de jambas/cabecera, así
  como materiales de indicadores, origen y geometría. La prueba del barrido
  completo verifica despeje y el mismo número de triángulos.
- Consolas: silueta de nave, retícula, indicadores y etiquetas en los dos canvas
  existentes de 768 × 432. Sin nuevas texturas, llamadas de dibujo o animaciones.

Se conservan nueve luces, intensidades/colores, texturas PBR y todos los detalles.
No se añaden sombras, postprocesado, dependencias ni controles de calidad.

## Presupuesto de assets

| GLB                   | Mallas | Triángulos |   Bytes |
| --------------------- | -----: | ---------: | ------: |
| Envolvente unificada  |     35 |     114135 | 8203808 |
| Llegada unificada     |     15 |      62317 | 6961324 |
| Colisión, sin cambios |      1 |       1698 |   91500 |
| Módulo panorámico     |     17 |       8304 |  488176 |
| Detalles ámbar        |      5 |       6104 |  334664 |

Las tres copias del módulo panorámico siguen compartiendo geometrías y
materiales. La separación adicional de superficies abiertas/cerradas añade tres
llamadas potenciales entre envolvente y llegada; la agrupación del mamparo
reduce once en las vistas que lo incluyen. La descarga conjunta de los cuatro
assets modificados baja 196060 bytes respecto a la base de esta pasada.

## Resultado final y límites

| Vista                   | Base mediana / p95 (ms)       | Final mediana / p95 (ms) | FPS según mediana final |
| ----------------------- | ----------------------------- | ------------------------ | ----------------------: |
| Llegada, puerta cerrada | 23.6 / 26.0                   | 15.3 / 17.1              |                      65 |
| Puente hacia proa       | 20.5 / 22.1                   | 17.5 / 20.1              |                      57 |
| Puente hacia pasillo    | 23.2 / 25.4                   | 18.2 / 20.3              |                      55 |
| Pasillo, mirada lateral | 19.5 / 21.6 (pasada anterior) | 16.7 / 19.1              |                      60 |

Los valores del puente corresponden a una mejora de tiempo de cuadro de
aproximadamente 15–22%; en llegada, 35%. Las muestras de otras ejecuciones
mostraron variación de alrededor de 0.5–1 ms. La fila del pasillo no tiene una
base nueva tomada al inicio de esta pasada: usa la evidencia de integración
previa, por lo que esa comparación es menos controlada.

No se alcanzan 60 FPS sostenidos en todas las vistas: el puente conserva margen
pendiente y los p95 exceden 16.67 ms. No se redujo el DPR ni el detalle para
ocultarlo. `final/measurements.json` conserva las observaciones completas y
`final/passage-measurement.json` la muestra del pasillo. Las capturas son del
juego, no de Blender. Las llamadas finales fueron 339 en llegada, 159 hacia proa,
205 hacia atrás y 120 en el pasillo. Las texturas siguen en 22/24 según vista.

Pasaron juntos cuatro tests E2E en 2.5 min: pasillo y ambas paredes de cristal,
Pointer Lock/Escape/reentrada, puerta bloqueada antes de identidad y abierta
después, empuje contra el paño inclinado, ida/vuelta, y Archive con descarga real
del CV. No se observaron errores de consola ni excepciones en esos recorridos.

## Experimentos descartados y correcciones

Un orden opaco por centros geométricos, con caché por cuadro, no mejoró de forma
consistente el orden simple; no se conserva esa complejidad.

La reordenación de índices y reutilización de vértices con atributos idénticos
se verificó sin cambiar atributos ni triángulos orientados. No mejoró los
tiempos observados: `index-experiment/measurements.json` e `index-order.json`
son evidencia de un experimento descartado, no de los assets finales. Se
restauraron los índices previos y se retiró el script experimental, sin añadir
meshoptimizer como dependencia directa.

La primera exportación del pasillo usó `matrix_world` de una colección fuera de
la escena activa, que estaba desactualizada. El test de rayos a ventanas falló.
El exportador conserva ahora los transforms locales de las copias sin padre y
los evalúa en su escena temporal. El test volvió a pasar sin modificarlo.
No se considera válida la medición intermedia `bay-solids/` como evidencia de
aspecto/coste final de ese pasillo. Los backups binarios y perfiles completos
están en `artifacts/fps-unified/` (ignorado por Git).

## Reproducción

Validación final: `npm run check` completo, 56 archivos / 200 pruebas aprobadas;
TypeScript de E2E aprobado por separado. Build correcto, con el aviso existente
de chunk grande del juego (3.39 MB minificado). `git diff --check` limpio.

Exportar desde Blender con `export-unified-runtime-live.py` (envolvente/llegada)
y `export-culled-details-live.py` (módulo y nichos). Usan escenas temporales;
la malla de colisión no se reexportó en esta pasada.

`e2e/interior-performance.spec.ts` genera perfiles CDP y un inventario estimado
de mallas en frustum usando una interfaz de solo lectura en desarrollo.
No cambia cámara, escena ni lógica. Los tiempos y llamadas reales provienen de
`performance()`, no de sumar ese inventario. La interfaz no existe en producción.

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\joaqu\AppData\Local\ms-playwright'
npx playwright test --config playwright.passage-review.config.ts --grep 'profiles interior CPU' --reporter=list
npx playwright test --config playwright.passage-review.config.ts --grep 'unified interior blocks|panoramic passage|records warm interior|approaches the physical Archive' --reporter=list
npx tsc -p tsconfig.e2e.json --noEmit
npm run check
```

La prioridad siguiente para obtener más margen es medir una optimización de la
geometría/sombreado del puente a partir de escenas cercanas a consolas y sillas.
El detalle visual puede avanzar con señalética y desgaste en texturas antes de
sumar más luces o miles de objetos independientes.
