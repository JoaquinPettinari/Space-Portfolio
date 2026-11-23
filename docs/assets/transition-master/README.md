# Maestro de transición técnica

La variante final de estantes ya está integrada en la aplicación. Ver
[contrato de integración y reproducción](integration.md); las secciones siguientes
registran las etapas históricas de autoría.

`transition-master.blend` es un archivo de autoría independiente para el centro
entre la proa y el puente panorámico. No modifica la aplicación, las colisiones
ni ningún otro maestro de Blender. No incluye puertas nuevas.

## Organización

- `01`: paredes de presión y marcos abiertos achaflanados.
- `02`: piso desmontable, juntas, cierres y relieve antideslizante real.
- `03`: techo modular y ventilación.
- `04`: nichos, repisas, libros y cajas de equipamiento basados en
  `passageRecessPanels.ts`.
- `05`: sellos, fijaciones y señalización.
- `06`: carcasas y difusores cálidos, con acentos de estado cian.
- `90`: cámaras y luces de revisión, excluidas de una futura exportación.
- `98`: tres módulos de contexto del puente panorámico, excluidos de exportación.
- `99`: caras locales de la fuente unificada, ocultas y excluidas de exportación.

Las coordenadas de referencia de la app son X transversal, Y altura y Z hacia
arrival. Blender usa `(X, -Z, Y)`. La zona ocupa Z 2,1–5,1 m, centro 3,6 m;
el paso central mantiene X ±1,5 m, con las repisas dentro del espacio de nichos
X 1,5–1,9 m. Las bocas conservan aproximadamente 2,68 m de ancho y 2,5 m de alto.
Las cámaras `Player toward bridge` y `Player toward panorama` están a 1,7 m;
la segunda mira desde Z 1,5 hacia arrival con lente de 24 mm. El contexto visible
permite distinguir las bocas abiertas del fondo; no es una puerta ni una pared.

## Reproducción y verificación

Ejecutar Blender en segundo plano con `--threads 2 --python
scripts/assets/build-transition-master.py`. El script crea el maestro, un
manifiesto y tres vistas Workbench. La fuente leída es
`unified-ship/cruz-del-sur-interior-panels.blend`; su hash se verifica al finalizar.

Workbench permite revisar formas, solapamientos y colores base. No evalúa los
materiales Principled, reflejos ni iluminación real. Los materiales incluyen
variación sutil de rugosidad y microrelieve procedural; una futura exportación
glTF requiere hornear esos detalles o sustituirlos por mapas compatibles.
Las luces de área son sólo de revisión. `review-transition.py` actualiza el
contexto, comprueba nueve rayos de paso en el volumen central y permite generar
vistas Eevee con `--materials`, sin usar Cycles. No se midieron FPS, GPU ni carga de app.
El manifiesto registra geometría evaluada y método de preview, no rendimiento.

Se revisaron `player-toward-panorama-materials.png` y `shelf-detail-materials.png`
con Eevee a 1280×720 y dos threads. Muestran iluminación cálida, acentos cian,
reflejos del metal y relieve del piso. Son previews de autoría con muestreo bajo;
el ruido de algunas sombras no representa el resultado de la app ni una medición
de su rendimiento. El archivo queda abierto por defecto hacia el puente panorámico.

## Integración posterior

Antes de integrar se deben retirar las caras antiguas de transición del modelo
del puente y las repisas procedurales correspondientes, para evitar duplicación
y superficies coplanares. Se conservarán los colliders actuales y se verificará
continuidad con `BridgeThroatFrame` (Z 2,19) y el adaptador de
`PanoramicPassage` (Z 5,16), además del paso del jugador en ambos sentidos.
Exportar sólo las colecciones 01–06 y resolver materiales/instancias antes de
medir tamaño, carga, draw calls y tiempo de cuadro en un navegador definido.

## Variante de portal basada en referencia

`transition-portal-refined.blend` conserva el maestro anterior y desarrolla la
silueta solicitada: pies más estrechos, quiebre inferior cercano a 0,65 m,
jambas medias más anchas, hombros diagonales largos y tres capas continuas de
metal/canal oscuro. Los nichos se ven de frente en los flancos; contienen pocos
equipos y dos guías técnicas, sin filas de libros. Las repisas interiores también
quedan despejadas.

La luz mínima se mantiene en 2,68 m y la altura central útil en 2,5 m. El marco
exterior crece hasta aproximadamente X ±2,9 m; esa anchura adicional requiere
revisar el encaje con la proa antes de integrar. No se cambió ninguna colisión.
Se validan veinte rayos longitudinales desde Z 1,8 hasta 5,3, incluyendo ambas
bocas y X ±1,33, más tres comprobaciones de altura a 2,5 m. Esto verifica el
modelo, no reemplaza una prueba del jugador con Rapier.

