# Maestro de la cabina de llegada

Este maestro reúne la cabina habitable entre la puerta de docking fija y la
puerta de acceso al puente, más la esclusa posterior. Es el documento de autoría;
el juego utiliza los GLB exportados, no el `.blend` directamente.

## Integración al runtime — 2026-11-18

`scripts/assets/export-cabin-master.py` lee el maestro en Blender background sin
guardarlo. Exporta `public/models/cabin-master-static.glb` en metros mundiales
Y-up y `public/models/cabin-master-sliding-leaves.glb` en el espacio local del
mecanismo existente. Excluye archivos, fondo espacial, luces, cámaras, terminal
y displays de previsualización; el terminal dinámico permanece en código.

Los objetos estáticos se agrupan por material y zona. Los acabados procedurales
se convierten a mapas PBR reutilizables de 512 px, conservando fotografías y UV
de imágenes existentes. El vidrio usa transparencia suave, sin el coste de
transmisión refractiva. `runtime-export/export.json` registra tamaños, límites,
materiales, imágenes y pivotes. La fuente `.blend` conserva su hash durante la
exportación.

El código reemplaza los lotes visuales antiguos de llegada, sin duplicar cabina,
traje ni puerta fija. Las hojas móviles mantienen su acreditación y recorrido;
el piso y los muebles usan colisiones independientes. Sofá, mesita y café dejan
de renderizarse en llegada. La nueva esclusa es visible por el visor y sigue
cerrada al recorrido. Los visores de navegación y táctico usan el mismo conjunto.

Las luces de estudio no se importan: el juego adapta iluminación y reflejos.
Las comparaciones de rendimiento, capturas y pruebas están en
[la auditoría de integración](../../audits/cabin-master-integration/README.md).
Las secciones siguientes registran las pasadas artísticas anteriores; sus notas
de «sin cambios en runtime» describen el estado de cada pasada, antes de integrar.

## Dirección actual: referencia de cuatro vistas

La revisión del ventanal, vitrina y piso sigue las
[correcciones expresas del usuario](turnaround-direction.md), no las etiquetas
inconsistentes de la imagen. El lado izquierdo queda despejado, sin sofá,
mesita, café ni consola. La ampliación del 18 de noviembre permite una repisa
baja con planta, objetos de exploración y portarretratos, manteniendo el centro
del ventanal libre. Se conserva el traje junto a la puerta trasera dentro
de una vitrina, se coloca una planta donde estaba el café y se mantiene la pared
técnica a la derecha. No se añade ninguna puerta lateral.

El respaldo de esta revisión es `before-turnaround.blend`. La documentación de
ensamblado que sigue describe la base anterior a esta redistribución.

`turnaround-audit.json` registra los objetos activos y los archivados, excluidos
del render, viewport y exportación. Las nuevas colecciones separan
ventanal panorámico, vitrina EVA, planta de esquina y placas de piso. Se verificó
que los cinco nodos de posición de puertas, terminal y traje permanecieran
idénticos. `assembly.json` sigue siendo el inventario histórico del ensamblado.

La referencia corregida está empaquetada en el archivo. `revise-turnaround.py`
documenta esta pasada y evita volver a aplicarla sobre la misma revisión.
`render-turnaround.py` genera cuatro vistas sin guardar sus ajustes de render.

La revisión se verifica en `turnaround-window.png`, `turnaround-service.png`,
`turnaround-fixed-door.png` y `turnaround-sliding-door.png`. Los rótulos de piso
tienen placas continuas para que no los corte una junta. El fondo panorámico usa
la textura espacial completa empaquetada, visible sin bordes de plano desde
ángulos oblicuos, y se mantiene separado de la iluminación del estudio.

Los GLB de llegada, detalles, casco y puerta móvil conservan sus hashes. La
validación de esta pasada corresponde a Blender y a sus renders; no se ejecutan
pruebas de circulación del juego hasta integrar el nuevo diseño y sus colisiones.

## Detalle de marcos y puertas

La puerta de acceso tiene hojas oscuras con puertos cian estrechos y herrajes
parentados a cada hoja. La de docking incorpora un perímetro escalonado,
sellos y cierres. El ventanal conserva la abertura despejada con capas de marco
y uniones en las esquinas. El piso combina registros centrales anchos, agarres
hundidos, zonas antideslizantes y canales luminosos en las juntas.

