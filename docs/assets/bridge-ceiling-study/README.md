# Techo del puente — estudio y pulido en Blender

Revisión actual: **`bridge-ceiling-polished.blend`**, derivada del estudio sin
modificarlo. Las vigas tienen un perfil escalonado con alas satinadas, encuentros
oblicuos, apoyos facetados y un collar central. Los paños hundidos contrastan con
el metal; las luminarias cálidas tienen labios de encastre y el cian queda en
acentos más cortos. Dos luces suaves de revisión destacan los biseles.

Autoría de esta pasada: `scripts/assets/polish-bridge-ceiling.py`.
Comprobaciones: `polished-validation.json`.
Vistas: `ceiling-polished-01.png` y `ceiling-polished-03.png`.
Los estantes, el acceso, el vidrio y las claraboyas permanecen intactos.

## Estudio base conservado

Fuente: `../unified-ship/cruz-del-sur-interior-panels.blend`.
Copia editable: `bridge-ceiling-study.blend`.
Script: `scripts/assets/study-bridge-ceiling.py`.

La referencia se adapta al techo existente: costillas transversales angulares,
cassettes hundidos, rejillas, espina cálida segmentada y pequeños acentos cian.
Los paños opacos reciben los cassettes; las claraboyas conservan su vidrio y sus
aberturas. Los detalles delanteros permanecen dentro de la huella de las vigas
y de la espina opaca existentes.

Coordenadas de Blender: Z es altura, Y avanza hacia proa. La zona hasta Y = −1 m
queda protegida, incluido el marco y los primeros estantes después del puente de
vidrio. La nueva geometría empieza más adelante, cerca de Y = −0,4 m. Se
conservan distribución, consolas, sillas, piso, ventanales, claraboyas y conector.

Los paneles y luminarias sustituidos se extraen por componentes completos de
tres filas de los lotes originales. Se conservan en la colección oculta
`00 Original ceiling archived - hidden`; no se superponen con el diseño nuevo.
La fila trasera que cruza la zona protegida permanece intacta, al igual que el
casco de presión que sirve de soporte detrás de los nuevos cassettes.

## Revisión

- `ceiling-review-01.png`: vista general desde el acceso protegido.
- `ceiling-review-03.png`: detalle de cassettes, ventilación y luminarias.
- `source-ceiling-overview.png`: misma vista general antes de los cambios.

La tercera cámara `CEILING REVIEW / Ceiling diagonal` queda disponible en el
archivo para explorar la continuidad con las claraboyas.

`validation.json` registra hash de fuente, objetos conservados, componentes
archivados, huellas permitidas, altura libre y geometría nueva. Se comparan las
mallas y transformaciones de todos los objetos no sustituidos; también las
caras protegidas de los lotes parcialmente reemplazados.

Es un estudio visual con iluminación de revisión de Blender. **No se exportó
ningún GLB ni se modificó la app**, sus luces, colisiones o carga. Las imágenes
no prueban FPS ni controles; la futura integración necesitará sus propias
mediciones y comprobaciones funcionales. La fuente original permanece intacta.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' `
  --background docs/assets/unified-ship/cruz-del-sur-interior-panels.blend `
  --python scripts/assets/study-bridge-ceiling.py -- --preview
```

## Piso y paredes — revisión independiente

Revisión más reciente: **`bridge-floor-walls.blend`**, creada desde
`bridge-ceiling-polished.blend`. Conserva el techo aprobado y todos sus materiales
y luces, además de muebles, consolas, ventanales, claraboyas y estantes.

- Las placas originales del piso reciben tres variantes de grafito satinado,
  con grano fino y variación moderada de rugosidad. Se conservan sus vértices,
  biseles y juntas; no hay un segundo piso superpuesto.
- Dos registros bajos incorporan marco de titanio, inserto antideslizante,
  tiradores rasantes y tornillos. La altura máxima añadida es de 9 mm.
- Los paños opacos laterales reciben paneles de servicio, juntas oscuras,
  ventilaciones y tiradores. Quedan detrás del límite delantero del vidrio,
  sólo entre Y = −0,57 y 1,95 m, y sin ocupar el centro de la cabina.
- La zona Y ≤ −1 m conserva incluso las asignaciones de material del piso.
  No se agregaron luces: el metal responde a la iluminación aprobada del techo.

Script: `scripts/assets/polish-bridge-floor-walls.py`.
Validación: `floor-walls-validation.json` (1229 objetos originales protegidos,
240 caras de piso protegidas, geometría original del piso intacta, hash de
fuente y recursos externos). La verificación de materiales conserva los datos
originales; las variantes nuevas se asignan únicamente a la copia local del piso.

