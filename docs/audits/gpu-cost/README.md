# Renderizado GPU — 23 de noviembre de 2026

## Método

Chromium nativo, 1280 × 720, DPR 1, mismo recorrido con teclado y mouse reales.
`gpu-cost-review.spec.ts` toma tres ensayos de 150 cuadros por vista, con 30
cuadros de calentamiento por ensayo. El helper de muestras se comparte con el
audit de CPU anterior.

La observación GPU es optativa (`?gpuProfile`), de sólo lectura y está dentro del
módulo de diagnóstico exclusivo de desarrollo. Usa
`EXT_disjoint_timer_query_webgl2`: un cuadro completo y un cuadro separado con
consultas por dibujo cada veinte cuadros. Nunca anida consultas, espera
sincrónicamente resultados ni cambia la escena. Descarta consultas disjoint,
limita la cola y libera consultas/restaura métodos al desmontar.

La etiqueta histórica `FRAME` identifica una invocación de `renderer.render`, no
todos los pases de un cuadro. Estas capturas se toman caminando con tablet baja;
si se mide con tablet visible hay que separar mundo y primer plano.

Las consultas por dibujo alteran el pipeline y agregan sobrecarga. Sus tiempos
permiten localizar costes y comparar dibujos, **no representan los FPS normales**.
Los archivos `fps-before` y `fps-after` registran el recorrido sin instrumentación;
la prueba exige que no exista un observador GPU activo en esas dos fases.
Las poses varían ligeramente porque el movimiento es real, y el exterior sigue
animado. No se garantiza el mismo rendimiento en otros equipos.

## Costes encontrados y candidatos

En la entrada, los principales dibujos de GPU son los perfiles estructurales,
el esmalte grafito y el caucho; no las atmósferas ni los planetas. No hay mapas de
sombras dinámicos que eliminar; el entorno de reflejos se prepara una vez.

| Dibujo en la entrada          | Base (ms) |                     Candidato (ms) |
| ----------------------------- | --------: | ---------------------------------: |
| Cielo                         |     1,029 |   0,130 (cielo al final de opacos) |
| Perfiles metálicos            |     5,628 | 4,218 (pase previo de profundidad) |
| Pase de profundidad adicional |         — |                              0,622 |

Son medianas de las consultas de cada dibujo, no porcentajes de mejora del juego.
El tiempo total GPU varió más que esos dibujos y no se utiliza como una promesa
de FPS. Ver los JSON completos para muestras, poses y advertencias.

El cielo conserva panorama, UVs, anisotropía, color y resolución. Se dibuja al
final de opacos con profundidad en el plano lejano: las paredes y planetas ya
ocultos evitan sombrear esos píxeles, incluso si están más allá del radio de la
esfera. Cristales y anillos se dibujan después, en el pase transparente normal.

El candidato de perfiles añade un solo dibujo sin color de la misma geometría,
sin simplificarla. Comparte vértices y transformaciones y no participa en raycast.
Sólo se selecciona el material exacto medido; los materiales con transparencia,
desplazamiento, deformación o shaders personalizados quedan excluidos. El montaje
se realiza en un efecto con limpieza para soportar la repetición de StrictMode.
La primera prueba de este candidato perdió el pase durante ese replay y fue
descartada; `depth.json` contiene la repetición válida, con 65 dibujos en entrada
en lugar de 64 y consultas explícitas del proxy.

## Resultado conservado

Se conservan el cielo al final de opacos y el pase de profundidad **sólo** del
lote metálico identificado. No se modificaron luces, mapas, resolución, GLB,
colisiones ni animaciones. No se agregaron dependencias.

Mediana de las tres medianas por vista, sin observador GPU:

| Vista   | Antes (ms) | Final (ms) | FPS aproximados antes → final |
| ------- | ---------: | ---------: | ----------------------------: |
| Entrada |       37,4 |       34,6 |                   26,7 → 28,9 |
| Proa    |       26,2 |       25,0 |                   38,2 → 40,0 |
| Pasillo |       21,3 |       19,8 |                   46,9 → 50,5 |

Es una mejora observada de tiempo por cuadro de aproximadamente 5–8 %, no una
garantía: las distribuciones se solapan, el equipo tiene variación de carga y
las poses del recorrido difieren ligeramente. Los FPS de esta sesión no son
comparables directamente con los del audit histórico de otro momento.
El objetivo no se considera «60 FPS sostenidos»: los percentiles altos todavía
muestran pausas y queda trabajo en los lotes PBR grandes. No se bajó la calidad
para ocultar ese límite.

## Evidencia visual y reproducción

`sky-depth-parity.spec.ts` compara píxeles en radio 240 y radio 40 del inspector,
con cámara desplazada, cuerpos opacos más allá del cielo y transparencias.
Comprueba que esos cuerpos/transparencias realmente aporten píxeles.
`point-light-parity.spec.ts` también comprueba el pase de profundidad en materiales
standard/physical, normal maps, roughness, clearcoat y sombras, verificando que
los proxies se instalen. Tolerancia máxima: un nivel por canal.

```powershell
$env:GPU_COST_PHASE = 'depth'
npm run test:audit -- e2e/gpu-cost-review.spec.ts
npm run test:audit -- e2e/sky-depth-parity.spec.ts e2e/point-light-parity.spec.ts
```

Fases históricas: `before` sin cambios; `after` sólo cielo; `depth` cielo y pase de
profundidad. Los archivos se sobrescriben si se repite una fase. Comparar versiones
de código correspondientes; el nombre de fase no activa ni desactiva optimizaciones.

## Comprobaciones finales

- `npm run typecheck` y `npm run lint`: correctos.
- `npm run test -- src/game/rendering/opaqueDepthProxy.test.ts src/game/world/cabinMaster.test.ts src/game/rendering/zeroContributionLights.test.ts src/game/rendering/WarmLightFastPath.test.tsx`: 13 pruebas correctas.
- `npm run test:audit -- e2e/sky-depth-parity.spec.ts e2e/point-light-parity.spec.ts`: 3 pruebas correctas, incluida la comprobación de proxies activos.
- `npm run test:e2e -- e2e/navigation.spec.ts e2e/bridge-transition.spec.ts`: 2 pruebas correctas; arrastre/zoom/reset reales del inspector, salida y regreso a Pointer Lock, recorrido, colisiones y mesa.
- `npm run build`: correcto, con el aviso previo de tamaño del chunk Game. Búsqueda de `gpuProfile`, `GPU_DISJOINT_EXT` y `observeGpu` en el JavaScript de producción: sin coincidencias.
- Capturas finales de entrada y proa revisadas. Los audits y regresiones fallan ante errores de consola o excepciones; permanecen advertencias previas de Three/compilador, registradas en la evidencia.
- Los recursos de `public/` no cambiaron. La mejora no depende de nuevas texturas, modelos reducidos ni menor resolución.
- `npm run format:check`: sólo falla en tres archivos previos y ajenos a esta entrega: `docs/assets/cabin-master/assembly.json`, `docs/assets/unified-ship/chairs-plants-refinement/audit.json` y `docs/assets/unified-ship/consoles-orbit-refinement/audit.json`. Los archivos nuevos y modificados están formateados; `git diff --check` pasó.