La pasada posterior de formas conserva el respaldo `before-detail-pass.blend`.
`detail-architecture-audit.json` registra las piezas sustituidas y las posiciones
preservadas. Una comprobación sobre copias de las hojas verifica que sus 18
piezas nuevas acompañen el desplazamiento lateral de 1.37 m. Esta verificación
de jerarquía en Blender no sustituye una prueba de apertura en el juego.

`detail-pass-audit.json` registra cuatro registros centrales grandes, detalles
de piso limitados a 0.025 m de altura y la geometría activa evaluada antes y
después: 271.636 y 295.507 triángulos. Son medidas de autoría en Blender, no
mediciones de tiempo de cuadro ni del coste final de exportación. Las piezas
sustituidas quedan archivadas y excluidas de la vista, el render y la exportación.

Las capturas `before-detail-*.png` conservan el aspecto anterior. Las cuatro
`turnaround-*.png` muestran la revisión desde las mismas cámaras.

## Terminaciones constructivas

La pasada de terminaciones utiliza la colección `18 Construction finishing`:
panelizado y soportes de luminarias, herrajes y sellos de la vitrina, y conexiones
de instrumentación y cableado técnico. `finishing-pass-audit.json` verifica que
los siete nodos de integración conservan sus matrices locales y mundiales.
La geometría evaluada pasa de 295.507 a 320.534 triángulos; la medición corresponde
al maestro de Blender, no al rendimiento del juego. Su recuento de objetos activos
excluye además los objetos ocultos del render.

El respaldo es `before-finishing-pass.blend`; `before-finishing-*.png` conserva
las vistas anteriores. Los recursos del juego permanecen intactos.
Se revisaron las cuatro cámaras y `finishing-service-closeup.png`, incluyendo
la unión del manómetro y las terminaciones del cableado. La cámara de la pared
técnica queda activa en el maestro; los instrumentos son decoración estática.

## Luz y materiales

La revisión de luz y materiales conserva `before-light-material-pass.blend` y
las vistas `before-light-material-*.png`. `light-material-audit.json` registra
los parámetros anteriores y posteriores. Se diferencian pintura grafito satinada,
cobre, herrajes, piso metálico y superficies antideslizantes, con luces de estudio
para el rebote cálido del techo y los umbrales.

Esta pasada conserva geometría y posiciones de integración. Las luces de apoyo
son de autoría: no deben añadirse automáticamente al renderer del juego. El
acabado requiere adaptación de materiales e iluminación y medición al exportar.

## Paneles, herrajes y registros de piso

La pasada `surface-polish.py` añade paneles de inspección y refuerzos en dos
paños ciegos, cubiertas de mecanismos en las puertas y alojamientos perforados
para los tornillos de los cuatro registros centrales. Los remates de esquina
mantienen el piso enrasado; la altura máxima medida es 0.015 m. Se conservan
los materiales y las luces de la revisión anterior.

`surface-polish-audit.json` registra 320.534 → 346.188 triángulos evaluados,
los siete nodos de integración invariantes y una prueba sobre copias en la que
30 piezas por hoja acompañan el recorrido lateral de ±1.37 m. Esta comprobación
de jerarquía no verifica colisiones ni apertura en el juego. Las cuatro caras
sustituidas del piso se conservan archivadas y excluidas.

El respaldo es `before-surface-polish.blend` y las imágenes anteriores son
`before-surface-polish-*.png`. Los recursos publicados no se reemplazan.

## Ventanal y repisa de observación — 2026-11-18

`window-dressing.py` reemplaza el marco anterior por un perímetro octagonal
escalonado y añade una repisa achaflanada con soportes, fascia y acentos ámbar.
Se reutiliza la planta existente y se agrupan un instrumento orbital, una muestra
y dos portarretratos en los extremos. No hay consola ni pantalla central.
Los portarretratos usan imágenes espaciales locales empaquetadas en el maestro.

El respaldo es `before-window-dressing.blend`, con vista anterior en
`before-window-dressing.png`. La revisión se observa en `turnaround-window.png`
y `window-dressing-oblique.png`; las otras vistas históricas pueden mostrar el
ventanal anterior hasta su próximo render.

