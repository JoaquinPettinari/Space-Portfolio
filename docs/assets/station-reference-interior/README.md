# Interior de estación — estudio de referencias

Interpretación de las cinco imágenes suministradas por el usuario: sala de
observación/control con consolas y mesa táctica, vista hacia la entrada,
sala de acceso y compuerta de docking. Se aprovechan copias de la cabina y la
sala de acceso V10 existentes. Es una fuente visual editable, no una copia
fotográfica exacta. Sus materiales cálidos y un subconjunto de detalles ya están
integrados en el juego. La estación jugable y la nave exterior se cargan como
assets distintos pero alineados como una sola nave; el estudio conserva su propia
escena de presentación.

## Ubicación corregida: el jugador ocupa la nave

La colocación anterior como nave distante era una interpretación incorrecta.
Ahora `PlayerShipHull` carga `cruz-del-sur-player-hull.glb` en el mundo, alrededor
y por debajo de la arquitectura jugable. Se retiraron `ReferenceShip` y sus
constantes de pose distante. El punto de inicio continúa en la sala de llegada,
ahora integrada en el recorrido de la cubierta superior del casco.

La copia ajustada usa traslación [0,-2.64,2.01] y escala [1,1.6,1.2]. Se recorta
la torre cerrada usada para presentación: la arquitectura real de puente,
pasillo de vidrio y llegada forma el volumen superior. El recorte interpola
vértices/normales al cortar triángulos, conserva el casco bajo el piso y añade
una base de unión inferior sin superficies coplanares con los pisos existentes.
Esto adapta las proporciones al recorrido actual: no se afirma que ambos
modelos originalmente coincidieran a escala. El GLB original se conserva.

Generador: `scripts/assets/fit-player-ship.mjs`. Salida: 76343 triángulos,
15 mallas/materiales, 5508652 bytes, sin texturas ni luces nuevas.
`playerShipHullAsset.test.ts` usa rayos reales contra el GLB final para comprobar
casco bajo las tres zonas y vistas laterales/altas despejadas. La iluminación
cálida no cambia; su color no determina el coste de renderizado.

Las secciones siguientes describen las pasadas anteriores; la colocación
distante y las menciones a una estación separada quedaron sustituidas por este
ajuste. Evidencia actual: `game-player-ship/`.

`review-player-ship-live.py` genera una vista exterior de encaje importando los
GLB reales en una escena temporal de Blender; añade superficies de canopy desde
el manifiesto de layout. `upper-deck-assembly.png` es una comprobación de montaje
con iluminación de estudio, no una captura ni una promesa de calidad del juego.
No representa todos los elementos procedurales/DOM del runtime. Los recorridos
del juego se capturan aparte. Pasaron el pasillo (colisiones y Pointer Lock),
el archivo (lectura/descarga de CV) y la revisión visual con desplazamiento real
hasta las consolas delanteras y regreso evitando la mesa central.

Última muestra de 90 cuadros, Intel UHD/ANGLE, 1280 × 720, DPR 1: puente hacia
proa 19.8 / 22.3 ms p95; hacia entrada 21.9 / 25.6 ms p95. El pasillo dio
19.2 / 21.8 ms en su recorrido. El casco añade geometría visible alrededor del
recorrido: no se afirma que sea gratis ni que se garanticen FPS sostenidos.

## Corrección de colocación y nave visible en el juego

Estado actual: se retiró el cartel físico del CV y su componente `CrewDossier`.
La descarga profesional permanece en Central Archive, Personal Workstation y el
portfolio accesible. Las instrucciones de misión/tablet ya no remiten al cartel.
Ambos nichos ahora son decorativos: el complemento ámbar exporta las 58 piezas
en cinco mallas, 334652 bytes. Las cifras y la reserva del CV de la primera
integración, documentadas más abajo, son históricas.

