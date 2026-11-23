# Asterion Expanse — entorno espacial de autoría

## Segunda pasada: superficies, anillos y ventanas

`asterion-expanse-v2.blend` conserva la galaxia aprobada y refina las superficies
planetarias, la luz y los anillos. `asterion-expanse.blend` queda como respaldo
de la primera versión. El script `scripts/assets/polish-cosmos-worlds.py` aplica
esta pasada sobre la primera versión sin regenerar el fondo.

Los gigantes tienen bandas por latitud y tormentas; el eje de Nacre se alinea
con sus anillos. Las partículas de los anillos mezclan reflexión, transmisión y
transparencia, conservando las brechas geométricas y la sombra del planeta.
Vesper incorpora impactos de distintos tamaños; Orison, hielo moteado y fisuras
irregulares. Lumen y Cinder ganan presencia lateral, y Halo aporta un punto
de interés discreto hacia las ventanas superiores. Se conserva un solo Sol.

`asterion-window-review.blend` es un estudio separado con diez cámaras y los
marcos de las ventanas. Se prepara con `scripts/assets/review-cosmos-windows.py`
partiendo de V2. Usa colecciones de las fuentes de proa y cabina y los tres
módulos del corredor. Excluye el visor de docking, que muestra PAMPA.

Las posiciones de observación se proponen dentro de las áreas del proyecto,
a altura de ojos de 1,70 m; no son poses probadas con las colisiones del juego.
Los marcos de proa proceden del maestro de autoría: la geometría procedural y el
vidrio del runtime requieren una comprobación adicional al integrar el fondo.
El vidrio de esta copia de estudio se neutraliza con transparencia para aislar
el encuadre de los reflejos de los materiales de origen. Sus mallas se conservan;
esto no constituye una validación del material de vidrio del juego.
Las tres luces de relleno del estudio solo permiten leer los marcos; no forman
parte del entorno espacial ni se exportan a la app.

Escena de autoría independiente: `asterion-expanse.blend`. La versión aprobada
para integrar es `asterion-expanse-v2.blend`. La referencia guía la composición
y la profundidad; los mundos son
inventados y no reproducen la Tierra ni el Sistema Solar.

## Composición de 360 grados

- **Proa (+Y de Blender / −Z de Three):** Vesper, un mundo mineral oscuro con
  cuencas claras y borde atmosférico azul; su luna Selene; el gigante cobrizo
  Nacre con anillos separados por dos grandes brechas. Una galaxia espiral ocupa
  el fondo y deja regiones negras alrededor para preservar el contraste.
- **Popa:** Ithaca, gigante de tormentas violetas, y Orison, mundo de hielo
  turquesa. Una segunda espiral más tenue equilibra la vista opuesta.
- **Laterales:** Cinder, luna ferruginosa, y Lumen, satélite pálido; arco nebular
  y fragmentos orbitales con geometría irregular compartida.

Las cuatro cámaras `VIEW 01` a `VIEW 04` revisan cada dirección. `VIEW 05` es
una cámara panorámica equirectangular preparada para hornear el entorno.
`VIEW 06` comprueba la transición del sector artístico al fondo envolvente.
La luz solar y los materiales pertenecen al estudio de Blender: no se importan
automáticamente en la iluminación interior de la nave.

## Reproducción de la autoría

1. `scripts/assets/build-cosmos-observatory.py` construye la escena con semilla
   determinista y guarda la radiancia galáctica de 4096 × 2048 en EXR, también
   empaquetada en Blender. `-- --reuse-world` reutiliza ese EXR en iteraciones
   de geometría y materiales.
2. Sobre ese archivo guardado, `scripts/assets/build-cosmos-art-sky.py` aplica
   `asterion-galaxy-art.png`, arte generado de 1774 × 887 en sRGB. El prompt
   queda en `galaxy-art-prompt.md`. La imagen se empaqueta y se proyecta sobre
   un sector frontal de 100 grados para conservar su detalle, con un fundido
   por nodos hacia el mundo procedural continuo. No se modifica el bitmap.
   `-- --render` genera cuatro vistas y una comprobación de la transición.
3. `scripts/assets/build-cosmos-review.py` vuelve a renderizar la escena guardada;
   `-- --panorama` permite hornear una revisión de 4096 × 2048.

Después de regenerar la base hay que ejecutar de nuevo el paso 2 para conservar
la composición artística final. El EXR procedural original queda disponible como
alternativa editable; el arte generado complementa su sector frontal.

## Integración en la app

`scripts/assets/export-asterion-runtime.py` hornea los materiales y la iluminación
de V2 sin modificar el archivo aprobado. El cielo se exporta por separado, sin
planetas. Los nueve cuerpos, anillos y fragmentos conservan geometría 3D; el
archivo generado `src/game/world/asterionManifest.json` conserva su contrato de
coordenadas, dirección solar y atmósferas.

La revisión con las consolas reales detectó que ocultaban Nacre y casi todo
Vesper. La exportación derivada eleva sus centros en el eje vertical de Three
a 28 m y −12 m, respectivamente, trasladando anillos y atmósferas junto al
cuerpo. Sus tamaños, rotaciones y materiales se conservan; la fuente de Blender
permanece intacta. El exportador registra este ajuste de composición.

La app usa `public/models/asterion-worlds.glb.gz` mediante `GzipGLTFLoader` y
`public/textures/asterion/sky.webp`. El GLB sin comprimir es la alternativa para
navegadores sin `DecompressionStream`. Las imágenes intermedias y los informes
quedan en `runtime-export/`, fuera de la descarga web.

El mapa combina el detalle procedural con la luz estática aprobada y aplica la
transformación de color de Blender. Los materiales se muestran sin un segundo
tone mapping. Los anillos mantienen huecos físicos y transparencia; las
atmósferas se reconstruyen según la mirada. Esta exportación no incluye luces
que alteren el interior ni requiere rotar cuerpos con sombras horneadas.

El cielo usa filtrado anisotrópico hasta 8×, limitado por la GPU mediante Three,
para reducir el estiramiento de las estrellas cerca de los polos del panorama
al mirar por el techo. Comparte la misma textura con la consola de inspección;
no genera un cubemap adicional.

Las comparaciones, tamaños y mediciones reales se documentan en
`../../audits/asterion-integration/README.md`. Los renders de autoría por sí solos
no demuestran encuadre, fluidez ni tiempos de carga dentro de la nave.