`window-dressing-audit.json` registra las piezas sustituidas archivadas, los siete
nodos de integración preservados y la geometría evaluada: 346.188 → 351.899
triángulos. El centro de la repisa queda libre. Esta revisión es de autoría;
sus apoyos y decoración requieren colisiones y medición al integrarlos al juego.

### Pulido de follaje y acabados

`window-polish.py` refina los objetos existentes: hojas curvas con nervios y
peciolos, ramas laterales colgantes, borde y base de maceta, graduaciones y pivotes
del instrumento orbital, apoyos de portarretratos y vidrio sutil. Las fotografías
siguen sin emisión. Los acabados de pintura, metal y muestra se ajustan mediante
materiales locales, sin modificar los materiales compartidos del resto de la
cabina ni añadir luces.

El respaldo es `before-window-polish.blend`, con vistas previas frontal y oblicua.
`window-polish-audit.json` registra geometría, follaje archivado y los siete nodos
de integración conservados. Además de las vistas generales, se revisa
`window-polish-closeup.png` para comprobar hojas, maceta y herrajes.

### Marco y luz de repisa

`window-frame-light.py` refina las uniones del perímetro y reemplaza las tiras
anteriores por canales con difusor ámbar. Las luces de apoyo pertenecen al estudio
de Blender; no se incorporan automáticamente al juego. Se conservan la exposición,
la iluminación del techo, los objetos y el centro libre.

El respaldo es `before-window-frame-light.blend`, acompañado por las vistas
anteriores frontal y oblicua. `window-frame-light-audit.json` registra geometría,
fuentes de luz y las transformaciones de integración preservadas. Las imágenes
generales del ventanal se actualizan con esta pasada.

## Esclusa detrás de docking y entorno del ventanal

`docking-vestibule.py` incorpora un recinto cerrado detrás de la puerta fija,
visible por su visor: piso, paredes, techo, pasamanos, ventilación y un cierre
exterior estático. La abertura de la puerta ya existía; se conserva su malla y
se sustituye únicamente su material local opaco por vidrio transmisivo. El
material original se conserva. La puerta no adquiere interacción ni apertura.
El acabado final del visor simplifica el vidrio: 96,5 % de transparencia y 3,5 %
de superficie dieléctrica, sin refracción. Evita las imágenes dobles de la malla
biselada original; el fondo visible sigue siendo el recinto tridimensional.
La unión frontal queda detrás del collar existente, sin invadir el mamparo.

La misma pasada refina materiales del piso lateral y remates de zócalo junto al
ventanal. La repisa, los objetos y su centro libre se mantienen. El respaldo es
`before-vestibule.blend`; `vestibule-audit.json` registra geometría, luces, nodos
de integración y rayos de comprobación del cierre detrás del visor.

Las vistas actualizadas son `turnaround-window.png`, `turnaround-fixed-door.png`
y `vestibule-through-glass.png`. Los rayos comprueban muestras de visibilidad,
no certifican colisiones ni una simulación física de presurización. El recinto
pertenece al maestro artístico y aún requiere adaptación a la envolvente exterior,
colisiones y presupuesto de render al integrarse al juego.

### Terminaciones de la esclusa

`vestibule-finish.py` añade el despiece achaflanado y varillaje del cierre exterior,
soportes de pasamanos, registros con tiradores hundidos y remates de drenaje.
Conserva vidrio, iluminación y distribución. El respaldo es
`before-vestibule-finish.blend`, con capturas previas de docking y visor.

`vestibule-finish-audit.json` registra 384.405 → 397.177 triángulos evaluados,
siete nodos de integración preservados y 35 rayos de comprobación del recinto.
El detalle nuevo del piso alcanza 0.019 m; la cabina conserva 0.015 m.
Se revisaron el visor y `vestibule-interior.png`, que muestra el piso y los
encuentros desde una cámara interior. No se añadieron luces ni funciones al juego.

### Materiales e iluminación de la esclusa

`vestibule-material-light.py` ajusta materiales exclusivos del recinto: pintura
grafito satinada, acero cálido en herrajes y reflejo suave del piso. Reorienta las
dos luces interiores existentes hacia el cierre, con 62 y 48 W, conservando
sombras laterales. Son parámetros de autoría en Blender, no valores para copiar
directamente al juego.