`remove-exterior-niche-plant.mjs` retira la planta vieja que estaba detrás de la
fachada: 856 triángulos, incluyendo maceta, tallos y hojas. `--arrival` retira
324 triángulos de las tres antiguas `ARR10 locker inset face` que seguían en el
GLB aunque el estudio las ocultaba. Se conservan backups del estado previo en
`runtime-before-placement/`, imágenes sin recodificar y todos los anclajes de
interacción. Los scripts comprueban que una repetición no sobrescriba un asset
editado independientemente. La limpieza de llegada reutiliza índices existentes;
la del puente añade índices filtrados al binario, por lo que su descarga crece
aproximadamente 1.75 MB aunque dibuja menos triángulos. No se presenta como
compresión. Los dos reversos opacos de `BridgeInterior` cierran los nichos desde
el pasillo sin invadir la abertura central.

La nave real anterior ya está en `ReferenceShip`, visible fuera de la estación.
Su posición fija y escala están en `referenceShipLayout.ts`; no sigue la órbita
de planetas y no contiene el interior jugable. `export-reference-ship-game-live.py`
excluye toda presentación de Blender, agrupa 1802 objetos en 16 mallas/materiales
y simplifica solamente copias evaluadas: unos 92 mil triángulos y 5.72 MB. No
añade texturas, luces ni sombras. La metalicidad se limita a 0.45 para que el
casco sea legible con la iluminación del juego, que no tiene el estudio de
reflejos de Blender; `prepare-reference-ship-materials.mjs` aplica el mismo ajuste
a una exportación ya creada, conservando sus datos binarios.

`referenceShipAsset.test.ts` comprueba el presupuesto real exportado y que el
modelo transformado quede íntegramente más allá de la proa de la estación.
`amberDetailsAsset.test.ts` ahora verifica el paso central libre en lugar de
reservar espacio para el cartel eliminado. Playwright conserva capturas de la
nave, los nichos desde ambos lados y la llegada en `game-placement-review/`.
El recorrido de pasillo comprueba paredes, salida/reentrada del cursor; el de
Archive verifica lectura y descarga real del CV. La prueba del nicho se actualizó
tras detectar que su preparación esperaba un antiguo botón de tablet ya ausente:
ahora espera el HUD real `Game controls`, sin cambiar tolerancias de controles.

Con la nave visible, la última muestra Intel UHD/ANGLE (1280 × 720, DPR 1)
dio 18.0 ms / 21.0 ms p95 hacia la proa y 20.2 / 24.7 ms hacia la entrada.
Otra repetición dio 16.8 / 19.2 y 18.1 / 20.9 ms. La nave añade geometría y
draw calls: no se afirma que su incorporación sea gratis ni que estas muestras
garanticen FPS sostenidos. La consola y las excepciones permanecieron limpias
en el recorrido final. El pasillo con entrada real dio 17.1 / 20.0 ms, 85 draw
calls en su muestra; los encuadres y cachés impiden tratarlo como un benchmark
controlado frente a las pasadas anteriores.

## Archivos y escenas

- `station-reference-interior.blend`: archivo actual. Escena activa
  `Station / Reference interior and Cruz del Sur`.
- `before-station-study.blend`: estado recibido antes de crear este estudio.
- `station-observation.png`: vista desde la entrada de observación.
- `station-ship-view.png`: vista más cercana hacia las consolas y la nave exterior.
- `station-rear.png`: mesa táctica y portal vistos desde delante.
- `station-arrival.png`: sala de acceso y pasaje.
- `station-docking.png`: compuerta cerrada, señalización y liberación manual.
- `validation.json`: revisión de mallas, imágenes y visibilidad de la nave.
- `station-glass-passage.png`: pasillo corregido con laterales y techo de vidrio.
- `browser-passage.png`: captura del juego real, tomada con Playwright tras caminar al pasillo.
- `browser-passage-measurement.json`: muestra de 90 cuadros del navegador, con GPU y resolución.
- `viewport-performance.json`: comparación de vistas de trabajo en Blender.
- `before-glass-performance.blend`: copia anterior al cambio del pasillo y a la vista ligera.
- `station-amber-observation.png`: vista general actual con iluminación ámbar.
- `station-amber-details.png`: detalle de nichos, estantes y luminarias cálidas.
- `before-amber-lighting.blend`: copia anterior al ajuste de iluminación.
- `amber-lighting-validation.json`: presupuesto de luces y materiales de esta pasada.
- `viewport-performance-before-amber.json`: comparación de viewport anterior al cambio de materiales.

