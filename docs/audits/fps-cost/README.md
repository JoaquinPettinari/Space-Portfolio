# Auditoría de tiempo de cuadro — 23 de noviembre de 2026

## Cambio conservado

`PanoramicPassage` utiliza el BVH de Drei sobre su geometría combinada propia.
El índice descarta grupos de triángulos que el rayo de interacción no alcanza.
`indirect` conserva los índices originales. No modifica materiales, luces,
resolución, texturas, fondo, colisiones ni la distancia de interacción.
El desmontaje libera el índice; los recursos compartidos del GLTF se conservan.

## Método y evidencia

Chromium nativo, Intel UHD / ANGLE D3D11, 1280 × 720, DPR 1.
Tres ensayos de 150 cuadros por vista, después de 30 cuadros de calentamiento.
Perfiles CDP separados de aproximadamente cinco segundos: el profiler no se
ejecuta durante las muestras de tiempo de cuadro. Recorrido mediante teclado,
mouse y Pointer Lock reales, sin teletransporte ni cambios a la escena.

`before.json` corresponde al estado anterior; `cpu-bvh.json`, al cambio conservado.
Los JSON incluyen poses, inventarios, recursos, advertencias y errores.
Las posiciones del recorrido tienen pequeñas diferencias: la proa varió hasta
0,29 m entre estas dos ejecuciones. No son capturas idénticas píxel a píxel.

| Vista   | Antes: medianas (ms) | BVH: medianas (ms) | Draw calls / triángulos |
| ------- | -------------------- | ------------------ | ----------------------- |
| Entrada | 21,0 / 20,9 / 20,9   | 21,1 / 21,0 / 21,3 | 64 / 423.134            |
| Proa    | 14,1 / 14,6 / 14,1   | 14,7 / 15,0 / 15,5 | 98 / 361.722            |
| Pasillo | 10,3 / 10,4 / 10,7   | 10,6 / 10,6 / 10,6 | 91 / 556.367            |

No se demuestra una mejora global de FPS. Sí desaparece el coste dominante del
raycast lineal: la suma de tiempo propio de `getVertexPosition`,
`_computeIntersections`, `intersectTriangle` y `checkGeometryIntersection` baja
de 2.194 ms a 8,5 ms en el perfil del pasillo. Esto no equivale a reducir todo el
consumo CPU en esa proporción: otras funciones y el propio profiler siguen presentes.

En la entrada, aproximadamente el 76 % del perfil inicial aparece como idle.
El límite parece estar en renderizado/GPU, pero no se midieron nanosegundos GPU;
la disponibilidad de la extensión de temporización no constituye una medición.
Otros procesos del equipo pueden afectar los resultados. Tamaño descargado,
memoria GPU y tiempo por cuadro son métricas diferentes.

## Experimento descartado

Los archivos `after*` documentan un **candidato descartado**, no el código final:
rechazo temprano de luces puntuales fuera de su radio antes de normalizar el
vector y calcular atenuación. Pasó cinco casos de comparación visual, pero la
entrada midió 22,9 ms y no aportó una mejora comprobable. Se retiró completamente
el cambio de shader y se conservó el guard de BRDF existente.

La prueba `point-light-parity.spec.ts` compara ahora ese guard conservado contra
Three sin optimización, en una escena aislada de prueba: materiales standard y
physical, normal/roughness maps, clearcoat, alcance limitado/ilimitado y sombras.
Exige imagen no vacía y diferencia máxima de un nivel por canal. No introduce
controles de mutación en el juego ni se importa en producción.

## Reproducir

```powershell
$env:FPS_COST_PHASE = 'cpu-bvh'
npm run test:audit -- e2e/fps-cost-review.spec.ts
npm run test:audit -- e2e/point-light-parity.spec.ts
npm run test:e2e -- e2e/bridge-transition.spec.ts
```

El audit sobrescribe los archivos de la fase elegida. Ejecutar sin otro renderer
o compilación en paralelo. Los resultados históricos `after` no se pueden
reproducir con el código final porque el experimento fue retirado.

## Verificación de la entrega

- `npm run typecheck`: correcto.
- `npm run lint`: correcto después de corregir una variable sin uso en el audit.
- `npm run test -- src/game/rendering/zeroContributionLights.test.ts src/game/rendering/WarmLightFastPath.test.tsx`: 4 pruebas correctas.
- `npm run test:audit -- e2e/point-light-parity.spec.ts`: correcto con el shader final.
- `npm run test:e2e -- e2e/bridge-transition.spec.ts`: correcto; recorrido en ambos sentidos, bloqueo lateral, mesa y recuperación de Pointer Lock.
- `npm run build`: correcto, con el aviso existente del chunk Game grande.
- `npm run format:check`: detectó seis JSON nuevos y tres avisos previos. Los seis JSON se formatearon y el chequeo dirigido de todos los archivos de esta entrega pasó. Permanecen pendientes los archivos ajenos `docs/assets/cabin-master/assembly.json`, `docs/assets/unified-ship/chairs-plants-refinement/audit.json` y `docs/assets/unified-ship/consoles-orbit-refinement/audit.json`; no se modificaron.
- Comparación visual revisada en capturas del ventanal y del pasillo. No sustituye una medición GPU directa ni una validación en otros equipos.
