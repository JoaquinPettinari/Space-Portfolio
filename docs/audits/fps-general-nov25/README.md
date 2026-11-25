# FPS general — 25 de noviembre de 2026

## Método y alcance

Chromium nativo, 1280 × 720, DPR 1. Recorrido real con teclado, mouse y acceso de
tripulación; sin teletransporte. Tres ensayos por vista, con 30 cuadros de
calentamiento y 150 muestras cada uno. Se conserva la mediana de las tres medianas.
Las poses tienen pequeñas diferencias por movimiento real y el exterior sigue animado.

`before.json` y `after.json` usan consultas GPU para localizar el coste por dibujo.
No representan FPS normales: las consultas alteran el pipeline. `fps-before.json`
y `fps-after.json` repiten la ruta sin esas consultas y exigen observador GPU nulo.
No se ejecutaron builds ni otras pruebas durante estas mediciones normales.
La carga del equipo y el navegador condicionan los valores; no son promesas para
otro equipo ni comparaciones válidas con sesiones históricas.

## Cambio conservado

La entrada gastaba aproximadamente 12,19 ms GPU en caucho y 8,79 ms en perfiles;
la proa, 5,70 ms en grafito y 5,10 ms en metal. Son medianas de dibujos instrumentados.
Se amplía el pase de profundidad existente sólo a cuatro lotes estáticos medidos:

- Cabina: `CABIN_PBR_STUDIO_Carbon_rubber` y `CABIN_PBR_STUDIO_Warm_graphite_enamel`.
- Proa: `REFINED_bridge_static_BRIDGE_V15_Graphite001` y `REFINED_bridge_static_BRIDGE_V15_Metal001`.

Se conserva también el lote de perfiles que ya tenía el pase. Cada proxy comparte
geometría y transformación con su original, no escribe color ni intercepta raycast.
Se instala antes de los hooks de materiales y se limpia en el desmontaje, incluido
el replay de StrictMode. La selección exacta evita consolas móviles, transparencias,
deformaciones y materiales personalizados. No se agregan dependencias ni recursos.

Los datos `after.json` confirman proxies activos de los tres lotes en entrada y los
dos lotes en proa. El caucho baja a 3,02 ms y los perfiles a 5,25 ms en esa captura.
El coste adicional de profundidad está incluido en las mediciones de cuadro finales.
No se cambiaron modelos, texturas, materiales, luces, resolución, física ni animaciones.

## Resultado sin consultas GPU

| Vista   | Antes ms | Después ms | FPS antes | FPS después |
| ------- | -------: | ---------: | --------: | ----------: |
| Entrada |     81,9 |       71,2 |      12,2 |        14,0 |
| Proa    |     63,2 |       43,9 |      15,8 |        22,8 |
| Pasillo |     41,7 |       41,9 |      24,0 |        23,9 |

Reducción de tiempo por cuadro: 13,1 % en entrada y 30,5 % en proa, equivalente a
aproximadamente 15 % y 44 % más FPS. El pasillo no presenta mejora significativa.
No se alcanzan 60 FPS sostenidos. Hay variación de carga y las distribuciones no
son idénticas; se incluyen muestras y percentiles completos en los JSON.

## Reproducción y verificación

```powershell
$env:GPU_COST_DIRECTORY = 'docs/audits/fps-general-nov25'
$env:GPU_COST_PHASE = 'fps-after'
npm run test:audit -- e2e/gpu-cost-review.spec.ts
npm run test:audit -- e2e/point-light-parity.spec.ts
```

La fase sólo nombra el archivo: no activa ni desactiva cambios. Para reproducir el
antes, usar la versión sin los cuatro lotes nuevos; evitar sobrescribir esta evidencia.

Pasaron las cuatro rutas de medición, sin errores de consola ni excepciones. Las
dos pruebas de paridad de píxeles pasaron con tolerancia máxima de un nivel por
canal (materiales standard/physical, normales, rugosidad, clearcoat y sombras).
Las 12 pruebas unitarias de profundidad, propiedad de recursos y montaje pasaron.
Capturas de entrada y proa revisadas; quedan registradas por fase junto a los JSON.
Persisten avisos previos de deprecación de Three y precisión del compilador WebGL.

Verificación final: `npm run typecheck`, `npm run lint`, formato focal y
`npm run build` aprobados; el build mantiene el aviso previo de tamaño del chunk
Game. `git diff --check` correcto. La búsqueda de `gpuProfile`,
`GPU_DISJOINT_EXT` y `observeGpu` en el JavaScript generado no encontró coincidencias.
Los dos E2E de `navigation.spec.ts` y `bridge-transition.spec.ts` pasaron: arrastre,
zoom, reset, retorno a Pointer Lock, recorrido en ambos sentidos, colisión y mesa.