La escena del exterior y la colección original `BRIDGE / EDITABLE` permanecen
en el archivo, con sus objetos originales. La estación usa objetos copiados;
sus cambios de materiales son overrides por objeto y no alteran los materiales
de las mallas compartidas de la cabina original. La sala de acceso se copia
desde `docs/assets/arrival-room/arrival-room-v10.blend`; su escena fuente se
conserva también. No se reescriben los archivos originales ni los GLB.

## Relación entre estación, nave y cabina

La nave que se ve por las ventanas es una instancia de las colecciones geométricas
del exterior aprobado. Es geometría 3D real, con su posición y orientación propias.
Sus luces, cámaras y planeta de presentación no se incluyen en la instancia.
No se dibuja mediante una imagen de fondo.

El interior original de la nave y su casco exterior siguen separados: no están
ajustados como un conjunto transitable. Este estudio representa una estación
independiente con la nave afuera. La compuerta y el pasaje son arquitectura de
la estación; no constituyen un corredor transitable hasta la nave. El diseño de
planeta, estrellas y entorno queda aplazado por el usuario.

## Trabajo de esta versión

- Copia de sala de control con techo opaco y luminarias cálidas según referencias.
- Pantallas cian con diagramas gráficos propios, sin interfaces profesionales
  inventadas ni terminales interactivos nuevos.
- Mesa táctica con carta y globo de líneas emisivas estático.
- Sala de acceso existente V10, pasaje facetado y compuerta de docking detallada.
- Plantas, tazas, libretas, notas de misión, botiquín y rótulos decorativos.
- Acabados independientes de piso/mesadas y luces de revisión.
- Corrección de tres caras de lockers antiguas que quedaban separadas del banco
  en la copia de trabajo. Los objetos de la fuente V10 se preservan.

## Reproducción

Partir de `docs/assets/cruz-del-sur-exterior/cruz-del-sur-exterior.blend` y ejecutar
una vez dentro de Blender, en este orden:

1. `scripts/assets/build-station-reference-interior-live.py`
2. `scripts/assets/refine-station-reference-interior-live.py`
3. `scripts/assets/finish-station-reference-interior-live.py`
4. `scripts/assets/validate-station-reference-interior-live.py`

Los pasos de modelado son incrementales. No repetirlos sobre el archivo final.
El constructor y la pasada final detectan si ya se ejecutaron.
Las cámaras están en `STATION / PREVIEW / Cameras and lighting` y los diagramas
de las pantallas están empacados en el archivo.

## Pasillo vidriado y vista de edición ligera

El pasillo cerrado de la primera composición queda archivado y oculto para
render. La versión actual usa tres copias del módulo editable
`panoramic-bay-v2.blend`, que corresponde al GLB del juego: 6.1 m de longitud,
piso de 3.4 m, perfil lateral ensanchado a 4.1 m y altura de 3.2 m. Se trasladó
la sala de acceso 0.9 m para mantener la conexión con esa longitud nativa.
Laterales bajos, medios, altos y dos paños del techo son de vidrio. El entorno
de Blender continúa neutro; el juego conserva su paisaje orbital existente.

Después de los pasos anteriores se ejecutaron:

1. `scripts/assets/fit-station-panoramic-passage-live.py`
2. `scripts/assets/refresh-station-edit-preview-live.py`
3. `scripts/assets/validate-station-reference-interior-live.py`
4. `scripts/assets/measure-station-viewport-live.py`

La colección `STATION / EDIT PREVIEW - hide to edit source pieces` contiene dos
mallas agrupadas para trabajar en modo Solid. No se renderizan ni deben exportarse.
Conservan la geometría base y omiten pequeños biseles y superficies transparentes
que Solid mostraría opacas. Las fuentes completas siguen separadas y editables,
ocultas solo en viewport, con sus modificadores y materiales intactos para render.
Ray tracing y 96 muestras de render se preservan.

