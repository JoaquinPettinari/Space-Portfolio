# EMU: chaqueta de exposición adaptada

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