Reproducir con `scripts/assets/refine-transition-portal.py` en Blender background
con dos threads. El script comprueba el hash del maestro original, guarda la
variante y `portal-refinement.json`, y genera `portal-refined-front.png` y
`portal-refined-niche.png` en Eevee a 1280×800/16 samples. La cámara frontal está
centrada a 1,7 m. No se exportó a la app ni se modificó Blender live.

## Cuatro módulos de estantería

`transition-shelves-divided.blend` parte de la variante del portal, que se
conserva intacta. Cada pared longitudinal tiene dos módulos separados por una
columna en Z 3,6: cuatro módulos en total, cada uno con dos niveles de apoyo.
Las columnas repiten el quiebre inferior y el hombro diagonal del marco, con
cantos metálicos escalonados y pequeñas luces cálidas.

Repisas, labios de retención y luces están divididos de verdad: sus tramos ocupan
Z 2,48–3,44 y 3,76–4,72. Ninguna repisa atraviesa la columna. Los cuatro módulos
también interrumpen el zócalo y la fascia superior alrededor de la columna,
dejando visibles sus quiebres en toda la altura. El sensor del anillo de
calibración tiene un vástago metálico de apoyo; no queda flotante. Los módulos
contienen grupos distintos y moderados: caja técnica y dos guías, manuales y
anillo de calibración, otra caja con guías, y contenedores de muestras. Los
nichos frontales y el portal permanecen como en la variante anterior.

Reproducir con `scripts/assets/divide-transition-shelves.py`, Blender background
y dos threads. Genera `shelves-divided.json`, una vista general y las vistas
`shelves-divided-port-wall.png` y `shelves-divided-starboard-wall.png`, que muestran
los dos módulos completos de cada pared. Se comprueban de nuevo veinte rayos de
paso por ambas bocas, altura central de 2,5 m y hash del archivo fuente. Los
renders Eevee son de autoría a 1280×800/16 samples; no son pruebas de FPS ni de
colisión del jugador. Esta variante tampoco está integrada en la app.

## Plantas, instrumental y columnas adelantadas

`transition-shelves-detailed.blend` conserva todas las variantes anteriores.
Se retiraron todos los libros básicos, incluidos los del nicho frontal. Los
cuatro módulos mantienen áreas vacías y contienen cajas con caras empotradas,
fijaciones y cierres, analizadores apoyados, cápsulas en bandeja y una unidad
óptica con soporte. El cian queda limitado; predominan metal, goma y cerámica.

Hay dos plantas distintas: una compacta de hojas alargadas y una colgante.
Sus 27 hojas son mallas curvas y asimétricas con espesor, nervaduras finas y
pecíolos conectados, verdes variados y rugosidad entre 0,62 y 0,695. Las macetas
tienen paredes, borde, plato y sustrato con pequeños granos. Las guías de la
colgante salen por encima del borde de la maceta antes de descender delante del
labio de la repisa. `audit-detailed-shelves.py` comprueba 40 segmentos de esas
guías contra las superficies de maceta, repisa y labio: sin cruces. Dos luces
suaves de revisión mantienen legible el follaje.

El frente de cada columna central se adelantó: pie en X ±1,46 m, cuerpo en
±1,50 y hombro superior en ±1,72, manteniendo la unión posterior. Las repisas no
cambian sus extremos; no atraviesan la columna. Se comprueban 25 rayos por las
dos bocas, más tres de altura central; el mínimo de paso sigue siendo 2,68 m.

Reproducir con `scripts/assets/detail-transition-shelves.py` en Blender background
y dos threads. El manifiesto `shelves-detailed.json` registra fuente/hash,
geometría y comprobaciones. Los previews `shelves-detailed-overview.png`, las dos
vistas de pared y `shelves-detailed-plant.png` usan Eevee a 1280×800/32 samples.
No se midieron tiempos GPU ni se exportó a runtime. Los materiales procedurales
de las hojas deberán hornearse o adaptarse al integrar, y las luces de revisión
no forman parte de esa exportación.

## Objetos personales y rodilla inferior pronunciada

`transition-shelves-personal.blend` parte de
`transition-shelves-personal-input.blend`, la copia del estado de Blender live
guardada antes de esta iteración para preservar cambios sin guardar. Se comprueba
su hash; ni ese snapshot ni las variantes anteriores se sobrescriben.

Las cuatro bahías sustituyen cajas y aparatos genéricos por una composición
contenida: zapatilla de running con upper textil, cuello acolchado e interior oscuro, lengüeta,
cordones y suela segmentada; medalla sobre soporte con cinta doblada; relieve
de montañas en marco; raqueta ovalada con encordado y grip; emblema decorativo
M-dot de triatlón sobre placa. Las plantas se conservan y queda una zona inferior
vacía. La medalla no tiene fecha, carrera ni resultado; el emblema no afirma
participación ni condición de finisher.