Para editar una pieza en el Outliner, ocultar la colección `EDIT PREVIEW` y activar
la colección fuente correspondiente. Después de editar, ejecutar
`refresh-station-edit-preview-live.py` para actualizar la vista ligera; el script
solo reemplaza sus propias mallas generadas. No editar directamente esas dos
mallas de visualización.

Comparación anterior a la pasada ámbar, archivada en
`viewport-performance-before-amber.json`: mismo encuadre, viewport de 1574 × 860, con pruebas de
navegador detenidas: mediana de las medias de tres redibujados, en tres ensayos:

| Vista de Blender             | Tiempo de redibujado |
| ---------------------------- | -------------------: |
| Fuentes detalladas, Material |             214.8 ms |
| Fuentes detalladas, Solid    |              85.2 ms |
| Vista ligera agrupada, Solid |              46.8 ms |

Son tiempos síncronos de redibujado con costo de interfaz, no FPS sostenidos ni
una garantía de animación fluida. Las mediciones varían con otras aplicaciones,
cachés y actividad de la GPU. El informe conserva también las muestras iniciales
y las condiciones de medición.

## Pasada de iluminación ámbar

Las cinco referencias de detalle aportadas después orientan la versión actual:
metal oscuro con iluminación miel/dorada localizada, luminarias bajo mesadas
y estantes, bordes cálidos y pantallas cian. No se modificó el fondo orbital.

Reproducción sobre el estudio anterior: ejecutar una vez
`scripts/assets/warm-station-reference-lighting-live.py`, después refrescar la
vista ligera con `refresh-station-edit-preview-live.py` y ejecutar la validación.
Se conserva `before-amber-lighting.blend` como estado anterior.

- Se mantienen exactamente 16 luces. Se recolorean y redistribuyen las existentes;
  dos rellenos se convierten en luces largas bajo las mesas y otro ilumina el nicho.
- Se reduce el relleno azul, conservando un borde frío y las pantallas cian.
- 166 slots de luminarias reciben núcleos ámbar o difusores cálidos de techo.
- Los acabados cálidos se asignan mediante overrides por objeto; no se cambian
  los materiales originales de la cabina ni del exterior de la nave.
- Se agregan 58 piezas pequeñas: fondos facetados de nichos, labios de estante,
  tiras luminosas, tornillería y lomos de diarios de campo.
- El piso mantiene su textura y recibe una rugosidad de 0.235 para leer los reflejos.

Se revisaron los renders general y cercano. La nueva vista ligera conserva solo
dos mallas agrupadas; sus tres muestras de redibujado dieron 24.2, 25.2 y 27.8 ms.
No son FPS de animación ni una comparación controlada con la pasada anterior.
El modo Solid muestra colores de material aproximados, no la iluminación final:
para evaluar luces y reflejos usar los renders guardados.

La pasada inicial se verificó en Blender. Su integración posterior al juego se
documenta a continuación; la escena fuente y su vista ligera se conservan.

## Integración cálida en el juego

Se conserva la geometría del puente y de la sala de acceso, incluyendo todos
los nombres y extras de interacción. `apply-runtime-amber-materials.mjs` cambia
únicamente metadatos glTF de materiales: factores de color, emisión y acabados
de piso/mesadas. Los chunks binarios de geometría e imágenes conservan su SHA-256.
El informe `runtime-amber-patch.json` verifica esa conservación y registra que
`cruz-del-sur-panoramic-bay.glb` permanece sin modificar.

Antes del cambio, los GLB existentes se copiaron a `runtime-before-amber/`.
Esas copias incluyen los cambios previos sin confirmar, no solo la versión de Git.
El script es repetible y se detiene si detecta una modificación independiente
del asset posterior a su salida anterior.

