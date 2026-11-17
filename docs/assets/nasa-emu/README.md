# EMU: chaqueta de exposición adaptada

## Traje completo de la cabina de referencia — 2026-11-17

El runtime utiliza ahora `cruz-del-sur-eva-full.glb`. Se recuperan pantalón,
botas y dos bolsillos de la fuente NASA original y se unen a la prenda superior
con brazos relajados. Se identifican por topología las islas del soporte de
exposición y se excluyen; también se retiran el fragmento posterior y el antiguo
colgador de la adaptación superior. Los GLB anteriores permanecen intactos.

La escala uniforme conserva proporciones: 2,118 m de alto, 0,88 m de ancho y
0,748 m de profundidad. El asset contiene 56.206 triángulos, cinco materiales y
1.461.080 bytes; no añade texturas, armature, animación ni luces al modelo.
`full-audit.json` registra las dimensiones, los componentes originales y el coste.
`full-preview.png` se renderiza leyendo únicamente el GLB final.

El nicho se extiende hasta una plataforma a 0,18 m del piso; se conserva su ancho
y separación de la escotilla. El collider ahora cubre las piernas y la base.
Dos acabados emisivos aportan líneas cian y una luminaria cálida visible, sin
luces reales ni sombras nuevas. La prueba carga el GLB real para verificar
dimensiones, presupuesto de triángulos, cinco materiales y despeje de escotilla.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background --factory-startup --python scripts/assets/prepare-full-emu.py
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background --factory-startup --python scripts/assets/preview-nasa-emu.py -- --full
```

Las secciones siguientes documentan las adaptaciones anteriores conservadas.

Fuente: [Extravehicular Mobility Unit — NASA Science](https://science.nasa.gov/3d-resources/extravehicular-mobility-unit/).
Autoría indicada por la fuente: **NASA/Michael D. Carbajal**.

El archivo original se descargó del enlace GLB de esa página y se conserva como
`original.glb` (3.448.904 bytes). NASA indica que los assets de su repositorio 3D
se pueden descargar y usar gratuitamente; se aplican sus
[directrices de uso de imágenes y medios](https://www.nasa.gov/nasa-brand-center/images-and-media/).
No se afirma revisión ni respaldo de NASA al portfolio.

## Adaptación al juego

`public/models/cruz-del-sur-eva-suit.glb` es una **adaptación decorativa**, no una
reproducción de ingeniería sin modificaciones:

- Se utiliza la prenda superior y el casco como chaqueta colgada; se retiran
  piernas, soportes de exposición y fragmentos de raíles desconectados. La
  envolvente posterior se recorta para alojarla en el nicho.
- Se limpia y cierra la sección posterior y el corte inferior. Los brazos se
  relajan hacia el cuerpo conservando la proporción, sin escalar ejes distintos.
- Se sueldan vértices partidos por normales antes de simplificar, para conservar
  la continuidad de las mangas. El original tiene 343.455 triángulos; el asset
  preparado tiene aproximadamente 42.000 en cinco materiales.
- Los materiales transparentes del GLB original se sustituyen por tejidos
  opacos, refuerzos, bandas ocre y visor cerrado dorado. Se retiran texturas de
  insignias y parches y se sustituyen por superficies neutras.
- Sin texturas descargadas en runtime, animación, luces, sombras ni colisiones.
- glTF Y-up, base Y=0, centrado X/Z y frente +Z. El componente del juego lo gira
  hacia la habitación y define su collider por separado.

Las dimensiones medidas y los bytes están en `audit.json`. La profundidad máxima
se amplió a 0,75 m por autorización del agente principal para conservar el
volumen real de las mangas; el asset final permanece dentro de ese límite.

## Reproducción y revisión

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background --factory-startup --python scripts/assets/prepare-nasa-emu.py
node scripts/assets/clean-emu-islands.mjs
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background --factory-startup --python scripts/assets/preview-nasa-emu.py
```

El script usa una instancia separada con escena de fábrica y no modifica ni
guarda el Blender abierto del usuario. Produce el GLB, `audit.json` y
`prepared-preview.png`. La revisión del render corresponde a esta adaptación,
no al modelo original ni a una medición de FPS del juego. La comprobación nativa
de ubicación, colisiones y rendimiento queda en la auditoría de integración.

`finish-emu-display-rails.py` permite repetir únicamente el último corte de
restos altos del soporte sobre un GLB ya preparado. Es idempotente y no vuelve
a simplificar la prenda; la preparación completa ya incluye el mismo filtro.
La pasada final retiró 79 triángulos de esos fragmentos sin cambiar dimensiones.

La limpieza posterior `clean-emu-islands.mjs` identifica ocho islas de soporte
mediante triángulos, material y centro geométrico confirmados en `components.json`.
Retira otros 279 triángulos de raíles y bloques sostenidos por los guantes. No
corta prendas por planos: conserva índices de mangas y manos, atributos,
normales, materiales y pose. Solo modifica los índices de dibujo; los vértices
sin usar se mantienen como padding de los bounds anteriores, sin rasterizarse.
El GLB final tiene **41.642 triángulos, cinco materiales y 1.300.520 bytes**.
La operación es idempotente y rechaza una coincidencia parcial en lugar de
borrar geometría distinta por proximidad. El render final se genera únicamente
leyendo este GLB; no lo reexporta ni lo modifica.

## Postura de prenda vacía — 2026-11-17

El juego usa ahora `cruz-del-sur-eva-hanging.glb`, derivado del preparado anterior
sin sobrescribirlo. `prepare-hanging-emu.py` orienta brazo y antebrazo hacia abajo
con dos rotaciones horneadas y una mezcla continua alrededor del codo. Conserva
las uniones del hombro y las islas completas de los guantes, sin añadir un rig
al juego. El centro de cada guante queda más de 5 cm por debajo del bajo de la
prenda y a menos de 12 cm laterales de su hombro. La silueta completa mide 71,4 cm
de ancho, frente a los 93 cm de la postura anterior con codos separados. Añade un
soporte visible detrás de los hombros. Las piezas del soporte se unen al mesh
existente y reutilizan su material: conserva cinco primitivas/materiales, sin
armature, animaciones, luces ni sombras nuevas.

La copia tiene 41.678 triángulos y 1.120.156 bytes. El test de
`evaEquipmentLayout.test.ts` carga este GLB real y comprueba el espacio libre
frente a la escotilla, su contención dentro del collider existente y los límites
de ancho y caída de las manos. Las medidas
de exportación están en `hanging-audit.json`; la vista de frente está en
`hanging-preview.png`. La imagen no constituye una medición de FPS del juego.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background --factory-startup --python scripts/assets/prepare-hanging-emu.py
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background --factory-startup --python scripts/assets/preview-nasa-emu.py -- --hanging
```