El pie de la columna se adelanta aproximadamente 10,5 cm más que en la variante
anterior, hasta X ±1,355 m, y la faceta inferior queda entre 0,70 y 0,94 m de
altura. Las pequeñas luces permanecen por detrás de X ±1,34. Se validan treinta
rayos de paso por ambas bocas y tres de altura central, preservando al menos
2,68 m de luz libre. `audit-personal-shelves.py` mide el frente mínimo real de
las columnas: 1,355 m para el cuerpo y 1,346 m incluyendo luces (2,692 m entre
ambos lados). También comprueba el hash del snapshot y compila el script.
La geometría no modifica los colliders de la app.

`scripts/assets/personalize-transition-shelves.py` genera la variante,
`shelves-personal.json` y previews generales, de columna, tenis, zapatilla y
medalla. Por defecto sólo repite overview y detalles de zapatilla/medalla;
`--all-views` regenera las seis cámaras. Método: Eevee, 1280×800, 32 samples, dos threads. Estos renders no son
mediciones de GPU ni una integración en runtime.

## Cuatro módulos temáticos y zapatilla reconstruida

`transition-shelves-curated.blend` organiza los objetos en cuatro grupos: deporte
en port delantero, plantas en port trasero, libros en starboard delantero y
marcos de paisajes en starboard trasero. Medalla, zapatilla, emblema y raqueta
usan los dos niveles deportivos; la raqueta se inclina 20° sobre su apoyo.
Los libros tienen tapas, lomo, bloque de páginas, líneas de corte y un volumen
acostado. No se agregaron objetos para llenar los espacios vacíos.

La zapatilla se reconstruyó con una superficie continua desde el borde de suela
hasta el cuello. El padding desemboca en paredes interiores y una plantilla
oscura, sin aro flotante. Tiene mediasuela continua curvada, goma segmentada,
lengüeta, ojales, cordones cruzados y paneles finos. La microtrama de dos Wave
en coordenadas locales produce variación visible de color, relieve y rugosidad
(0,78–0,95); la espuma de suela usa rugosidad 0,92. Es un objeto estilizado de
autoría, no un escaneo. La medalla conserva un acabado satinado y cinta textil
con bordes, sin añadir nombres de carreras, resultados o fechas.

Los dos PNG `placeholder-mountain-landscape.png` y
`placeholder-trekking-landscape.png` son ilustraciones originales provisionales
generadas localmente a 512×384 y empaquetadas en Blender. **No son fotografías
personales del usuario** ni incluyen personas. Se pueden sustituir cuando se
aporten imágenes propias.

Reproducir con `scripts/assets/curate-transition-shelves.py`.
`audit-curated-shelves.py` comprueba el hash fuente, los límites de los seis
grupos transformados usando geometría evaluada y la eliminación del collar
antiguo; también compila el script. Se conservan las comprobaciones de treinta
rayos de paso y tres de altura. `polish-curated-material.py` permite repetir sólo
el ajuste material y closeup/overview sin regenerar geometría. El manifiesto es
`shelves-curated.json`. Previews Eevee: 1280×800, 32 samples, dos threads; ninguna
medición de FPS ni integración en la aplicación.

## Objetos personales pulidos

`transition-shelves-polished.blend` deriva de la variante curated sin modificarla.
Mantiene los cuatro módulos, las columnas y los paisajes provisionales. El estilo
sigue siendo realismo estilizado: zapatilla de running con cuello bajo, puntera
levantada y arco de suela; raqueta diagonal con garganta abierta, aro fino,
pasacuerdas y empuñadura espiral. Las plantas conservan sus macetas y ganan 32
hojas curvas, nervaduras discretas y tallos conectados con distintas longitudes.

Los libros se agrupan junto al extremo de su bahía, dejando espacio vacío.
Los títulos Clean Code, The Pragmatic Programmer, Design Patterns y Refactoring
usan tipografía y encuadernaciones originales, sin reproducir portadas.

Reproducción: `scripts/assets/polish-transition-personal-props.py`, ejecutado con
Blender en segundo plano y dos threads. La variable opcional `PROP_RENDER_VIEWS`
limita renders a una lista separada por comas: overview, shoe, sports, plants,
books. `audit-polished-shelves.py` comprueba geometría evaluada de los seis grupos,
el hash de la fuente y compilación. El generador comprueba 33 rayos de paso y
altura a través de ambas bocas. Evidencia: `shelves-polished.json` y previews
`shelves-polished-*.png`, Eevee 1280×800, 32 samples. No se modifica la app ni se
infieren FPS, draw calls o memoria GPU a partir de estos renders de autoría.