`cruz-del-sur-amber-details.glb` contiene 42 piezas agrupadas en cinco mallas y
cinco materiales, 4456 triángulos y 245832 bytes. No contiene imágenes, luces,
cámaras, proxies de edición ni pantallas estáticas que tapen los monitores reales.
Se descartaron 16 piezas del nicho izquierdo que se cruzaban con el CV físico;
se conserva la luminaria lateral exterior. El nicho derecho incluye el conjunto
completo. La prueba de asset verifica con nueve rayos que el CV siga despejado,
y con otros dos que los difusores se vean delante de la fachada.

`BridgeInterior` carga el pequeño complemento junto al modelo existente y
mantiene el índice BVH para las miradas/interacciones. El presupuesto sigue
siendo nueve luces en React, sin sombras ni posprocesado nuevos. Se reutilizan
el spot auxiliar y el punto de relleno con colores cálidos; ambient, hemisferio
y direccionales se equilibran para conservar el contraste cian. No se cambian
colliders, movimiento, credenciales ni reglas de interacción.

Reproducción:

1. En Blender, ejecutar `scripts/assets/export-amber-game-details-live.py` sobre la fuente ámbar.
2. Ejecutar `node scripts/assets/apply-runtime-amber-materials.mjs` en el repositorio.
3. Ejecutar los checks y las pruebas nativas de Playwright.

Las capturas y muestras están en `game-before-amber/` y `game-amber/`. Son vistas
obtenidas caminando con controles reales, con posiciones que pueden variar unos
centímetros por el waypoint nativo; no se teletransportó la cámara.

| Vista, Intel UHD/ANGLE, 1280 × 720, DPR 1 | Antes mediana / p95 | Después mediana / p95 |
| ----------------------------------------- | ------------------: | --------------------: |
| Puente hacia consolas                     |      15.0 / 17.7 ms |        14.6 / 16.9 ms |
| Puente hacia entrada                      |      18.0 / 21.4 ms |        18.1 / 21.7 ms |

Cada muestra contiene 90 cuadros tras calentamiento. No acredita FPS sostenidos
ni una mejora por sí sola: cachés, encuadre y carga del sistema afectan el resultado.
Los draw calls observados pasaron de 127/171 a 131/174 según encuadre; los cinco
grupos nuevos y el culling explican el costo acotado. Las texturas observadas
bajaron de 25/27 a 23/25 al usar acabados constantes en piso y mesadas.
La descarga adicional es el complemento de 246 KB; los GLB grandes existentes
solo suman 400 y 184 bytes de metadatos. No se afirma haber reducido su descarga.

Playwright verificó la vista cálida, el nicho, el pasillo y sus paredes de vidrio,
liberación/reentrada real de Pointer Lock, café, foto y el monitor físico con
lectura de registros y descarga local de CV. No hubo errores de consola ni
excepciones de página en estos recorridos. El pasillo medido conservó 84 draw
calls, con mediana/p95 de 15.2/17.9 ms en la muestra posterior.

Comandos: `npm run check`, `npx tsc -p tsconfig.e2e.json --noEmit` y Playwright con
`playwright.passage-review.config.ts`, filtrando `records warm`, `real gameplay`,
`coffee and image` y `approaches the physical Archive`. No dependen de MCP.

## Revisión del juego con Playwright

### Consolas, sillas y plantas en runtime

`BridgeInterior` carga también `cruz-del-sur-furnishings.glb`: complemento de
966972 bytes, seis mallas/materiales y 17544 triángulos. Contiene controles
auxiliares, etiquetas de mantenimiento y remates de consola; costuras, ribetes
y placas en las cuatro sillas; dos macetas metálicas con 96 hojas plegadas.
No incorpora imágenes, luces, animación ni transparencia de follaje. La luz
cálida anterior y el pasillo de vidrio permanecen iguales.

El generador `scripts/assets/build-runtime-interior-details-live.py` usa los
anclajes de `docs/assets/bridge/layout.json` y aplica el desplazamiento real de
-3.15 m. Valida todos los vértices evaluados contra el contorno interior, con
12 cm de margen lateral; valida además los remates de cada silla dentro del
volumen de colisión existente. La fuente separada es `runtime-furnishings.blend`;
el script restaura la escena de Blender abierta y no modifica sus originales.
Los cambios se ven en el juego, no requieren abrir ese archivo fuente.

