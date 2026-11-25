# Rincón opuesto: módulo de exploración

Fuente: `../bridge-port-display-polished.blend`. Autoría base: `scripts/assets/finish-port-display.py`; acabado: `scripts/assets/polish-port-display.py`. Exportación compartida: `scripts/assets/export-galley.py -- --port` desde Blender en segundo plano. Se conserva el archivo anterior.

Sustituye las repisas procedurales con libros/caja por el conjunto ya diseñado en Blender: foto personal con sus UV originales, placa de expedición, esfera armilar y muestra técnica. Se agregan armario inferior, cantos y herrajes discretos, con los materiales grafito de la cocina. El módulo se desplaza 14 cm hacia el interior para no cruzar el revestimiento lateral. Las estaciones, la cocina y los estantes personales del corredor conservan posiciones.

El GLB no contiene cámaras ni luces de autoría. `PortDisplay` usa dos luces rectangulares cálidas sin sombras y un collider simple que abarca sus bordes. `useInteriorFixture` comparte gestión de materiales, reflejos y estado eléctrico con la cocina, sin duplicar ese código.

El acabado añade paneles satinados al fondo, juntas y fijaciones pequeñas, graduaciones en la esfera armilar, terminaciones del contenedor, marco y bitácora. No añade nuevos adornos. Se orientan las dos luces existentes hacia el fondo con una superficie emisora algo mayor. Las caras y los herrajes tienen respuestas de rugosidad distintas, con mapas PBR de 512 px.

El modelo exportado tiene 10 primitivas, 30 898 triángulos y aproximadamente 2,47 MB (antes: 9, 21 498 y 1,83 MB). No se ha medido la diferencia de FPS. No se añaden luces ni sombras. Comparación visual: `before.png` y `in-app.png`.

Validación final: typecheck, lint, formato focal, 7 pruebas unitarias y build aprobados. Los dos E2E de cocina/rincón opuesto pasaron con recorrido real y sin errores de consola ni excepciones. La ejecución anterior de cocina agotó 120 s al capturar; se repitió y pasó. No se cambió ese límite. Las imágenes muestran el estado antes y después; la última comprobación confirma que el revestimiento lateral ya no atraviesa el módulo.

Se retiraron las siete lamas y la tira luminosa procedurales del lateral port que se superponían con el módulo. Tras ese ajuste se repitieron typecheck, lint, las 4 pruebas de interior, build y el E2E del rincón: aprobados. WebGL emitió avisos de precisión del compilador de shaders, sin errores ni excepciones; build mantiene el aviso de tamaño del chunk Game.

Validación del acabado satinado: typecheck, lint, formato focal, 7 pruebas unitarias y build aprobados. E2E del rincón aprobado en repetición individual (1,3 min), con recorrido real y sin errores de consola ni excepciones. El primer intento agotó 120 s durante la captura mientras se ejecutaban las otras verificaciones. Se conserva el límite original. Captura final revisada: luz cálida sobre los paneles, foto visible y circulación libre. Persisten los avisos previos de deprecación/precisión WebGL y de tamaño de chunk en build.
