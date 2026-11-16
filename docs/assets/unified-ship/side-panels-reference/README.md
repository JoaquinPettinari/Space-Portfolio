# Paneles laterales de referencia — Blender

Primera maqueta de los dos muebles a ambos lados de la salida del pasillo de
vidrio, dentro de `cruz-del-sur-interior-panels.blend`.

- Técnico: pantalla de diagnóstico estática, intercomunicador con cable,
  tablero de expedición y cajas con cierres/manijas.
- Exploración: libros apoyados, baranda, fotos del atlas existente, maceta
  metálica con hojas curvas y vetas, y registro inferior.
- Marcos achaflanados, juntas, tornillos, ventilación y tiras ámbar protegidas.

Colección nueva: `UNIFIED / 13 Reference side cassettes - Blender only`.
Quince grupos de malla por acabado, 37.832 triángulos. Se reutilizan las dos
luces prácticas de nichos; la escena conserva diez luces en total. Son cifras
geométricas de Blender, no una medición ni promesa de FPS en el juego.

Las piezas nuevas quedan entre x ±1,95 y ±3,77, y entre z0,08 y2,96 en los ejes
Z-up de Blender. No atraviesan la abertura central. No se tocaron puertas,
ventanas del conector, controles, colliders ni archivos de runtime.

Se retiró de la visual la decoración anterior que se superponía dentro de esos
volúmenes. Sus veinte datablocks originales se conservan en la colección de
archivo `SOURCE / Side cassette prior geometry`, sin vincular a la escena y
con fake-user; también existe la copia completa anterior
`before-side-panel-reference-pass.blend`.

Cámaras: `UNIFIED / Reference technical cassette`, `UNIFIED / Reference specimen
cassette`, `UNIFIED / Reference paired side cassettes`. El archivo abre con la
vista conjunta. Imágenes technical.png, specimen.png y paired.png verificadas
visualmente; renders Eevee a96 muestras. El archivo queda a64 muestras para
las siguientes pruebas de render.

Los scripts de esta pasada, en orden, son:

1. `maquette-side-reference-panels-live.py`
2. `fit-side-reference-panels-live.py`
3. `finish-side-reference-foliage-live.py`
4. `save-side-reference-preview-live.py`

Están pensados para la escena unificada previa a esta maqueta; el primero
rechaza duplicar una colección existente. Para iterar sobre lo guardado se
editan las mallas/materiales actuales. No ejecutar la receta completa sobre
la maqueta ya creada. Se verificó sintaxis de los cuatro scripts con Python
de Blender y se ejecutaron en el Blender conectado.

Esta primera pasada no exportó GLB ni actualizó el juego. La integración posterior
usa `scripts/assets/export-side-cassettes.py` y
`public/models/cruz-del-sur-reference-cassettes.glb`: hornea el color de las hojas
en mapas de256px y conserva las imágenes de pantallas/fotos. El microbump sigue
siendo un acabado de previsualización Blender. No se genera un collider con los
bounds de los grupos de material, que abarcan ambos lados de la abertura.
La fuente editable permanece sin sobrescribir. Evidencia de integración en
`docs/audits/arrival-layout/`.