`furnishingsAsset.test.ts` verifica la geometría exportada contra el perfil
compartido de casco/techo y el pasillo central, junto con el presupuesto de
mallas, triángulos y ausencia de texturas/luces. La prueba visual de Playwright
camina hasta el puesto lateral y captura consola/planta y silla; el recorrido
del monitor físico conserva lectura, descarga y Pointer Lock reales. Una
ejecución visual falló al converger la entrada nativa del mouse mientras se
exportaba en Blender; se repitió sin esa carga concurrente, conservando el
helper y sus tolerancias originales.

La evidencia de esta pasada está en `game-furnishings/`. Las muestras cortas
son orientativas, no prueban FPS sostenidos ni una aceleración del juego.
En la exportación final, Intel UHD/ANGLE a 1280 × 720 y DPR 1: vista delantera
14.7 ms de mediana / 17.0 ms p95 (132 draw calls), vista trasera 16.5 / 18.3 ms
(183 draw calls), 90 cuadros por vista. El encuadre tras caminar difiere unos
centímetros del anterior: no se presenta como una comparación controlada.

Proyecto levantado en `http://127.0.0.1:4176/`. El conector MCP solicitaba Chromium
1252 ausente; se usó Playwright local con Chromium 1248 ya instalado, sin cambiar
dependencias. Los tests son independientes de MCP.

Se corrigió `ArchitecturePreview` para cargar el mismo asset V2 que
`PanoramicPassage`, mediante una URL compartida en `passageLayout.ts`. Antes el
visor cargaba V1. El asset del juego, sus colliders y controles no se sustituyeron.

Comando de revisión: `npx playwright test --config playwright.passage-review.config.ts
--grep 'detailed passage|real gameplay' --reporter=list`. Pasaron el visor aislado
y el recorrido con entrada real, identificación, paredes de vidrio, salida y
reentrada de Pointer Lock. Una primera ejecución del test nuevo falló al apuntar
a un waypoint cercano mientras la cápsula descendía de la pared inclinada; el
test ahora vuelve al centro con strafe real y espera a que se estabilice antes de
continuar. No se alteraron física ni tolerancias de cámara para ocultar el fallo.

En Intel UHD / ANGLE, 1280 × 720 y DPR 1, la última muestra de 90 cuadros dio
35.1 ms de mediana, p95 59.3 ms, 84 draw calls y 317378 triángulos. Una muestra
anterior dio 16.9/19.0 ms; otra con actividad simultánea de Blender dio 34.2/65.6 ms.
Esta variación impide afirmar 60 FPS estables. Son muestras de desarrollo en esta
máquina, no tiempos de descarga ni mediciones de memoria GPU.

La prueba de asset carga el GLB real y verifica con rayos que las vistas laterales
y del techo encuentran primero vidrio transparente de doble cara, sin un muro
opaco delante. Blender tiene cuatro rayos equivalentes y validación de mallas.

## Comprobaciones y límites

Inspección visual de las cinco vistas guardadas y validación dentro de Blender:
sin coordenadas no finitas, caras de área cero ni imágenes externas ausentes.
Un rayo real desde la cámara de observación alcanza la geometría de la nave.
El informe distingue esta comprobación de una conexión física o de gameplay.

Vidrios, pantallas, hojas y algunos revestimientos usan superficies simples a
propósito. El archivo mantiene piezas separadas para editar; no está preparado
como colisión. Solo los materiales y el complemento de detalles descritos arriba
se integran en WebGL. La integración conserva física, controles y misiones;
la estación exterior completa no se incorpora en esta tarea.

Las comprobaciones de aplicación se ejecutan con `npm run check` (typecheck,
lint, formato, pruebas y build), además de las E2E nativas de integración.
La advertencia existente del chunk
de más de 500 kB sigue siendo independiente de esta escena.
