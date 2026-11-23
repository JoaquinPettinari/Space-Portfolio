# Tablet de misión — maestro Blender

`mission-tablet.blend` contiene la carcasa independiente y una escena de revisión con ambas manos **enlazadas** desde `../astronaut-hands/astronaut-hands.blend`. Mantener esa estructura de carpetas: no convertir las instancias en copias locales para editar los guantes.

## Organización

- `01 Tablet chassis`: carcasa, biseles y juntas.
- `02 Protectors and hardware`: protectores naranjas, tornillos, sensores, botones y tapa trasera.
- `03 Screen and interaction anchors`: vidrio y puntos de montaje.
- `04 Static UI preview - no export`: maqueta visual de la interfaz; no es React funcional.
- `05 Linked hands - no export`: dos instancias del maestro de manos, únicamente para revisar el agarre.
- `06 Studio - no export`: cámaras y luces de revisión.
- `07 Reference - no export`: referencia visual empaquetada en el archivo.

La propiedad `exclude_runtime_export` documenta la selección necesaria: **no es un filtro automático del exportador de Blender**. Exportar explícitamente los objetos de producción y excluir las colecciones de revisión.

## Escala y montaje

Unidades en metros. Ancho exterior aproximado de 0,39 m y alto de 0,256 m. En Blender, X es horizontal, Z vertical y el frente mira hacia −Y. La conversión habitual a glTF deja Y vertical y el frente hacia +Z.

| Anclaje                    | Uso                                                           |
| -------------------------- | ------------------------------------------------------------- |
| `SCREEN_UI`                | Superficie de interfaz de 0,335 × 0,199 m, delante del vidrio |
| `GRIP_LEFT` / `GRIP_RIGHT` | Orígenes de muñeca para las dos instancias de manos           |
| `CARD_PRESENT`             | Referencia de montaje para futuras pruebas de presentación    |

Los botones `TABLET / BUTTON_POWER`, `BUTTON_VOLUME_UP` y `BUTTON_VOLUME_DOWN` son piezas separadas, con recorrido de referencia de 1 mm. Los anclajes y dimensiones exactos están en `tablet-contract.json`.

### Refinamiento del agarre — 2026-11-19

Las muñecas del montaje están en X ±0,235 m, Y 0,01 m y Z −0,12 m, con giro sobre Y de +12° para la izquierda y −12° para la derecha. Esta inclinación lleva los pulgares al marco y abre los antebrazos como en la referencia. Se aplica a las instancias, sin alterar el esqueleto reutilizable ni las poses de tarjeta/radio. `assemble-tablet-hands.py` toma las matrices de estos anclajes.

`scripts/assets/review-tablet-grip.py` genera las vistas frontal y lateral de `grip-refinement/` sin guardar cambios en el maestro. `before.png` conserva la revisión anterior. El contacto revisado es visual y geométrico, no una simulación física.

## Integración en la app — 2026-11-20

La app utiliza `public/models/cruz-del-sur-hand-interactions.glb`, generado por
`scripts/assets/export-hand-interactions.py` desde el archivo de gestos enlazado
a estos maestros. La carcasa, los guantes y los cuatro clips se cargan una sola
vez; cada interacción clona su propio esqueleto y comparte geometría y texturas.
La interfaz React se monta sobre `SCREEN_UI`; la maqueta se excluye. El código
sigue siendo responsable de entrada, estado, accesibilidad y del instante en que
una pulsación ejecuta la acción.

Los detalles procedurales de los guantes se hornean a mapas de color, rugosidad
y normales de 1024 px, con un único canal UV de atlas. Los biseles estáticos se
aplican antes de exportar. La tablet se dibuja en un pase de primer plano con
profundidad propia: los dedos y la carcasa se ocultan correctamente entre sí,
sin atravesar las paredes al acercar la cámara. No se importan luces de estudio.

## Revisión y reproducción

- `scripts/assets/build-mission-tablet.py`: genera el maestro inicial; se niega a sobrescribir uno existente.
- `scripts/assets/assemble-tablet-hands.py`: enlaza las dos colecciones, sin duplicar mallas, y registra el origen en `assembly.json`.
- `scripts/assets/render-mission-tablet.py`: genera vistas frontal, de detalle y del conjunto; no guarda cambios sobre el maestro.
- Cámara `CAM / Tablet assembly`: vista del agarre completo. Tecla **0 del teclado numérico** para entrar/salir de cámara en Blender.

Los pesos, poses, medidas de exportación y validación de contacto se documentan
en el maestro de manos y su `RUNTIME_EXPORT.md`. Los tests cargan el GLB real y las
pruebas de navegador verifican la pantalla, el contacto y las acciones mediante
entrada nativa. Las mediciones de tamaño o triángulos no equivalen a un objetivo
de FPS en otros equipos.