Vistas: `floor-walls-01.png` (general) y `floor-walls-02.png` (piso y pared).
Las cámaras nuevas están en `BRIDGE SURFACES / Review cameras - no export`.
No se exportó a la app ni se alteraron sus colisiones o rendimiento; esta es una
revisión visual en Blender pendiente de una futura integración y sus pruebas.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' `
  --background docs/assets/bridge-ceiling-study/bridge-ceiling-polished.blend `
  --python scripts/assets/polish-bridge-floor-walls.py -- --preview
```

## Consolas y asientos — revisión independiente

Revisión más reciente: **`bridge-consoles-seats.blend`**, derivada de
`bridge-floor-walls.blend`. El techo, piso, paredes, vidrio y estantes aprobados
permanecen intactos, junto con la iluminación existente.

Los veinte cojines originales de las cuatro sillas se conservan en una colección
oculta y se sustituyen por insertos contorneados: apoyos laterales de muslos y
espalda, soporte lumbar y reposacabezas redondeado. El textil carbón tiene
rugosidad alta, relieve de trama fino, refuerzos laterales y costuras discretas.
Las bases, carcasas traseras, brazos estructurales y posiciones no cambian.

Las superficies de trabajo reciben grafito cepillado y cinco lotes metálicos de
las consolas reciben titanio oscuro satinado. No se alteran sus vértices,
anclajes, pantallas ni controles; no se duplicaron teclados o botones. Cuatro
carcasas reciben protectores laterales facetados y una visera superior ventilada,
ajustados por fuera del plano activo de cada pantalla.

Script: `scripts/assets/polish-bridge-consoles-seats.py`.
Validación: `consoles-seats-validation.json` (1380 objetos protegidos, hash de
fuente, geometría de consolas, límites de tapizado y recursos externos).
Los detalles nuevos empiezan en Y = 0,646 m y su altura máxima es 1,286 m.
Vistas: `consoles-seats-01.png` y `consoles-seats-02.png`.

Es una revisión visual en Blender; no se exportó a la app. Los límites de
geometría comprobados no sustituyen las pruebas de colisiones ni el presupuesto
de GPU necesarios cuando se integre el modelo.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' `
  --background docs/assets/bridge-ceiling-study/bridge-floor-walls.blend `
  --python scripts/assets/polish-bridge-consoles-seats.py -- --preview
```

## Mesa central — revisión independiente

Revisión más reciente: **`bridge-central-table.blend`**, derivada de
`bridge-consoles-seats.blend`. La pantalla, el holograma y sus anclajes permanecen
intactos, igual que el resto de la cabina y los estantes.

El pedestal se reemplaza por una cintura facetada, cuatro apoyos plegados de
titanio, pie biselado y collar escalonado bajo el tablero. Los cartuchos de
servicio frontales tienen juntas, tiradores y ventilación; los laterales reciben
aletas de refrigeración. Las luces cálidas quedan encastradas en el collar y el
pie, con pequeños indicadores cian. Son materiales emisivos moderados; no se
agregaron luces ni se cambiaron las originales.

Los componentes inferiores anteriores se archivaron por componentes completos
en `BRIDGE TABLE / Earlier pedestal - hidden`. Las caras superiores retenidas
no cambiaron; el aro recibe material propio satinado. Cuatro refuerzos bajos
rematan las esquinas exteriores sin ocupar el contenido de la pantalla.

La geometría nueva respeta la huella existente: X entre −1,035 y 1,035 m,
Y entre 1,315 y 3,985 m, altura máxima 1,074 m. No invade los pasillos.

Script: `scripts/assets/polish-bridge-central-table.py`.
Validación: `central-table-validation.json` (1489 objetos protegidos, caras
retenidas idénticas, hash de fuente, límites y recursos externos).
Vistas: `central-table-01.png` y `central-table-02.png`.
La copia se verificó mediante reapertura de Blender. No se exportó a la app;
las pruebas de colisiones y rendimiento corresponden a la futura integración.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' `
  --background docs/assets/bridge-ceiling-study/bridge-consoles-seats.blend `
  --python scripts/assets/polish-bridge-central-table.py -- --preview
```

## Cabina reunida con los estantes personales actuales

Revisión completa: **`bridge-complete-review.blend`**. Combina la captura live
preservada `bridge-before-shelf-assembly-live.blend` con
`../transition-master/transition-shelves-finished.blend`. Ambas fuentes se
conservan intactas. Incluye techo, piso, paredes, consolas, asientos y mesa
aprobados, junto con los estantes actualizados.

Se incorporan las ocho colecciones editables completas: 1213 objetos visibles y
seis padres de jerarquía necesarios para mantener las plantas en su posición.
Incluyen las cuatro fotos personales, libros, plantas, zapatilla, medalla,
raqueta, objetos deportivos, estructura, paneles, piso y techo de transición.
No se importaron luces, cámaras ni geometría de contexto de la fuente.
Las matrices originales y UV de las cuatro fotografías se verifican sin cambio;
no se aplica escala ni desplazamiento adicional. Las imágenes están empacadas.