El respaldo es `before-vestibule-material-light.blend`, con tres capturas previas.
`vestibule-material-light-audit.json` registra los parámetros anteriores y finales.
La geometría evaluada se mantiene en 397.177 triángulos: vidrio, siete nodos de
integración, cámaras, exposición y luces externas no cambian. Se revisaron las
vistas de docking, visor e interior con las mismas cámaras; no se añadieron luces.

## Base de ensamblado

Abrir `cabin-master.blend`. El inventario `assembly.json` registra fuentes,
posiciones y límites. La primera composición contiene 1.275 objetos organizados
en 12 colecciones: casco y vidrio, piso y rejillas, techo, salón y cafetera,
nicho EVA, pared técnica refinada, puerta fija, puerta móvil, terminal,
luces y cámaras, referencias empaquetadas y fondo espacial de previsualización.

La primera revisión contenía 1.284 objetos en 13 colecciones. Se retiraron las
215 piezas de la pared anterior y se incorporó la revisión del
estudio. Las cámaras `CAM / Lounge and EVA` y `CAM / Service wall and access`
permiten revisar ambos lados desde dentro. El fondo espacial y las luces de
estudio no deben exportarse como decoración de la cabina. El pulido añade una
colección 13 de pantallas de previsualización, también excluida de exportación:
la interfaz real del terminal la dibuja el juego.

## Primera revisión visual

Se unificaron materiales de estructura con la pared refinada, se ajustó el piso
a metal oscuro con rugosidad variable y se añadieron luces cálidas de estudio.
Se corrigieron el mapeo del fondo espacial y un reflejo azul excesivo del vidrio.
`polish.json` registra estos cambios y las cuatro cámaras.

Se renderizaron y revisaron `master-lounge.png`, `master-service.png`,
`master-fixed-door.png` y `master-sliding-door.png`. Los renders de revisión usan
1000 × 640, 16 muestras y reducción de ruido; la configuración guardada de la
escena conserva 1400 × 900 y 32 muestras.

El ensamblado valida las posiciones locales de las hojas y los límites de las
piezas importadas. Los hashes de los GLB de llegada, detalles, casco recto y
puerta móvil permanecieron iguales. No se ejecutaron pruebas del navegador:
este cambio todavía no modifica la escena del juego ni demuestra su rendimiento.

## Organización e integración

La estructura, el mobiliario, la pared técnica, el traje y las dos puertas se
mantienen separados. La puerta móvil debe conservar sus hojas y transformaciones
independientes: la acreditación, el movimiento de apertura y las colisiones
siguen siendo responsabilidad del código.

La pared técnica refinada proviene del estudio dedicado. Se sustituye su versión
anterior para evitar superposiciones. El casco debe conservar el perfil recto
de `arrivalShellLayout.json` y los huecos de ambas puertas.

La exportación conserva decoración y partes móviles separadas, con texturas
compatibles con glTF. Cada revisión requiere medir los recursos y comprobar
recorridos, acceso y colisiones en el juego. Los renders de Blender sólo validan
la composición artística, no el comportamiento ni el rendimiento del navegador.

Los archivos de origen y los GLB del juego se conservan. El maestro será el
documento editable para las siguientes revisiones de la cabina.

## Contrato de posición del juego

Coordenadas del runtime (Y arriba); en Blender se convierten a `(x, -z, y)`.

| Pieza                      | Posición runtime        | Orientación |
| -------------------------- | ----------------------- | ----------- |
| Puerta docking fija        | `[0, 0, 18.265]`        | yaw π       |
| Raíz de hojas móviles      | `[0, -0.18, 11.65]`     | yaw 0       |
| Marco fijo de puerta móvil | `[0, -0.18, 11.17]`     | yaw 0       |
| Terminal Crew Access       | `[2, 1.65, 12.37]`      | yaw 0       |
| Traje EVA                  | `[-2.17, 0.18, 17.765]` | yaw π       |

`LEAF_LEFT_SLIDE` y `LEAF_RIGHT_SLIDE` tienen X local inicial −0.685 y +0.685.
Cada hoja se desplaza 1.37 m hacia su lado al abrirse. Esto describe el mecanismo
existente; una previsualización Blender no sustituye la lógica de acreditación.