## Zapatilla de referencia y fotografías personales

`transition-shelves-personal-photos.blend` parte de polished y conserva sus otras
piezas. La zapatilla se reconstruye mediante secciones: upper blanco de perfil
bajo, cuello abierto, mediasuela alta de dos capas con curvatura rocker y línea
negra, tres bandas inclinadas microperforadas, cordones blancos y acento coral.
Es una interpretación tridimensional estilizada de la referencia facilitada,
no una reproducción industrial exacta.

El módulo de fotos contiene ahora cuatro imágenes aportadas por el usuario:
`public/photos/personal/1.jpg` y `2.jpg` arriba; `3.jpg` y `4.jpg` abajo. Se muestra
cada imagen completa con su proporción original, sin recortar personas. Los
JPEG originales permanecen intactos. Se empaquetan copias en el blend, con lado
máximo de 1600 píxeles; el manifiesto registra hashes y dimensiones de cada una.
Los marcos anteriores de paisajes provisionales se sustituyen en esta variante.

Reproducción: `scripts/assets/reference-running-shoe.py`. Validación adicional:
`audit-personal-photos.py`. Evidencia en `shelves-personal-photos.json` y tres
previews overview/shoe/photos. Se comprueban la fuente, los originales, los seis
grupos, la compilación y los 33 rayos de paso; renders Eevee a 1280×800, 32 samples
y dos threads. Esta entrega es de Blender; no modifica modelos públicos ni la app.

## Terminaciones de las repisas

La variante `transition-shelves-finished.blend` se genera con
`scripts/assets/finish-personal-shelf-details.py` a partir de personal-photos.
La pasada agrega remates biselados en los retenedores, fijaciones en los soportes,
guías y tapas del difusor existente, y apoyos discretos de silicona para marcos y
libros. Conserva la composición y la geometría de los objetos expuestos.

Dos luces amplias de 3 W simulan rebote cálido sólo en la colección de preview
excluida de exportación. No constituyen una propuesta de luces para el runtime.
El manifiesto `shelves-finished.json` registra el hash fuente, las cuatro imágenes
empaquetadas, geometría evaluada y 33 rayos de paso. El generador compara un hash
de posiciones, geometría y UV de todos los grupos de objetos, libros y fotos
antes y después. Previews: `shelves-finished-overview.png` y
`shelves-finished-detail.png`, Eevee 1280×800, 32 samples, dos threads.

## Exportación estática para la aplicación

`scripts/assets/export-transition-shelves.py` lee finished sin guardarlo y produce
`public/models/cruz-del-sur-transition.glb`. Incluye las colecciones 01–08;
excluye 90/98/99, cámaras, luces, contexto y referencias. Las coordenadas ya son
world Y-up, sin offset. Los límites evaluados son X ±2,90 m, Y −0,16…3,20 m,
Z 1,96…5,28 m. Se debe retirar la geometría procedural anterior del tramo y
conservar/adaptar sus colisiones; no superponer ambas versiones.

Se reutilizan los helpers de exportación de cabina mediante AST, sin ejecutar
su entry point. Los acabados procedurales se capturan como tiles PBR de 512 px
sin iluminación y se asignan mediante proyección UV local. Las fotos mantienen
sus UV, proporciones y copias empaquetadas de hasta 1600 px. El microbump requiere
captura explícita de la normal del shader: NORMAL de Cycles dio mapas planos en
esta escena. Las 20 normales se guardan en PNG sin pérdida dentro del GLB;
color/ORM/fotos usan WebP. La adaptación por tiles conserva el acabado general,
pero no pretende reproducir exactamente cada coordenada procedural del maestro.

La medición de autoría/exportación pasa de 1213 objetos a 45 batches/primitives,
con 316.069 triángulos y 496.613 vértices. El GLB final pesa 23.636.444 bytes;
5.128.332 bytes corresponden a imágenes. La primera versión WebP completa pesaba
19.945.544 bytes, pero perdía el microbump por cuantización. La auditoría exacta
de atributos encontró sólo 314 vértices duplicados (10.048 bytes potenciales),
por lo que no se añadió una transformación de índices ni un decoder nuevo.
Estas cifras no son FPS, draw calls observados ni memoria GPU.

`runtime-export/export.json` registra hashes, materiales, textura y bounds;
`runtime-export/audit-vertices.mjs` reproduce el diagnóstico de duplicados.
La fuente conserva su hash y el GLB no incluye animaciones ni luces. La prueba
funcional/visual y los tiempos de carga del navegador pertenecen a la integración
de la app, no a este exportador.