Los nichos procedurales anteriores quedan archivados y ocultos. El recorte del
marco y superficies antiguas usa los tres volúmenes de `transitionLayout.ts`,
convertidos de coordenadas runtime a Blender. Conserva UV, normales y materiales;
los originales sin recortar quedan en una colección oculta. El resto de la
cabina se verifica mediante firmas de geometría y transformaciones.

Script: `scripts/assets/assemble-bridge-personal-shelves.py`.
Validación: `complete-review-validation.json`.
Inventario íntegro importado: `complete-review-imported-objects.json`.
Vistas: `complete-review-01.png` (deportes/libros y cabina nueva) y
`complete-review-02.png` (fotografías, plantas y conexión al corredor).

Esta copia es para revisar el conjunto en Blender antes de integrarlo.
**No se modificaron ni exportaron archivos de la app.** La revisión visual no
sustituye las pruebas de navegación, colisiones y rendimiento de esa integración.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' `
  --background docs/assets/bridge-ceiling-study/bridge-before-shelf-assembly-live.blend `
  --python scripts/assets/assemble-bridge-personal-shelves.py -- --preview
```

### Ajuste del plano frontal de transición

La revisión de la app identificó una cara antigua a profundidad runtime Z = 1,80 m
(Blender Y = −1,80 m), por delante del corte inicial. El ensamblado se regeneró
con el límite frontal compartido actualizado a Z = 1,79 m. Conserva las mismas
fuentes, fotos y objetos personales; se retira únicamente esa franja antigua
adicional. El encabezado anterior ya estaba archivado en Blender.
Las dos vistas generales anteriores ilustran el conjunto previo a este ajuste
local; la revisión posterior se comprobó con geometría y reapertura, sin nuevos
renders.

## Unión estructural de sala y transición

`bridge-structure-review.blend` conserva la cabina reunida y añade el cierre
superior que faltaba entre el arco, las cabeceras de los nichos y el techo.
La franja sigue el perfil achaflanado, con una tapa continua y retornos laterales.
Se conserva el paso, las ventanas y todo el contenido personal de los estantes.

El perfil y los acabados proceden de `src/game/world/bridgeEnclosure.json`,
compartido con la app: `BridgeEnclosure` genera un sólido estático con un solo
material, sin texturas ni luces adicionales. Esta integración corrige el hueco
actual; no exporta todavía el resto de la cabina refinada de Blender.

Para reproducir la copia, abrir `bridge-complete-review.blend` y ejecutar
`scripts/assets/review-bridge-enclosure.py`. La fuente queda intacta y la copia
se guarda con una cámara dirigida a la unión. `enclosure-validation.json`
registra el hash de la fuente, las transformaciones conservadas y los cuatro
sólidos cerrados añadidos. El cambio de ejes es `(x,y,z) -> (x,-z,y)`.

## Terminaciones del conjunto

`bridge-junctions-polished.blend` continúa desde `bridge-structure-review.blend`.
Añade paneles de servicio sobre los nichos, juntas del techo, cornisas con lentes
cálidas y remates bajos de las consolas. Las 66 piezas nuevas reutilizan los
materiales existentes; no se agregan luces. Se revisaron la vista general desde
los estantes y la vista inversa del arco y sus encuentros superiores.

Script reproducible: `scripts/assets/polish-bridge-junctions.py`.
`junctions-validation.json` confirma la fuente intacta y 2830 objetos originales
preservados mediante firmas de posiciones, materiales, visibilidad y UV; incluye
las cuatro fotografías. La copia se guarda aparte. Esta pasada es de autoría
Blender: no está exportada a la app, y no implica una medición de FPS ni una
validación de colisiones en navegador.

## Techo continuo hacia la proa

`bridge-ceiling-complete.blend` prolonga el diseño de techo nuevo hacia delante.
Los antiguos paños superiores de vidrio quedan cubiertos por cassettes opacos
ajustados a la pendiente y al estrechamiento del casco. Las ventanas frontales
y laterales permanecen sin modificar, al igual que los estantes personales.
Las nervaduras coinciden con las estaciones estructurales existentes y las
luminarias tienen carcasa, alojamiento y difusor separados.

Script: `scripts/assets/extend-bridge-ceiling.py`, ejecutado sobre
`bridge-junctions-polished.blend`. Agrega 73 mallas y reutiliza los materiales
existentes sin añadir luces. `ceiling-complete-validation.json` registra la
fuente intacta y la conservación de objetos y transformaciones. Se revisó
visualmente desde la cámara `CEILING BOW REVIEW / Whole ceiling`.
Es una revisión Blender; la app todavía no incorpora este techo y requiere
exportación y comprobaciones de rendimiento y navegación propias.
