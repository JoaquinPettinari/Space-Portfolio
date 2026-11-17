# Cabina de sección recta

Se reemplazan los dos sistemas superpuestos de marcos por una sola envolvente:
paredes rectas, hombros inclinados y techo plano. El hueco panorámico conserva el
vidrio; se retiran la curvatura longitudinal, el alféizar segmentado, las costillas
interiores duplicadas y los salientes superiores antiguos de la cabina.

## Fuentes y reproducción

- Perfil compartido: `src/game/world/arrivalShellLayout.json`.
- Estructura: ejecutar Blender en segundo plano con la fuente
  `docs/assets/unified-ship/cruz-del-sur-interior-panels.blend` y el script
  `scripts/assets/export-straight-arrival-shell.py`.
- Mobiliario: la misma fuente y `scripts/assets/export-arrival-cleanup.py`,
  pasando `-- --reference-cabin`.
- Copia editable de estructura:
  `docs/assets/straight-cabin/straight-pressure-shell.blend`.

La fuente original no se guarda. Los GLB unificados anteriores se conservan;
el runtime selecciona las variantes `straight-envelope` y `straight-collision`.
La llegada de referencia actualiza su cierre trasero y elimina marcos obsoletos.
No se añaden luces, dependencias ni cálculos por cuadro.

## Comprobación

Las pruebas de recursos verifican el modelo exportado, el paso de puertas, los
encuentros del techo y el vidrio continuo incluso a alturas alcanzables desde
muebles. La prueba de navegador usa WASD y Space reales, registra posiciones y
comprueba consola y excepciones.

- `npm run test`: 77 archivos y 253 pruebas aprobadas.
- `npm run typecheck`, `npm run lint` y `npm run build`: aprobados.
- Build conserva el aviso de chunk mayor a 500 kB.
- `npm run format:check`: únicamente las dos advertencias anteriores en
  `chairs-plants-refinement/audit.json` y `consoles-orbit-refinement/audit.json`.

- `npm run test:e2e -- cabin-revision.spec.ts`: 2 pruebas aprobadas, recorrido y
  saltos con Pointer Lock nativo. Se exige un ascenso real superior a 20 cm y
  se comprueba cada muestra de cámara contra el perfil interior. Sin errores de
  consola ni excepciones; permanecen los avisos de Three.Clock, Rapier y precisión
  PMREM ya registrados en la auditoría anterior.
- La última extensión del piso hasta el collar trasero se verificó de nuevo con
  `npm run test -- src/game/world/unifiedShipAsset.test.ts`: 4 pruebas aprobadas.
- Build final repetido después de la exportación del piso: aprobado.

Capturas reales: [perfil amplio](wide.png) y
[encuentro lateral desde los muebles](side.png). Se revisó que
desaparecieran los marcos dobles, la curvatura y los huecos superiores.

El salto sigue disponible. La corrección consiste en cerrar la envolvente real,
sin levantar barreras invisibles alrededor de todos los muebles. Las capturas no
sustituyen las aserciones de movimiento de la prueba nativa.
