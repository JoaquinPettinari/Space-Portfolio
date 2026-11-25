# Cocina integrada en la app

Fuente: `../bridge-galley-balanced-finish.blend`, conservada sin guardar durante la exportación. Script: `scripts/assets/export-galley.py`. Artefacto: `public/models/cruz-del-sur-galley.glb`.

## Recursos y materiales

- 306 objetos de Blender consolidados en 19 primitivas, 44 772 triángulos y 17 materiales.
- 2 994 164 bytes de GLB. Ocho materiales procedurales horneados a texturas de 512 px de color, rugosidad/metal y normales. Las normales se conservan en PNG sin pérdida.
- Colecciones ocultas, cámaras, luces de estudio y radio decorativa excluidas. Se conservan planta, cafetera, mesadas, paredes y repisas.
- Coordenadas globales Y-up, sin sumar el desplazamiento del puente.

## Runtime

`Galley.tsx` usa el entorno de reflejos existente y adapta la emisión al estado eléctrico. Dos colisionadores simples protegen las mesadas. La luz cálida local no genera sombras; la iluminación principal y los emisores ámbar del puente se ajustan sin cambiar las pantallas cian.

`ShipRadio` conserva reproducción, controles, gesto y contacto. Su escala de carcasa es 0.7; la mano compensa esa escala para conservar su tamaño. La ubicación y transformación de botones viven en `galleyLayout.ts`. La cafetera de Blender sustituye la geometría anterior y conserva la lógica de preparar/tomar café mediante sus grupos identificados y su pantalla dinámica.

La mesada principal tiene 2,76 m de frente y un retorno corto. Dos repisas largas dejan visibles la planta y los aparatos. Se retiraron la columna intermedia y el panel procedural que tapaba la planta. `prepare-galley-runtime.ts` retira sólidos completos de la vitrina y los libros antiguos en derivados GLB, preservando el arco, las imágenes y los materiales originales. Las computadoras, mesa táctica y estantes personales conservan sus ubicaciones.

## Verificación

Se ejecutaron typecheck, lint, build, formato focal y las 337 pruebas unitarias (107 archivos). Las pruebas de navegador con Pointer Lock real cubren reproducción, cambios de pista/volumen, contacto antes de la acción, café y bloqueo de paso a través de los muebles. La revisión visual detectó y corrigió la superposición de la repisa y la escala de la mano.

El build mantiene el aviso de chunk grande existente. El navegador emite avisos de deprecación de Three/Rapier y precisión del compilador de shaders; las pruebas exigen ausencia de errores de consola y excepciones.

No se hizo una comparación reproducible de FPS antes/después: tamaño de GLB y cantidad de primitivas no prueban rendimiento GPU. Tampoco se integró el resto del rediseño de techo ni el fondo violeta, que son revisiones independientes.

Validación final de la ampliación: `npm run typecheck`, `npm run lint`, `npm run test -- --maxWorkers=2` y `npm run build` pasaron. Los tres E2E focales (`galley`, `radio`, `extras` filtrado a café) pasaron sobre los derivados definitivos. `git diff --check` pasó. `npm run format:check` global señaló JSON de auditorías anteriores; los JSON de esta exportación y el código modificado quedaron formateados. Captura final: `in-app.png`.

## Acabado de estantes y planta

`finish-galley-shelves.py` conserva las 3713 transformaciones del conjunto y guarda una nueva fuente. Bordes plegados, tornillería embutida, dos tazas huecas de cerámica y dos recipientes pequeños reemplazan los bloques anteriores. Las hojas tienen una subdivisión de suavizado; follaje, maceta y composite reciben acabados más mates. No se agregan luces ni se mueven aparatos o colisionadores. El incremento es de una primitiva y 347 696 bytes; no representa una medición de FPS.

## Pared e iluminación

`finish-galley-walls.py` agrega un material propio de grafito cerámico con variación de color y relieve fino horneados a 512 px. Juntas y placas enrasadas quedan detrás de los aparatos. La única luz local se desplaza a [3.4, 1.95, 0.85] y baja de 8 a 5 para reducir el reflejo concentrado sobre la pared. Se conservan estantes, aparatos, colliders y temperatura cálida. No hay luces ni sombras adicionales.

## Integración del detalle de cafetera y planta

La exportación incluye aros, juntas, bandeja y ranuras nuevas en la zona interactiva de café. Los nuevos materiales de hojas se hornean conservando sus normales sin pérdida. Los payloads idénticos del GLB comparten offsets: 3 580 304 bytes antes, 2 994 164 después, sin reducir imágenes ni geometría. La luz cálida de runtime, los aparatos y los colliders mantienen su configuración; las luces de autoría no se importan.

## Luz rectangular y mesada satinada

La mesada conserva geometría y microrelieve, con composite gris neutro y rugosidad 0.43. Una RectAreaLight de 2.3 × 0.18 sustituye la puntual bajo la repisa, orientada hacia la mesada y ligada al mismo estado eléctrico. Se inicializan las tablas LTC de Three una sola vez al cargar el módulo. No incorpora sombras ni cambia el número de luces locales; su coste GPU no fue comparado. Este ajuste sustituye las posiciones/intensidades de la pasada puntual descrita arriba.
La verificación visual de la luz rectangular conserva visibles la planta y los controles. Café y colisiones pasaron; el primer inicio de radio fue interrumpido por un error de preámbulo de Vite y se repitió con servidor nuevo. Las tablas de la luz rectangular incrementan el chunk Game comprimido de aproximadamente 1195 a 1301 kB; no se afirma mejora de FPS.

## Balance final de acabados

`balance-galley-finishes.py` ajusta únicamente el material grafito de los muebles y la rugosidad del acero de detalle. No agrega geometría. En runtime la misma luz rectangular se amplía a 2.6 m, inclinación X -1.35 e intensidad 7.5 ligada al estado eléctrico para cubrir mejor planta y frente de mesada. Conserva una sola fuente sin sombras.

Validación de este balance: typecheck, lint, formato focal, 3 pruebas unitarias de asset/layout y build aprobados. Café y colisiones aprobados en navegador. Radio aprobada al repetir: el primer intento agotó el tiempo en el recorrido del puente (Z=5.51), antes de interactuar con la cocina. Queda registrado como fallo intermitente de navegación de la prueba, sin atribuirlo a una causa no comprobada.

## Iluminación de la repisa superior

Se incorpora una segunda fuente rectangular tenue bajo la repisa superior (2.3 × 0.12 m, intensidad 2.5), con blanco cálido. La fuente de mesada baja de 7.5 a 6.5 y suaviza el tono naranja. Ambas siguen el estado eléctrico, sin sombras. Se preservan materiales horneados, objetos, posiciones y tamaño del GLB. El objetivo es revelar el acabado de los paneles y cerámica mediante iluminación, sin sumar decoración. Esta pasada sustituye la configuración de una única luz descrita anteriormente; no se midió el cambio de tiempo GPU.

Validación de la segunda luz: typecheck, lint, formato focal, pruebas asset/layout y build aprobados. Revisión visual desde el pasillo y prueba de colisiones aprobadas. Radio aprobada. Café aprobado al repetir por separado: el primer intento excedió 45 s en la carga inicial, sin llegar a interactuar. No se cambió el timeout para ocultar ese resultado.
