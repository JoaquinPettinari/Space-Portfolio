# Maestro de la cabina de llegada

Este estudio reúne la cabina habitable entre la puerta de docking fija y la
puerta de acceso al puente. Es un documento de autoría para revisar el conjunto;
no reemplaza automáticamente los recursos publicados del juego.

## Dirección actual: referencia de cuatro vistas

La revisión del ventanal, vitrina y piso sigue las
[correcciones expresas del usuario](turnaround-direction.md), no las etiquetas
inconsistentes de la imagen. El lado izquierdo queda despejado, sin sofá,
mesita, café ni consola. Se conserva el traje junto a la puerta trasera dentro
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

Podemos exportar la cabina como un conjunto organizado, pero no fusionarla toda
en una única malla estática. Antes de integrar: preparar texturas compatibles
con glTF, separar decoración y partes móviles, medir los recursos y revisar
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
