# Cruz del Sur — diseño unificado compacto

Fuente principal: `cruz-del-sur-unified.blend`, escena activa
`CRUZ DEL SUR / Unified compact vessel`.

La integración posterior al juego se documenta en [RUNTIME.md](RUNTIME.md), con
exportación por materiales, colisión estructural y recorridos reales. Las
secciones de creación de este archivo describen la pasada original de Blender.

Esta pasada une la cubierta superior con el casco mediante hombros continuos,
una cintura que se estrecha alrededor del conector acristalado, contrafuertes
convergentes y dos largueros superiores. La proa de mando mantiene sus facetas
panorámicas. La llegada usa una envolvente achaflanada y una cubierta que
desciende hacia popa, con radiadores y mástil bajo integrados.

Por dentro se sustituyó la caja de paredes/techo de llegada por un collar de
presión octagonal, costillas oblicuas, techo facetado y paños técnicos inclinados.
Se conserva la circulación longitudinal y el mobiliario como referencias. El
pasillo sigue siendo de vidrio, con laterales libres a la altura de la vista.

## Organización editable

- `01 Lower hull`: copia del casco adaptado que usa el juego, agrupado por material.
- `02 Interior and equipment`: referencias interiores; los 376 elementos retenidos
  de llegada son objetos separados copiados de la fuente V10, con overrides de
  material por objeto. Los otros módulos parten de sus GLB actuales.
- `03 Panoramic connector`: tres módulos existentes a sus coordenadas reales.
- `04 Continuous shoulders`: paneles de unión, paredes de presión y collares.
- `05 Swept canopy`: cubierta, ventanas, carapacho trasero y largueros.
- `06 Structural seams`: juntas, ventilación, radiadores y luces emisivas.
- `07 Interior oblique ribs`: costillas y equipos interiores inclinados.
- `PREVIEW`: ocho luces y cámaras de revisión, excluidas de una futura exportación.

No se convirtió todo en una malla. Los paneles nuevos son piezas independientes;
el casco y varias referencias importadas conservan agrupación por material.
Los originales siguen en sus escenas y archivos anteriores.

## Archivos

- `before-unification.blend`: copia del estado recibido, incluidos cambios sin guardar.
- `unified-first-shell.blend`: respaldo previo a sustituir la caja de llegada.
- `unified-compact-hero.png`: vista general final.
- `unified-upper-deck-close.png`: unión de las tres secciones superiores.
- `unified-arrival-interior.png`: vista desde el acceso, con el techo y paños oblicuos.
- `validation.json`: revisión geométrica de la pasada final.
- `aft-pod-refinement.json`: piezas antiguas excluidas y mobiliario retenido.

## Revisión y límites

Hay 371 mallas nuevas editables y 38130 triángulos evaluados nuevos, incluidos
biseles. La escena completa contiene 861 mallas, incluidas las referencias.
La revisión final no encontró coordenadas no finitas ni triángulos nuevos de
área cero. Nueve rayos centrales a distintas alturas y seis laterales del
conector quedaron libres de geometría opaca nueva. Son muestras de despeje,
no una prueba completa de cápsula, puertas o colisiones de juego.

Se corrigió la extrusión de las placas verticales para que el espesor siga su
normal; se limpiaron triángulos colineales en los collares de presión. La vista
de edición queda en Solid. No se midieron FPS sostenidos de Blender o del juego.

La pasada inicial fue de Blender. Sus imágenes son renders de revisión, con
iluminación de estudio. La integración posterior usa assets separados de
render/colisión y mantiene los mecanismos de puertas y el pasillo existentes;
ver [RUNTIME.md](RUNTIME.md) para presupuesto y límites de verificación.

Scripts de creación/revisión, en orden:

1. `scripts/assets/build-unified-compact-ship-live.py`
2. `scripts/assets/refine-unified-compact-ship-live.py`
3. `scripts/assets/finish-unified-structural-flow-live.py`
4. `scripts/assets/validate-unified-compact-ship-live.py`

La creación se detiene si la escena ya existe para no duplicar ni sobrescribir
un diseño que el usuario haya seguido editando. La validación puede volver a
normalizar espesores, comprobar geometría, renderizar y guardar la escena activa.
