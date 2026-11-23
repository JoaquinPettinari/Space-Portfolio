# Revisión de continuidad de la intro

## Problema y corrección

La versión 3D compartía renderer y prioridad de dibujo con la tablet. Al montar
el interior podía reemplazar el dibujo exterior antes de retirar la cobertura.
Además, la duración de la película dependía de un RAF con delta limitado: una
pausa de carga prolongaba la secuencia.

La versión actual usa el MP4 prerenderizado fuera del canvas. Descarga y monta
el juego después de presentar un cuadro y almacenar la película en buffer.
Mantiene el canvas invisible independientemente de la cobertura. Difiere tanto
el frameloop como PMREM y compilación GPU hasta terminar el fundido negro.
La apertura exige física, shaders y primer dibujo preparados.

## Comparación local

Chromium nativo, una instancia de navegador, sin Blender ni compilaciones en
paralelo. E2E sin capturas, videos ni trazas; observación del medio real.

| Variante                                  | Cuadros totales | Cuadros descartados |
| ----------------------------------------- | --------------: | ------------------: |
| Video con preparación GPU simultánea      |             240 |                  61 |
| Video con preparación GPU tras el fundido |             240 |                   0 |

En la ejecución final normal, el primer cuadro se presentó a los 2722,5 ms y
`Game.tsx` se solicitó a los 2734,8 ms. No hubo eventos de espera del video tras
el primer cuadro ni filtraciones del canvas; se observaron 273 muestras del
canvas oculto. Pasaron apertura simétrica, bienvenida única y Pointer Lock real.

Los callbacks de JavaScript sí pueden retrasarse durante parsing/montaje: hubo
un intervalo entre callbacks de cuadros de 5780 a 12155 ms. El contador nativo
del video terminó en 240 cuadros sin descartes. Esto comprueba separación de
reproducción y JavaScript, no garantiza tiempos de carga o fluidez en todos los
dispositivos. La preparación GPU aún requiere espera negra según el equipo.

La ronda final de `e2e/docking-intro.spec.ts` pasó los cuatro casos en 1,3 min:
normal, descarga retenida, error con recarga real y movimiento reducido. El caso
retenido también obtuvo 240 cuadros sin descartes. Durante un bloqueo deliberado
de JavaScript de 550,3 ms, el medio avanzó 0,55 s y 17 cuadros sin pausarse.
El registro local está en `test-results/docking-video-final-output.txt`.

`npm run test -- --maxWorkers=2` completó 314 pruebas en 97 archivos (88,93 s).
También pasaron las 22 pruebas de la intro con `--pool=threads --maxWorkers=2`.
Una ejecución anterior sin resultados se interrumpió; no se cuenta como aprobada.

`npm run typecheck`, `npm run lint` y `npm run build`: correctos. El build conserva
el aviso por tamaño del chunk del juego; el bootstrap queda en 226,79 KB
(72,20 KB comprimidos). Formato de archivos tocados y `git diff --check` correctos.
`npm run format:check` global conserva tres avisos previos en JSON de assets:
`cabin-master/assembly.json` y los audits de `chairs-plants-refinement` y
`consoles-orbit-refinement`; no se reformateó trabajo ajeno a esta corrección.
