# Arquitectura

## Coste GPU de superficies ocultas

El panorama Asterion se dibuja al final de los opacos, con profundidad en el
plano lejano y sin escribirla. Así no sombrea píxeles ya tapados por la nave o
los planetas; las transparencias siguen su pase normal. El mismo comportamiento
se usa en el inspector exterior, sin cambiar UVs ni textura.

La cabina estática opaca y los lotes estáticos medidos de la proa incorporan
un pase exacto sin color antes de los materiales PBR.
Comparte geometría, no participa en raycast y se monta/limpia en un efecto de
layout antes de los hooks de iluminación. No aplicar este pase indiscriminadamente:
agrega vértices y un draw, y sólo se admite geometría opaca sin deformación.

En desarrollo, `?gpuProfile` habilita consultas GPU pasivas y acotadas desde
`GameDiagnostics`; la API sólo devuelve copias de las mediciones. Está ausente
del build de producción. Para medir FPS normales se omite el parámetro, porque
las consultas alteran el pipeline. Método, resultados y límites en el
[audit GPU](audits/gpu-cost/README.md).
La ampliación del 25 de noviembre y su comparación sin instrumentación están en
[FPS general](audits/fps-general-nov25/README.md).
El [seguimiento de la entrada](audits/fps-light-rejection/README.md) amplía la
cobertura a los lotes estáticos `CABIN_MASTER_cabin_`, respetando las exclusiones
de transparencia, recortes alfa y deformaciones del instalador.
El [seguimiento de proa](audits/fps-followup/README.md) extiende la selección a
`REFINED_bridge_static_`; conserva los filtros del instalador y deja fuera las
consolas móviles. Incluye el experimento de luces descartado por no mejorar FPS.

## Cinemática de llegada y carga

La intro se reproduce con un video H.264 prerenderizado desde el maestro Blender,
fuera de React Three Fiber. El bootstrap no importa Three ni espera los GLB.
La variante actual muestra la entrada completa de PAMPA al acceso circular corto
y el cierre de sus dos hojas redondas; este espacio es cinematográfico, no una
zona jugable adicional. La punta estacionada se carga como un GLB independiente
detrás del visor de la esclusa, dentro del mismo límite de carga del interior.
No incorpora luces ni animación: [contrato PAMPA](assets/docking-intro/pampa-interior-runtime.md).
Después del primer cuadro presentado y de almacenar el video completo en buffer,
`App` importa `Game` para descargar y montar los recursos durante la reproducción.
El frameloop, la generación de reflejos PMREM y la compilación de shaders esperan
al fundido negro completo: preparar GPU simultáneamente causaba pérdida de cuadros.

El evento nativo `ended` inicia el fundido; los eventos de animación CSS controlan
la apertura central. No hay un segundo reloj RAF que pueda atrasar la película.
`InteriorReady` exige cuerpos/colliders, shaders compilados y un dibujo real.
Además del video opaco, el contenedor de `Game` conserva `visibility: hidden`
hasta la apertura: ningún render de preparación puede filtrar el interior.
Cuando está listo, se detiene su frameloop hasta la apertura para liberar GPU.

`Game` suspende controles/diálogos hasta finalizar y encola bienvenida una vez.
Movimiento reducido usa el poster estático; ocultar la pestaña pausa reproducción
y transiciones. Los errores de video permiten reintentar o continuar; los del
interior usan `StationBoundary`, recarga y portfolio accesible.
Contrato, recursos y límites en [docking intro](assets/docking-intro/README.md).

## Preparación de la carga inicial

El holograma táctico utiliza geometría preparada offline con
`node scripts/assets/prepare-tactical-display.ts`. El exportador reutiliza la
composición de cabina y conserva exactamente posiciones, índices y aristas;
regenerarlo cuando cambien sus fuentes. Las pruebas verifican sus hashes y la
igualdad binaria de la geometría. `GzipGLTFLoader` descarga el derivado comprimido
sin pérdidas y conserva el GLB original como alternativa para navegadores sin
descompresión nativa. La caché del loader posee las geometrías compartidas.

`ZeroContributionLights` se instala dentro del Suspense del mundo, en el efecto
de layout anterior al primer frame y a `Ready`. Así los materiales reciben la
optimización existente antes de compilarse, manteniendo el mismo resultado
visual. No se reducen texturas, fotos, geometría ni luces de los estantes.
Mediciones y límites: [carga inicial](audits/startup-loading/README.md).

## Estantes de transición — integración Blender

`TransitionShelves` reemplaza los antiguos nichos del pasillo con el maestro
personalizado, incluyendo las cuatro fotografías. El puente y la envolvente
caminable usan derivados preparados offline; el navegador no recorta triángulos.
`transitionLayout.ts` comparte los límites con el exportador. Los colliders se
mantienen separados y las nuevas columnas reciben colisiones sencillas.
Materiales PBR conservan mapas y UV; una luz cálida sin sombras y los reflejos
compartidos de la cabina iluminan los objetos. Contrato y reproducción en
[integración de estantes](assets/transition-master/integration.md).

## Resaltado de estaciones

`StationHighlights` comparte las posiciones y dimensiones de `TERMINAL_SCREENS`.
La mesa usa `TACTICAL_TABLE_SURFACE`, compartida con su superficie física:
su borde es horizontal y no sigue la interfaz táctica vertical flotante.
El siguiente objetivo del protocolo activa un contorno cian con pulso suave de
dos segundos; el destino apuntado usa un contorno fijo. Se oculta fuera del modo
de caminar activo y con la tablet levantada. Movimiento reducido elimina el pulso.
El borde mide 3 cm, con halo de 7,5 cm, y crece hacia afuera para no tapar el
contenido de la pantalla. La geometría decorativa no participa del raycast, conserva la oclusión por paredes
y no incorpora luces, sombras ni posprocesado. `stationHighlight.ts` concentra la
correspondencia entre objetivos y estaciones, comprobada con el reducer real.

## Integración del maestro de cabina — 2026-11-18

La escena caminable utiliza `cabin-master-static.glb` en coordenadas mundiales
y `cabin-master-sliding-leaves.glb` con los pivotes locales de las hojas. El
exportador `scripts/assets/export-cabin-master.py` lee el maestro sin guardarlo,
excluye archivos, cámaras, luces y pantallas de previsualización, agrupa por
material y convierte acabados procedurales a mapas PBR reutilizables.

`ArrivalCabinModel` conserva los mapas exportados y gestiona copias de materiales
para reflejos locales y alimentación. `EntryAirlock` conserva la física separada:
el antiguo sofá y la mesita dejan de bloquear el recorrido, mientras repisa,
vitrina y pared técnica usan colisiones simples. La envolvente física recta se
mantiene. Docking continúa fijo; la esclusa se ve a través del visor, sin abrir
una nueva ruta jugable.

El casco visual y los detalles compartidos filtran únicamente los lotes antiguos
de llegada. La puerta móvil conserva su estado, recorrido y cuerpos cinemáticos;
el terminal de acreditación y su gesto permanecen en código. Los visores de
navegación y táctico componen también los nuevos recursos. La iluminación del
renderer se adapta con luces prácticas; no importa las 28 luces del estudio.

Los materiales conservan sus mapas PBR en `MeshStandardMaterial`; los sólidos
descartan caras posteriores y vidrio y vegetación mantienen ambas caras.
La esclusa utiliza una luz práctica. Las cargas individuales de GLB comparten
la caché entre casco, cabina y visores para evitar descargas duplicadas.

Contrato y exportación: [maestro](assets/cabin-master/README.md).
Evidencia de integración: [auditoría](audits/cabin-master-integration/README.md).

La pared técnica cierra también sus dos extremos: `cabinMasterLayout.ts` comparte
el frente y los límites de la envolvente entre la colisión continua y los dos
remates visuales de `EntryAirlock`. Así no queda un pasillo accesible detrás de
los armarios. Estos remates son piezas del runtime, separadas del maestro.

`fit-vestibule-envelope.mjs` deriva `cruz-del-sur-vestibule-envelope.glb` del
casco recto original. Recorta únicamente la geometría del casco que invadía la
esclusa; conserva la fuente y los materiales. `UNIFIED_ENVELOPE_ASSET` comparte
este derivado con los visores. La prueba `vestibuleEnvelopeAsset.test.ts`
comprueba el suelo despejado y puntos de control exteriores sin cambios.

## Maestro artístico de la cabina

`docs/assets/cabin-master/cabin-master.blend` reúne la cabina de llegada, entre
la puerta de docking fija y la puerta móvil de acceso. Conserva módulos separados
y las coordenadas del runtime, incorpora la pared técnica refinada y permite
revisar la iluminación y los materiales en conjunto. Las fuentes originales se
conservan. Inventario y contrato de las puertas: [maestro](assets/cabin-master/README.md).

El maestro sigue siendo el documento de autoría. Su exportación para el juego
se describe arriba; el archivo `.blend` no se carga directamente en el navegador.
La acreditación, las hojas móviles, las colisiones y las interfaces dinámicas
permanecen en código. Las futuras revisiones requieren volver a exportar y validar
los recursos, en lugar de superponer una segunda cabina.

## Estudio de arte de la pared técnica

`docs/assets/service-wall-studio/service-wall-design.blend` es el documento
editable independiente para refinar el diseño contra la referencia del usuario.
Su iluminación de estudio y sus materiales de autoría se revisan mediante renders
en Blender. El archivo no sustituye automáticamente los GLB del juego.

El script de creación sólo prepara la base y rechaza sobrescribirla; las futuras
exportaciones deben partir del diseño revisado, sin regenerar encima con la
receta anterior. La integración requiere preparar materiales compatibles con
glTF y comprobar coste, iluminación y colisiones en el navegador.

## Pared técnica de llegada — 2026-11-17

`detail-service-wall.py` reemplaza los armarios y filtros antiguos del lado de
estribor por una banda de almacenamiento, estantes, mantenimiento, tuberías,
soporte vital y botiquín. Reutiliza los helpers y materiales del decorado de
referencia. El exportador comprueba que las piezas permanezcan dentro del banco
técnico definido en `arrivalCabinLayout.json`; las colisiones y los accesos no
cambian. Las pantallas nuevas son señalética estática, sin nuevas estaciones.

Una luz puntual cálida ilumina el banco técnico. Los difusores y pantallas se
exportan como materiales emisivos, sin luces importadas ni actualizaciones por
cuadro. Evidencia y mediciones: [pared técnica](audits/service-wall/README.md).

## Materiales y nicho EVA — 2026-11-17

La llegada y sus lotes estructurales comparten un único reflejo local mediante
`ArrivalSurfaceEnvironment`. El mapa se genera al montar y se libera al desmontar;
no hay capturas por cuadro ni cambio del entorno global. `arrivalShellMaterials`
aplica el acabado solo a los lotes de llegada, con materiales y geometrías propios,
y un mapa pequeño de rugosidad/relieve. El puente conserva sus materiales.

El sillón usa tapizado grafito con ribetes cálidos y frentes metálicos. El nicho EVA
incorpora marco achaflanado, laterales retraídos y zócalo continuo hasta el piso.
`EVA_ALCOVE` define geometría y collider; el test sobre el GLB verifica apoyo de las
botas y separación de casco, manos y escotilla. Las luces prácticas de llegada
se redistribuyen sin añadir luces ni sombras dinámicas.

Evidencia y límites: [materiales de cabina](audits/cabin-materials/README.md).

## Perfil recto de la cabina — 2026-11-17

`arrivalShellLayout.json` define una sección constante: paredes a X ±4,95 m,
hombros desde Y 2,50 m hasta X ±3,35 / Y 3,30 m y techo plano. Los nuevos
`straight-envelope` y `straight-collision` se exportan desde la misma geometría,
incluido el vidrio lateral continuo y los encuentros con los marcos de puerta.
Se conserva la fuente Blender anterior y una copia editable de la estructura en
`docs/assets/straight-cabin/straight-pressure-shell.blend`.

El exportador de llegada retira los marcos curvos ARR10 que duplicaban la
envolvente. El cierre detrás del sillón pasa a una pieza recta; su collider usa
el límite de pared del mismo JSON. Se elimina el antiguo parche triangular
`arrivalShoulderClosure`, ya integrado en el cierre completo. La geometría nueva
también llega a los visores exterior y táctico mediante el asset compartido.

La regresión comprueba el GLB físico con rayos a varias alturas, juntas y esquinas,
y el navegador con movimiento y saltos reales hacia la mesita y el ventanal.
Ver [evidencia del perfil recto](audits/straight-cabin/README.md).

## Referencia visual de la llegada — 2026-11-17

La llegada pasa a `cruz-del-sur-reference-arrival.glb`, conservando las variantes
anteriores. El exportador añade panelado de techo, luminarias con difusores ámbar,
costuras, manta estática, almohadón, plantas de hojas sólidas, cafetera, estante
y mesa lateral. Esta última comparte medidas con su collider en
`arrivalCabinLayout.json`. La fuente unificada no se guarda; los objetos editables
se conservan aparte en `docs/assets/cabin-reference/cabin-reference-dressing.blend`.
El traje completo reutiliza las piernas y botas de la fuente NASA original y
extiende su nicho/collider hasta el piso, sin invadir la escotilla.

`EntryAirlock` mantiene dos luces sin sombras y aplica reflejos locales filtrados
por rugosidad, generados una vez mediante PMREM de 128 px por cara. Los materiales
se clonan; los recursos GLTF permanecen compartidos. `arrivalFloorTextures` crea
dos mapas de 256 px para color/desgaste y rugosidad. El canal R del segundo guarda
una oclusión de contacto estática derivada de los colliders; no añade otra textura.
Las copias locales de geometría del piso aportan UV1 en coordenadas de habitación,
preservando UV0 y las normales originales. Mapas y copias se liberan al desmontar.
Los materiales de tela,
vegetación y techo no reciben el mapa de reflejos. La panorámica galáctica
existente se orienta hacia las ventanas del salón, sin una descarga nueva.

Comparación visual, receta y medidas: [cabin-reference](audits/cabin-reference/README.md).

## Cabina e inspección exterior — 2026-11-17

La llegada usa `cruz-del-sur-cabin-arrival.glb` y los detalles
`cruz-del-sur-cabin-details.glb`. El banco pasa a tres plazas rectas con respaldo,
apoyabrazos y un cierre trasero ajustado al casco; el banco técnico incorpora
zócalo y retornos laterales. `arrivalCabinLayout.json` comparte medidas entre el
exportador Blender y los volúmenes físicos, cerrando los accesos detrás de ambos
muebles. Se retiran las cajas de transporte sueltas y se detalla la escotilla de
servicio junto al botiquín. Las fuentes Blender y los GLB anteriores se conservan.

La pantalla panorámica central ofrece `navigation`, un modo de inspección
exterior con órbita alrededor del origen, zoom acotado y sin desplazamiento del
centro. Usa los estados de estación y la salida existentes. El visor monta un
Canvas bajo demanda solo mientras está abierto; reutiliza los assets descargados,
pero su contexto WebGL necesita sus propias cargas GPU. Los botones, teclado y
arrastre controlan el mismo OrbitControls. No mueve el casco real ni al jugador.

`physicalPress` comparte el contacto a los 0,5 segundos. La radio ejecuta la acción
y pulsa la tecla al llegar el guante, no al iniciar el gesto. La acreditación
añade la fase `presenting`: empieza carga/sonido al contacto y conserva su duración
total de un segundo. La pose del traje colgado se hornea en Blender, sin rig ni
cálculos nuevos por cuadro.

Receta, costes y validación: [cabin-revision](audits/cabin-revision/README.md).

## Estado actual tras revisión — 2026-11-16

Las secciones fechadas inferiores conservan la evolución del proyecto; no todas
describen componentes activos. El espejo fue retirado por decisión del usuario.
La identificación actual usa CrewAccess y su gesto local; EntryMenu,
CrewIdentification, AuxiliarySwitch, CrewHologram, AstronautArm y HologramPanel
fueron retirados por no tener consumidores. Los acabados actuales llegan en
los GLB refinados: prepareInteriorFinishes y sus mapas procedurales permanecen
como utilidades históricas comprobadas, sin montarse en el runtime.

Los diálogos comparten trapDialogFocus; la preferencia de animación se consulta
con useReducedMotionRef sin renders por cuadro. prepareShipModel define la
propiedad de materiales clonados para llegada/envolvente, sin disponer los
recursos de caché. Los targets de interacción y su guardia se derivan de
STATION_TARGETS. crewDossier centraliza el documento profesional; ProjectId
y el atlas de imágenes exigen cobertura no vacía al compilar.

Informe de revisión y límites: [code-review-2026-11-16.md](code-review-2026-11-16.md).

## Arte refinado integrado — 2026-11-15

`BridgeInterior` y `EntryAirlock` cargan las copias refinadas del puente y la
llegada; `RefinedInteriorDetails` monta decoración estática agrupada por sala y
material. Se conservan anclajes, interacciones, colliders, hojas de puerta,
pasillo de vidrio y cierre del hombro derecho. El exportador evalúa copias de
`cruz-del-sur-interior-panels.blend`, sin guardar ni alterar esa fuente.

Las cuatro pantallas comparten un atlas y seleccionan panel por UV. Las funciones
y superficies DOM existentes siguen en sus posiciones. La mesa táctica conserva
su proyector vivo sobre una carta instrumental estática; no se importa el globo
de previsualización de Blender. La geometría propia de pantalla se libera al
desmontar y los GLTF/texturas de caché siguen compartidos.

El exterior usa un cielo con galaxias y cuerpos lejanos y una vista orbital
texturada de dos triángulos, con bordes suaves. Mantiene deriva, movimiento
reducido, asteroides y lancha; no añade luces ni postprocesado. Se conserva la
iluminación cálida del juego, sin importar luces de estudio.

Presupuesto, correcciones de UV/color al exportar, capturas, mediciones y límites:
[`audits/refined-runtime/REVIEW.md`](audits/refined-runtime/REVIEW.md).

## Acabados del interior — 2026-11-14

`BridgeInterior` aplica acabados locales mediante `prepareInteriorFinishes`:
cuero satinado, herrajes neutros, nervaduras y variación de verde en las hojas,
y ajuste leve de las texturas de desgaste existentes. Se clonan únicamente los
materiales modificados y las dos geometrías de follaje que necesitan UVs;
posiciones, índices, anclajes y colliders se conservan. Las normales del follaje
se suavizan en esas copias para quitar el aspecto de papel facetado.

Dos mapas opacos compartidos de 256 px se generan una vez al cargar, con mipmaps;
no hay nuevos objetos visibles, luces, transparencias ni trabajo por cuadro.
Las placas y etiquetas reutilizan sus canvas y dimensiones anteriores. Los
recursos propios se liberan al desmontar sin disponer los GLTF compartidos.
Evidencia y coste: `audits/interior-finishes/REVIEW.md`.

## Render interior y pasada de FPS — 2026-11-14

El renderer ordena las superficies opacas por profundidad manteniendo las
prioridades explícitas; el vidrio conserva el orden transparente de Three.
Los exportadores recalculan normales y activan backface culling únicamente en
copias evaluadas de sólidos cerrados. Paneles abiertos, cristal, iluminación,
geometría de colisión y fuente Blender se conservan.

`batchBulkhead` agrupa materiales dentro de cada hoja y de cada zona del marco;
no une hojas ni cambia anclajes o colliders. Sus geometrías propias se liberan
al desmontar; los recursos de `useGLTF` siguen compartidos. Las consolas añaden
gráficos en sus dos texturas existentes, sin animación ni luces nuevas.
Mediciones, limitaciones y reproducción: `audits/fps-unified/REVIEW.md`.

## Runtime de la nave unificada — 2026-11-14

`PlayerShipHull` carga la envolvente unificada y un GLB estructural separado de
1698 triángulos para Rapier. `EntryAirlock` monta mobiliario/piso de llegada sin
la caja anterior, conserva piso y muebles físicos y usa la estructura nueva
para paredes/techo. La malla invisible de colisión no se renderiza. La envolvente
y la llegada usan BVH para la oclusión real de interacciones.

Se conservan puerta automática, docking, credenciales y pasillo de vidrio con
sus mecanismos/colliders. La exportación excluye placeholders de escotilla y
vidrios de presentación duplicados. El vidrio nuevo es unlit, sin refracción;
se mantienen luces y sombras del runtime. Detalles, pruebas y mediciones en
`assets/unified-ship/RUNTIME.md`.

## Fuente Blender unificada — 2026-11-14

El nuevo diseño de envolvente se trabaja en
`assets/unified-ship/cruz-del-sur-unified.blend`, conservando las fuentes anteriores.
Los hombros y largueros conectan casco/cubierta; la llegada reemplaza la caja
rectangular por un volumen de presión facetado, costillas oblicuas y extremos
biselados. El conector panorámico y los anclajes del recorrido son referencias.
La pasada inicial no cambió el runtime; la integración posterior está descrita
arriba. Organización,
renders y límites de comprobación: `assets/unified-ship/README.md`.

## Corrección visual y nave de referencia — 2026-11-14

Corrección de interpretación posterior: el jugador está dentro de la nave,
en su módulo superior. `PlayerShipHull` se monta en `Greybox` con coordenadas
de mundo ya ajustadas; no forma parte de `SpaceExterior` ni de la órbita.
La copia distante se retiró. Se conservan llegada, punto de inicio, puerta,
controles y colisiones. La arquitectura jugable constituye la piel de la cubierta
superior y el casco Blender adaptado se une por debajo.

`scripts/assets/fit-player-ship.mjs` conserva la exportación original, ajusta una
copia y recorta triángulos contra los volúmenes de despeje. No descarta caras
completas por su bounding box. Agrega una base a Y=-0.251, separada del piso
visible, y conserva el casco inferior/proa/motores. La torre cerrada de exhibición
se sustituye por la arquitectura real del juego para evitar vidrios opacos,
techos duplicados y piezas atravesando las salas. El exterior necesita este
ajuste porque el recorrido es más largo que la torre del modelo de referencia.

`playerShipHullAsset.test.ts` comprueba casco por debajo de puente/pasillo/llegada,
despeje de vistas laterales/superiores y presupuesto del GLB adaptado. El color
ámbar se conserva: cambiar RGB no reduce el coste de las luces; importan su
número, sombras, alcance y el coste de materiales/reflejos.

Se retira el panel de CV de la pared trasera para dedicar ambos nichos a
decoración. CV y su objetivo siguen disponibles en Central Archive y Personal
Workstation; la alternativa DOM se conserva. `BridgeInterior` cierra los reversos
de los nichos vistos desde el pasillo de vidrio. Se retiran una planta antigua
fuera del volumen útil y tres paneles de casillero desprendidos de la llegada,
sin mover colliders ni anclajes de estaciones.

La colocación anterior de `ReferenceShip` fuera de una estación fue una
interpretación incorrecta y está sustituida por `PlayerShipHull`. Exportación, backups,
presupuesto y evidencia visual: `assets/station-reference-interior/README.md`.

## Arrival footprint V10 — 2026-11-11

The arrival room now expands 1.5× in plan (8.4 × 6.195 m before the port bow),
while preserving ceiling height and human-scale furniture/controls. Its front
anchor stays at Z=12.07; docking hatch moves to Z=18.265 and spawn to
`[0,1,17.065]`. `arrivalRoomLayout.ts` is the runtime source for the scaled shell,
adapted portal closures and relocated furniture colliders. Crew Access, the
sliding bulkhead, passage and bridge retain their positions and state machines.
The tablet map uses these dimensions. This supersedes the earlier Z=16.2 docking
and Z=15 spawn measurements below. Asset/source workflow is documented in
`assets/arrival-room/README.md` (V10).

## Interior spawn revision — 2026-11-11

Start inside the arrival room at body position `[0,1,15]`, looking straight
toward the secured bridge bulkhead (camera yaw/pitch zero, forward -Z).
The procedural rear docking annex is no longer rendered or collidable. The
existing docking hatch stays closed at Z=16.2 and has no interaction target;
its later visual redesign will follow the owner's docking-access reference.
Crew Access and the automatic credential-controlled bridge door are unchanged.
This supersedes the open rear hatch and spawn Z=17.1 described below.

## Approved arrival revision — 2026-11-10

The latest owner brief removes the dedicated light room and mandatory switch. Sequence: PAMPA-07 docking collar through an already open hatch → single receiving room → credential-secured sliding bulkhead with adjacent Crew Access → short framed panoramic passage → main bridge reveal. Power is online from session start; the existing lighting objective records automatic arrival systems readiness, not an interaction. Crew verification alone authorizes automatic opening. Quick Portfolio Access remains available before identification. Reload resets credentials and bulkhead, never arrival power. This supersedes the historical power-gated descriptions below.

Receiving room: approximately 5.4 × 4.03 m usable behind the door pockets, 3.0 m central ceiling with chamfered shoulders; rear hatch Z=16.2, spawn Z=17.1, Crew screen unchanged at [2,1.68,12.515]. Secured bulkhead Z=11.65, panoramic passage Z=11.2…5.1, length6.1 m (~2.03 s at3 m/s). Original two-leaf GLB, sweep pockets and kinematic collider synchronization retained. Passage adds angled ribs, gaskets, segmented floor and exterior hull stringers. Compact bridge and console layout remain unchanged. Visual review is manual.

## Arquitectura espacial v2

La sala de llegada usa el GLB V4 en `[0,0,12.07]`, sin el terminal de referencia
de Blender. `arrivalRoomLayout.ts` define la envolvente ensanchada, la bóveda y
colisiones simples del mobiliario. `EntryAirlock` conserva los bolsillos del
mamparo y el túnel de docking; dos luces cálidas sin sombras iluminan la sala.
Crew Access y el estado/cuerpos cinemáticos de la puerta permanecen independientes.
Fuente editable, exportación por materiales y límites: `assets/arrival-room/README.md`.

El pasaje utiliza ahora tres módulos GLB V2 a escala real, con piso de 3.4 m y perfil lateral ensanchado a 4.1 m entre ejes de marcos. `passageLayout.ts` define colisiones facetadas y adaptadores a las aberturas existentes de 2.68 m. Se conserva la longitud de 6.1 m, el mamparo y el puente. Fuente Blender, medidas y exportación: `assets/panoramic-bay/V2.md`.

Revisión compacta aprobada: piso principal 9.6 × 10.5 m (antes 13.5 m); proa, consola y puestos adelantados 3 m hacia la mesa, manteniendo la zona trasera. Ver `audits/EXPLORATION_BRIDGE_COMPACT.md`. Etapa 1 de exploración implementada: cinco facetas delanteras y cubierta exterior visible. La etapa 2 ya cierra la cubierta con techo de 3.30 a 2.75 m, vidrio superior y colisiones compartidas con el perfil de las ventanas. La etapa 3 lleva la consola a la proa con Archive y Communications a ±45°, y cierra las paredes traseras sobre el ancho del piso. Detalles y límites: `audits/EXPLORATION_BRIDGE_STAGE1.md` y `audits/EXPLORATION_BRIDGE_STAGE2.md` y `audits/EXPLORATION_BRIDGE_STAGE3.md`.

El contorno y las pendientes compartidas están en `src/game/world/bridgeLayout.ts`. `BridgeFloor`, `BridgeRoof` y `ShipHull` usan ese contorno facetado; `Workstation` sigue la consola abierta en tres tramos. `commandLayout.ts` deriva los ingletes, colliders y anclajes de monitores/sillas desde la polilínea compartida. `TERMINAL_SCREENS` alimenta tanto los marcos como Html y el foco dinámico. `PanoramicPassage` conecta Z=5.1 con la entrada trasladada seis metros; `DockingHatch` es la compuerta inicial independiente. Energía e identificación solicitan la apertura automática del mamparo existente, sin duplicar el estado del protocolo. `DeckMap` representa este recorrido.

La etapa 4 amplía el módulo técnico a 5.4 m libres y coloca Crew Access junto al mamparo, de frente. `entryLayout.ts` comparte dimensiones de envolvente y anclajes; se conservan escotilla, spawn, mecanismo de puerta y reglas de energía/identificación. El soporte del lector exige una corrección de montaje de +0.33 m en Z y +0.05 m en X respecto del borrador. Ver `audits/EXPLORATION_BRIDGE_STAGE4.md`.

La etapa 5 agrupa los 45 marcos del techo y cuatro tiras existentes en dos lotes de instancias estáticas, sin cambiar colisiones. Añade una placa física discreta sobre el acceso. La medición automatizada con SwiftShader registra 160→124 llamadas y 337→291 geometrías en vistas próximas; no equivale a una mejora de FPS verificada en la GPU del visitante. Metodología, costes y límites: `audits/EXPLORATION_BRIDGE_STAGE5.md`.

Los GLB modulares nuevos no sustituyen esa escena: `/?architecture-preview` carga un visor solo en desarrollo. Medidas y limitaciones del kit: `docs/assets/modular-architecture/INSPECTION.md`.

## Revisión vigente de responsabilidades

La revisión actual se registra en `core-interaction-progress.md` y sustituye las descripciones históricas inferiores conforme se valida cada fase. El usuario se ocupa del estilo de las interfaces; este trabajo se limita a arquitectura y comportamiento. `Game` compone `GameWorld` y `GameHud`; `useStationControls` concentra modos, T/R/E/Escape y ciclo de Pointer Lock. El reducer del protocolo conserva las reglas de objetivos. El modo antiguo `hologram` ya no participa en los controles. El puente de fase4 anterior está implementado; su plano ya fue aprobado. No se deben interpretar los párrafos históricos como nuevas instrucciones de producto.

La sesión de gameplay ahora se reinicia al cargar: protocolo, café, puerta y verificación no se persisten. `SlidingBulkhead` comparte cuerpos cinemáticos entre hojas y colisiones. `dialogue`/`useDialogue` separan texto, cola por eventos y temporización. Quick Portfolio Access y la alternativa HTML se encuentran en la tablet; el fallback sin WebGL/error permanece independiente en `App`. Detalles y verificaciones en `core-interaction-progress.md`.

## Registro histórico — versiones previas de noviembre de 2026

El prototipo de monitor físico del Archive se describe en `physical-monitor-prototype.md`. `ArchiveScreen` monta el mismo `Computer`/`PortfolioContent` mediante Drei Html transform sobre la pantalla existente, sin overlay opaco a pantalla completa. Un invalidate al montar el DOM asegura su primera transformación en renderizado bajo demanda. Quick Portfolio Access dentro del juego enfoca ese mismo monitor; Accessible HTML portfolio conserva la ruta DOM y el fallback sin WebGL. El plano futuro en `bridge-layout-proposal.md` sigue pendiente de aprobación; Communications, Personal, identificación y mesa aún conservan sus implementaciones anteriores.

El nuevo orden de fases y la auditoría están en `functional-progress.md`. La autorización más reciente levanta el aplazamiento histórico del backend: `api/contact.ts` implementa una Vercel Function con Resend y límites compartidos en Redis; configuración en `contact.md`. Las referencias posteriores a contacto pendiente describen fases anteriores. El formulario DOM se comparte con Earth Communications, una terminal separada en la pared de babor. El evento explícito `transmission` completa uplink por aceptación confirmada o Skip sin envío; el clic mailto continúa sin completarlo.

Los modos actuales son walking, computer, hologram, communications, personal y photo. `stationView` centraliza las poses de cámara sin crear objetos por cuadro. Café y mamparo son acciones del raycaster y no abren modos adicionales. `TerminalPanel` comparte el límite de foco DOM; las ventanas del escritorio consumen Escape antes de que llegue a la pausa del juego. El estado de café es independiente del protocolo, con un único descubrimiento local persistido. `EntryAirlock` extiende la sala hacia atrás; abrir desmonta hoja y collider juntos y nunca vuelve a cerrar sobre el jugador. La persistencia de energía deja el paso abierto al recargar.

## Base existente

Aplicación de navegador con Vite, React, TypeScript, Three.js, React Three Fiber, Drei y Rapier. npm gestiona dependencias y scripts. No se necesita un framework de servidor ni un motor adicional.

- `src/main.tsx` monta React.
- `src/App.tsx` compone estación 3D automática y portfolio DOM secundario; conserva la escena pausada al abrir el acceso rápido.
- `src/game/Game.tsx` coordina Canvas, luces, carga de física, estado de entrada y controles de cámara.
- `src/game/world/Greybox.tsx` construye la sala vidriada, mesa y puerta cerrada con colisiones explícitas. `Workstation` contiene escritorio, monitor y silla; `SpaceExterior` contiene estrellas y planeta procedural.
- `src/game/player/Player.tsx` conecta entrada, velocidad del cuerpo físico y posición de cámara. La cápsula invisible representa el volumen del jugador.
- `src/index.css` define presentación DOM y superposiciones.

Mantener esta estructura pequeña. Extraer funciones de movimiento y componentes DOM cuando permitan pruebas claras; no añadir servicios, eventos globales o un gestor de estado sin necesidad.

## Decisiones técnicas

Fiber traduce JSX de la escena a objetos Three.js; los menús siguen siendo DOM. La cámara representa la mirada y sigue al cuerpo físico. Rapier calcula las colisiones contra cuerpos fijos.

La velocidad horizontal depende de la mirada proyectada al piso. Normalizar el vector de entrada evita acelerar en diagonal. `setLinvel` recibe unidades por segundo; Rapier integra el desplazamiento con su paso de física. Multiplicar esa velocidad por delta sería aplicar el tiempo dos veces. Los desplazamientos manuales sí necesitan delta.

Guardar teclas y valores por cuadro en refs. Reservar estado React para cambios de interfaz o modo. Liberar Pointer Lock y limpiar entrada al perder foco; Escape debe permitir volver al menú.

La física usa un paso fijo. `useBeforePhysicsStep` establece velocidad; Rapier con prioridad -1 actualiza e interpola su Object3D; luego la cámara sigue un anclaje hijo en `useFrame`. Esto evita seguir posiciones discretas de `translation()` y no agrega suavizado a la rotación. MouseLook usa PointerLockControls de Three y solicita unadjustedMovement para evitar aceleración del sistema, con reintento convencional ante NotSupportedError. El usuario confirmó la resolución de los tirones en Opera. Tamaño del bundle y fluidez gráfica son métricas diferentes. `App` carga el módulo 3D con `React.lazy` automáticamente al entrar a la aplicación y muestra un indicador circular durante la carga. Quick Portfolio Access no importa el juego ni crea WebGL/Pointer Lock/audio. La comprobación de WebGL2 ocurre al iniciar; un fallback DOM y StationBoundary mantienen accesible el portfolio ante fallos.

`movement.ts` contiene el cálculo de velocidad sin dependencia de React ni física; `EntryMenu.tsx` contiene la presentación DOM. `GameDiagnostics.tsx` se importa únicamente en desarrollo y devuelve observaciones copiadas, nunca setters. La alternativa accesible es Quick Portfolio Access, independiente del mundo 3D y de las misiones.

## Estrategia de pruebas

- **Vitest:** reglas puras existentes, dirección, teclas opuestas, diagonal y movimiento desactivado.
- **React Testing Library:** estados de carga, entrada y error del menú DOM. No comprobar semántica de la escena WebGL mediante selectores DOM.
- **Playwright con Chromium:** carga, menú, canvas, consola y excepciones; activación y liberación real de Pointer Lock, movimiento y colisiones cuando el navegador lo permita.
- **Observación del juego:** cuando sea necesaria, interfaz tipada y de solo lectura disponible en desarrollo/test, sin exposición en producción. No permitir teletransportes o cambios de estado para simular éxito.
- **Pendientes de producto:** formulario/contacto real y las siguientes fases del GDD. Interacción E, terminal, CV, tablet y protocolo básico ya tienen cobertura; no presentar escenarios futuros como aprobados.

Playwright Test proporciona regresiones repetibles. Playwright MCP permite inspección interactiva por el agente. Configurar un servidor no equivale a haber verificado su conexión. Los tests no dependen del MCP. Si Pointer Lock o WebGL quedan limitados por el navegador, informar el bloqueo y la comprobación manual necesaria.

## Verificación y documentación

Consultar scripts y comandos de desarrollo en `package.json` y `README.md`. Las puertas de calidad son typecheck, lint, formato, pruebas pertinentes, build y verificación del navegador para cambios que lo requieran. Este documento describe la estrategia, no certifica resultados de ejecución.

Las instrucciones permanentes y responsabilidades de roles están en `AGENTS.md`; la dirección del producto y los hitos están en `docs/vision.md`. Registrar resultados y limitaciones de cada entrega sin confundir inspección de código o capturas con pruebas funcionales.

## Observatorio e interacción

Los modos son walking, computer y hologram. E selecciona la superficie más cercana bajo el centro de la cámara, hasta 2,8 m; las superficies intermedias bloquean la interacción. Player es el único dueño de la posición de cámara y anima la transición durante 0,65 s; MouseLook solo controla la orientación cuando no hay transición ni pantalla abierta. La cápsula queda en el punto de aproximación mientras se usa el puesto, y volver a caminar recupera ese punto y orientación. La física se pausa fuera del modo caminar.

La computadora libera Pointer Lock y muestra aplicaciones DOM alimentadas por `src/data/portfolio.ts`. El botón de salida vuelve a caminar y solicita Pointer Lock mediante el mismo clic; Escape deja el cursor libre y muestra solo una indicación discreta para retomar. Estrellas y planeta rotan con delta, sin renders React por cuadro. Las transiciones y el ambiente respetan prefers-reduced-motion. La puerta trasera está cerrada, sin interacción de apertura.

## Forma del casco

`ShipHull.tsx` reemplaza el cerramiento cuadriculado: un ventanal frontal continuo, dos ventanas por lado, dos lucernarios y mamparo trasero opaco. Las esquinas achaflanadas y los hombros inclinados tienen colliders propios; se conserva el recorrido del puesto de trabajo. Las alas son geometría exterior visible desde los laterales, sin áreas caminables nuevas. Las estrellas usan una distribución pseudoaleatoria reproducible, radios entre 55 y 103 metros y tres grupos de brillo/tamaño. La deriva exterior mantiene la sensación de movimiento sin balancear la cámara FPS.

## Perfil y presentación del usuario

Contenido basado en Resume.pdf, Tesis.pdf y la memoria DOCX facilitados por Joaquín. Se distinguen trabajos académicos de experiencia laboral. RouteWise conserva la limitación de precios/horarios simulados y validación manual; AccesiWeb no se presenta como certificación automática de cumplimiento. La fecha de Advanced React se omite por inconsistencia entre CV y enlace. El CV descargable es una copia sin cambios del original; los textos extraídos y documentos académicos no se publican como archivos completos.

El brazo original de astronauta sigue la cámara después de Player (prioridad -0.5); no participa en raycasts ni colisiones. El techo tiene bóveda elíptica y lucernarios curvos.

## Recovery mission prototype

El GDD `gdd/CRUZ_DEL_SUR_GDD_v1.0.md` define la experiencia actual de CRUZ DEL SUR. La fase 1 implementa luces, guía opcional y tablet; no equivale a completar toda la v1.0.

`protocol.ts` contiene un reducer puro: `activity`, `continue`, `skip` y `replay`. El estado v1 guarda objetivos completados y guía pending/active/skipped bajo `cruz-del-sur.protocol`. `useProtocol` conecta React y localStorage; datos corruptos/versiones desconocidas se restablecen, y almacenamiento bloqueado no impide jugar. Esta es la primera versión persistida: no hay esquema previo que migrar. No se guardan datos personales.

Los seis objetivos son lighting, tablet, crew, archives, uplink y dossier. El objetivo actual es el primero pendiente, pero las acciones fuera de orden se conservan. El estado de guía nunca habilita/deshabilita las interacciones físicas. Omitir pausa la guía; continuar la retoma; reiniciar borra avances excepto iluminación ya restaurada. El usuario debe volver a abrir T tras reiniciar para completar ese paso.

La tablet se abre con T o su botón, libera Pointer Lock y pausa movimiento. Incluye destino por hover/foco/clic, completados, continuar/omitir/reanudar/reiniciar. T y los botones de cierre/continuar/omitir/reiniciar retoman el control automáticamente en el mismo gesto. Escape cierra y conserva el cursor libre como pausa.

El interruptor auxiliar junto a la entrada usa el raycaster y E existentes, hasta 2,8 m. La iluminación inicial es tenue pero permite explorar. Restaurarla apaga la alarma y produce una única variación suave de luz, desactivada con movimiento reducido. Una sesión restaurada no repite la animación al cargar. Ver experiencia ya no controla la alarma: ese callback legado se traduce a archives, igual que abrir un proyecto.

Contacto sigue siendo mailto durante esta fase y no completa uplink: abrir un borrador no confirma envío. El formulario se preparará en una fase posterior y el backend queda aplazado por el usuario. No mostrar éxito ficticio mientras no esté conectado. El CV físico y el enlace de computadora permanecen disponibles independientemente de las misiones. Quick Portfolio Access está implementado en fase 2, desde pausa y ante un fallo de WebGL, con el mismo contenido profesional que Central Archive.

The scene uses a continuous floor, a broad blue light spill, a slow emergency pulse, an instanced asteroid field and procedural celestial surfaces. These are stylized procedural assets, not photorealistic scanned textures. Reduced motion freezes exterior movement and makes the emergency light steady.

The procedural planet uses lightweight smooth analytic patterns per fragment to avoid the visible triangle interpolation of the previous vertex-colour version. Asteroids rotate individually and drift; a distant maintenance shuttle moves slowly. The scene renders on demand while the tablet or settled terminal is open; camera transitions resume continuous rendering. Browser validation uses an extended timeout on slower hosts; passing functional checks alone does not establish frame-rate performance.

The mouse-capture hint is shown after Escape or a capture error, not automatically after closing the tablet or a terminal screen. The rear-wall dossier uses a rendered copy of the supplied English CV (`public/images/crew-dossier.webp`); E requests the original PDF download and marks that objective. The map points to the rear panel when that mission is selected.

## View height, jumping and orbital scenery

The walking eye is approximately 1.70 m above the floor, with a 1.9 m capsule. Space requests one grounded jump; a downward support query excludes the player and sensors and checks the surface normal. Requests are consumed in the air, and holding the key does not repeat on landing. Jump intent clears with controls on blur, pointer unlock and mode/transition changes.

The crew dossier is lower and closer to the rear doorway. The exterior's `orbital-drift` group rotates slowly around the cabin to suggest an orbit while the FPS camera stays stable. Earth starts to port, a smaller warm planet to starboard; the arrangement is cinematic, not a scale solar-system simulation. The asteroid belt is more than 40 m from the cabin origin, including its largest surfaces. Reduced-motion preference stops the orbital drift as well as the individual animations.

## Holographic crew station

`StationMode` includes walking, computer and hologram. The central table is identified through its ancestor group when raycasting the nearest surface, up to 4.5 m; terminal and dossier retain 2.8 m. Hologram mode pauses player physics and returns to the saved player position and orientation on exit. The camera frames the projection from [2.15, 1.8, 2.8], rather than moving against the table.

The genuine CV portrait is projected by a lightweight transparent blue shader with scanlines. The adjacent accessible DOM panel exposes profile and training records; it is an archived still, not a live/video feed. Reduced motion freezes scanlines. A transparent input shield prevents canvas capture while the panel is open; explicit exit buttons can return pointer control. Opening the tablet and entering the hologram mark separate independent objectives. Optional future activities and the supplied design references are recorded in `docs/cabin-roadmap.md`.

## Fase 2: llegada, acceso rápido y Central Archive

Por corrección explícita del usuario, no hay pantalla de elección ni botón Enter station: la estación arranca automáticamente. La animación inicial sigue siendo una parte requerida del diseño futuro; no se ha sustituido por un menú ni se implementa ahora. El HUD tras restaurar luces orienta a la computadora principal si el visitante no desea seguir el tutorial. Quick Portfolio Access queda como vía secundaria en pausa/Escape y fallback sin WebGL. La alternativa DOM se conserva para accesibilidad, sin decidir la experiencia inicial por el usuario.

`App` mantiene station y portfolio. La estación permanece montada pero oculta e inert al consultar el portfolio; suspended detiene física, controles, render continuo y audio, sin perder posición/progreso ni preferencia de sonido. Volver no captura automáticamente el mouse. Escape vuelve a la estación y restaura el foco al botón de acceso. La iluminación/progreso previamente guardados mantienen la política de persistencia de fase 1; una visita nueva empieza en luz tenue.

`src/portfolio/PortfolioContent.tsx` es DOM puro y comparte Profile, Projects, Service Record, Training, Contact, imágenes reales y descarga del CV entre el acceso rápido y el wrapper Computer. No importa módulos del juego ni mantiene una segunda copia de datos. El archivo `src/data/portfolio.ts` sigue siendo la fuente de verdad. En el Central Archive, abrir Service Record o un proyecto emite archives; descargar CV emite dossier. El acceso rápido no modifica misiones y el enlace mailto no emite ninguna actividad.

El encabezado de Central Archive es estable; el contenido usa su propio título, foco al navegar y nombres reales de proyectos. La interfaz es inglesa; no se agregaron proyectos/credenciales no verificados. El formulario y el backend de contacto continúan pendientes de su fase, por decisión del usuario.

`StationBoundary` es la excepción al estilo de componentes funcionales: React proporciona el boundary de errores de render mediante una clase; su alcance está limitado al juego. No contiene reglas de producto ni oculta el acceso DOM. El listener de T ignora vistas suspendidas, campos editables y modos no caminables.

Las E2E de portfolio comprueban navegación y descarga reales a 390 px tras fallback cuando WebGL2 no está disponible, sin Pointer Lock/audio y retorno desde pausa con posición y progreso conservados. La prueba de controles continúa usando Pointer Lock real; sustituir APIs por errores en el caso sin3D solo demuestra que el portfolio no las necesita.

## Fase 3: identificación y asistente

La interacción E de la mesa cambia a hologram y termina primero la transición de cámara existente. Después CrewIdentification ejecuta un placeholder de 1,2 s con guante, tarjeta y lector; al terminar se marca crew y se muestra el retrato/panel. Escape o Cancel scan interrumpen y desmontan la secuencia sin completar la misión. La fase se guarda como idle/scanning/verified en Game, no en la persistencia profesional. La verificación puede repetirse, pero completar crew es idempotente.

El modelo provisional usa refs/useFrame y ninguna actualización React por cuadro; solo notifica la transición final una vez. No reaparece el brazo durante la caminata. Movimiento reducido completa la identificación sin animación; ocultar la pestaña o suspender la escena pausa el avance. El perfil abreviado reutiliza nombre, trabajo, ubicación, introducción de experiencia y máster del repositorio; no agrega credenciales ni años inferidos.

StationAssistant muestra un único subtítulo por evento (entrada, luces, identidad, archivo), reemplazable y descartable. No requiere audio ni voz/API externa. AmbientAudio comparte su contexto activado voluntariamente con un tono corto de escaneo; Sound off también silencia el escáner. El tono y sus nodos se detienen/liberan al cancelar o desmontar. La voz hablada queda para evaluación posterior; no se presenta el tono como narración.

La pausa también se abre con el botón visible Pause · Menu, de modo que un visitante táctil con WebGL no dependa de Escape para acceder al portfolio secundario. El subtítulo de identidad y su botón Dismiss se integran dentro del diálogo holográfico; al descartarlo, el foco vuelve a Leave hologram y permanece en el recorrido de teclado del modal.

## Retorno de interfaces al control FPS

T cierra la tablet y E cierra computadora/holograma; los botones de salida también retoman el control en el mismo gesto. Game invoca una referencia interna tipada expuesta por MouseLook para solicitar Pointer Lock inmediatamente, sin esperar renders, efectos ni el final de la transición de cámara. Se conserva la entrada raw con fallback convencional y la protección contra peticiones duplicadas. La cámara y física siguen bloqueadas durante la transición aunque el navegador ya haya capturado el cursor.

Escape y la pausa explícita mantienen el cursor libre; no intentamos recapturar automáticamente tras la liberación de seguridad del navegador. Los campos editables no consumen E/T. Encender luces y descargar el CV con E siguen siendo acciones sin modal y no liberan intencionalmente el cursor. El acceso rápido desde pausa tampoco fuerza captura al regresar.

## Fondo orbital y paneles estáticos: revisión de rendimiento

Esta revisión reemplaza el fondo orbital descrito anteriormente: la nave y la esfera de galaxias quedan fijas. La Tierra usa una esfera completa con mapa equirectangular, iluminación solar y borde atmosférico en un único shader; ya no es una fotografía sobre un plano. Las estrellas son puntos con fases independientes de brillo y deriva mínima; el planeta, los asteroides y la nave auxiliar mantienen su movimiento propio. Movimiento reducido congela estas animaciones. No se agregan luces, sombras ni postprocesado.

`batchPanoramicPassage` combina superficies estáticas compatibles de los tres módulos conservando sus triángulos y transformaciones. Posee sus geometrías combinadas y copias de materiales transparentes, que libera al desmontar; no libera los recursos del GLB compartido. El vidrio fino usa una sola pasada. Las colisiones, adaptadores y el ciclo de apertura de puertas conservan su geometría y reglas.

`StaticPanels` instancia los marcos y revestimientos por acabado; `bridgeWallPanels` define paneles oscuros, juntas, rejillas y tiras cálidas en los laterales y en la cara del mamparo visible desde el pasillo. La cafetera combina piezas estáticas en cuatro acabados y conserva el collider e interacción existentes. Su pantalla se genera únicamente al cambiar la fase del café. Las mediciones de esta revisión están en `docs/audits/fps-scenery`; una reducción de llamadas de dibujo no garantiza 60 FPS.

## Acabados interiores y mapas planetarios

La Tierra y el cielo usan ahora mapas de Solar System Scope con licencia CC BY 4.0, acreditados en `/credits.html` desde pausa. Se preparan como WebP con `scripts/assets/prepare-solar-textures.py`; los originales JPG quedan fuera del directorio público. La Tierra combina superficie, nubes, ciudades nocturnas, reflejo del océano y borde atmosférico en una sola superficie. La Luna y los otros siete planetas son cuerpos distantes con posiciones cinematográficas; no representan un sistema solar a escala ni una alineación real. Se reduce la presencia de asteroides a 24 piezas pequeñas y oscuras, instanciadas.

El pasillo conserva sus colisiones y usa vidrio neutro sin iluminación, con opacidad 0,025, también en los laterales. Las rejillas profundizan únicamente la geometría visual bajo el plano caminable. `interiorShelfPanels` agrega repisas y soportes en coordenadas mundiales: sus límites se comprueban contra `BRIDGE_OFFSET_Z`, para que los objetos no terminen fuera del puente al desplazarse el casco compacto. Se preservan el tablero de expedición y la planta colgante.

`passageRecessPanels` llena las dos ranuras del corredor opaco entre puente y vidrio. Sus objetos quedan detrás del plano físico en |X| = 1,5 m y dentro de los tres metros de transición; comparten los acabados instanciados con las repisas del puente. No se agregan colisiones para detalles inaccesibles detrás de ese límite.

Se elimina Project Photo de escena, HUD, modos, blancos de interacción y enfoque de cámara; las imágenes de los proyectos siguen disponibles en el archivo profesional. Se elimina el panel técnico reservado junto al puesto personal, incluyendo su collider, y la segunda leyenda decorativa de Docking Access. El exportador trabaja sobre copias evaluadas: no guarda ni altera el archivo Blender editable.

## Presupuesto de cuadros

`roofVisuals` combina solo la representación del techo en dos superficies por acabado; los colliders y todas las caras se conservan. `exteriorPanels` instancia cajas exteriores con sus acabados originales. `StaticPanels` agrupa además por metalicidad y rugosidad para no combinar materiales distintos accidentalmente.

`WarmLightFastPath` instala hooks reversibles en los materiales PBR presentes al completar la carga. Evita evaluar la reflexión directa de luces cuya contribución ya es cero según Three, manteniendo sus valores y preservando hooks previos. La prueba de contrato acompaña a la versión fijada de Three. Los materiales básicos y shaders de planetas permanecen independientes.

El grupo exterior decorativo retorna `false` al raycast para detener la recursión de picking en Three r186. Sus objetos están fuera del alcance de interacción; consolas, puertas y superficies cercanas siguen usando el rayo y sus reglas existentes. El cielo se dibuja después de los sólidos para aprovechar el depth buffer, y las estrellas después del cielo; el vidrio conserva su fase transparente. El contrato de raycast se prueba con objetos y rayos reales de Three.

Se mantiene el DPR original `[1, 1.5]`. Se ensayó y retiró una resolución adaptativa al comprobar el margen obtenido con las optimizaciones anteriores, para preservar la nitidez. Las mediciones finales usan resolución nativa; no garantizan 60 FPS sin picos en cualquier hardware.

Se elimina el backdrop blur continuo del HUD y se refuerza su fondo. La pausa conserva su efecto visual. La medición prolongada y las limitaciones están en `docs/audits/stable-fps/REVIEW.md`.

## Tablet y presencia de tripulación — 2026-11-16

`CrewMirror` mantiene un render target propio de512×288, con cámara reflejada y
recorte oblicuo. Actualiza como máximo a10Hz cerca y orientado hacia el espejo;
el astronauta procedural vive en capa1, visible solo para esa cámara. El montaje
tiene collider fijo y libera sus recursos al desmontar. Los guantes/tablet
siguen siendo visuales relativos a la cámara, sin colisiones ni raycasts.
`ArrivalServiceDetails` instancia rejillas estáticas sin luces nuevas.
El listado de misiones contiene cuatro objetivos; las banderas internas de
potencia/tablet no forman parte del contador. Evidencia y límites en
`audits/crew-presence/REVIEW.md`.

## Suites E2E y profiling observacional

`lookAt` espera la mira visible antes de enviar movimiento nativo: recuperar
Pointer Lock no implica que la transición de cámara haya terminado. La mira
confirma el modo caminable activo y evita perder movimientos durante el regreso
de un terminal. El punto inicial del mouse usa el tamaño real del viewport.
Cada movimiento arma primero un observador de `mousemove` confiable con captura
activa y espera 150 ms sin nuevos eventos, seguidos de dos cuadros, antes de leer
la orientación. Ese intervalo vuelve a empezar con cada evento de la ráfaga. Se
limpian listener, temporizador y handle en cada paso. Un fallo conserva los
deltas recibidos; no se simulan eventos ni se modifica la cámara para aprobarlo.

`e2e/suites.ts` clasifica cada spec en regresión, auditoría o producción.
`playwright.shared.config.ts` comparte el navegador y sus límites; cada entrada
elige specs, puerto, artefactos e informe HTML. Una prueba exige inventario
exhaustivo y disjunto, incluso para futuros subdirectorios. Las recetas de
revisión anteriores mantienen sus configuraciones explícitas como compatibilidad.

`profileBridge` utiliza exclusivamente el observador de desarrollo y CDP
Profiler de Chromium: devuelve muestras, percentiles, entorno y perfil CPU.
No accede a raíces de Fiber, rutas del caché Vite ni altera raycasts/DPR. Cierra
el profiler y su sesión en finally. El coste de instrumentación no se presenta
como FPS de producción; los diagnósticos siguen ausentes del build publicado.
Comandos y límites: [testing.md](testing.md).

## Miniatura táctica y capturas de desarrollo

`TacticalStation` reutiliza el GLB de `UNIFIED_ENVELOPE_ASSET` ya cargado por el
exterior. `tacticalShipModel` prepara una copia estática de posiciones normalizada
a 1,6 m, sin alterar geometrías ni materiales del caché. Combina la nave en una
superficie y un lote de aristas visibles; un proxy de doce triángulos conserva
el picking sin recorrer la miniatura detallada. No duplica física, luces ni el
interior. Conserva giro con delta, zoom, pausa y movimiento reducido. Sus recursos
propios se liberan al desmontar. Reutilizar la descarga no elimina el coste GPU:
la superficie conserva 114.135 triángulos y añade 8.944 segmentos.

La composición de `spaceScenery` aproxima visualmente Saturno con sus anillos
y amplía Júpiter; conserva la Tierra y los materiales existentes. Es una vista
cinematográfica, sin pretensión de representar órbitas simultáneas reales.

`DEV_MODE` configura únicamente el servidor de desarrollo y se convierte en un
booleano; no publica otras variables del entorno. Permite capturas al perder
foco con los controles detenidos, manteniendo Escape y reentrada explícita.
El build lo desactiva siempre. Uso: [development-capture.md](development-capture.md).
Evidencia: [audits/tactical-vista/REVIEW.md](audits/tactical-vista/REVIEW.md).

## Interfaces de referencia, guantes y radio — 2026-11-16

Los subtítulos de `StationAssistant` comparten una franja inferior con etiqueta
IA, divisor, onda estática y cierre accesible. `PersonalDesktop` reutiliza el
fondo orbital local detrás de paneles azul petróleo; conserva aplicaciones,
datos reales, teclado y foco. `CrewIdentity` presenta escáner y ficha únicamente
al verificar la identidad, sin añadir credenciales ficticias. Son superficies
DOM sobre las pantallas físicas existentes, sin luces ni postprocesado nuevos.

`AstronautGlove` comparte el diseño y generador entre manos de la tablet y tarjeta. Cada
guante fusiona colores por vértice en un único mesh de 5.800 triángulos; la
versión de cámara se dibuja después del escenario y no escribe profundidad.
La tablet conserva controles y animación, con marco redondeado y protectores
naranjas. La identificación espera a que termine la transición de cámara; su
duración propia no cambia. El encuadre de Crew Access incluye lector y muñeca.

`ArrivalOutfitting` añade armario, nicho con chaqueta/casco y señalética contra
la pared trasera. Se fusiona en seis materiales y dos planos de señalética;
tres colliders locales protegen el equipamiento sin invadir el paso central.
Las rejillas y el mecanismo de escotilla existentes se conservan.

`ShipRadio` se opera desde el recorrido: cada tecla 3D tiene un target propio
(Play/Pausa, anterior, siguiente, volumen +/−). El raycast normal selecciona la
superficie más cercana; la carcasa y la pantalla no activan nada. E pulsa la tecla
bajo la mira, anima su recorrido y el índice del guante, conservando posición,
orientación y Pointer Lock. No existe modo de cámara de radio ni interfaz de
computadora. El frente usa carcasa metálica gris, defensas, asa, rejilla y teclas
salientes con señal de hover. La pantalla es una textura reutilizada y actualizada
por eventos de pista/estado y segundos completos, sin luces o sombras añadidas.
`useShipRadio` conserva un único HTMLAudioElement creado al primer Play,
suspende en pausa o al perder foco y no solicita la siguiente pista si está
pausado. `radioTracks.ts` centraliza los cinco MP3 y sus atribuciones;
`npm run credits:music` genera `/credits.html` y `CREDITS.txt`.
Los archivos suman aproximadamente 43,4 MB, descargados bajo demanda.

Revisión nativa y límites: [audits/reference-style/REVIEW.md](audits/reference-style/REVIEW.md).

## Llegada despejada, nichos y visor táctico — 2026-11-16

La pasada de corrección selecciona tres copias nuevas `clean-*` desde
`refinedArtAssets.ts`. El exportador retira las piezas identificadas por nombre
de la caja sobre el banco y la manta con sus costuras; reconstruye dos filtros
completos y separa los dos armarios, con sus colliders alineados. También evalúa
el puente desde la fuente que ya retiró la decoración superpuesta a los nichos.
Los GLB anteriores y la fuente Blender se preservan como referencia.

`ReferenceCassettes` integra la colección Blender pendiente número 13 como
visual independiente: 15 lotes, 37.832 triángulos y 3.113.116 bytes. Las hojas
procedurales hornean su color en dos imágenes de 256 px; las pantallas y fotos
conservan sus imágenes existentes. No importa luces, cámaras ni colliders. El
marco `BridgeThroatFrame` da hombros achaflanados y esquinas redondeadas al paso,
manteniendo su abertura de circulación. No modifica la envolvente exterior ni
el perfil del pasillo de vidrio.

`EVAEquipment` sustituye el traje de primitivas por una adaptación reducida del
EMU de NASA/Michael D. Carbajal. El equipo queda centrado en el nicho lateral,
separado de la escotilla. Fuente, preparación y límites: [nasa-emu](assets/nasa-emu/README.md).

La mesa táctica tiene un pivote central del casco y una pose activa independiente
de la pose libre sobre la mesa. `tacticalDisplayLayout` convierte los límites del
visor CSS al plano físico y calcula una escala que deja el casco dentro del
espacio libre para cualquier giro y zoom permitido. El cálculo depende de
cámara/viewport, no de cada cuadro. El layout usa una columna compacta de
navegación/datos y un visor amplio con controles inferiores. No añade pases.

Recetas y verificaciones: [arrival-cleanup](audits/arrival-cleanup/README.md) y
[arrival-layout](audits/arrival-layout/REVIEW.md).

## Proyector táctico fijo — 2026-11-17

Se retira la pose activa que trasladaba el holograma al plano de la interfaz.
Su posición, inclinación y escala inicial permanecen iguales al abrir y cerrar
con E; el zoom explícito se conserva al regresar al recorrido. La pantalla y
su encuadre se alinean al centro fijo del proyector usando el área libre del
layout, con una única definición en `tacticalDisplayLayout.ts` compartida por
la estación y la geometría visual. No se añaden pases ni animaciones.

La regresión nativa compara la posición mundial del holograma antes de abrir,
durante la interacción/zoom y después de salir, además de giro y reentrada en
Pointer Lock. Las pruebas geométricas comprueban el encuadre del casco fijo
en64ángulos, dos niveles de zoom y tres proporciones de pantalla.

## Interacción física y tablet de lectura — 2026-11-17

La tablet se sostiene más alta, con guardas naranjas y guantes articulados en los
bordes. T muestra/guarda misiones, destinos y mapa sin liberar el cursor; R no
activa ningún modo. Quick Portfolio Access y Read without 3D se conservan en
pausa, también con botón táctil de menú. La acreditación tarda un segundo y
reserva las mismas filas antes y después de conceder acceso. El traje colgado
usa un GLB derivado con brazos y guantes caídos y soporte de hombros; la fuente
original se preserva y sus colliders mantienen libre la escotilla.

## Gestos con contacto — 2026-11-20

`world/gestureTiming.json` comparte los tiempos en segundos entre la app y el
archivo de animación de Blender. Tarjeta y radio llegan al contacto a los 0,5 s;
la lectura o pulsación se ejecuta a los 0,58 s, después de actualizar la pose.
Un cuadro largo se detiene primero en el contacto para no saltarse esa fase.
Pausa, documento oculto y pérdida de foco congelan ambos gestos. Movimiento
reducido conserva el tiempo de acción con una pose de contacto estática.

La tablet sube en 0,8 s y baja en 0,6 s, con interpolación suave y las manos
ancladas al marco. La tarjeta termina su retirada a los 1,25 s; la radio libera
el botón a los 0,72 s y termina a 1 s. Los observadores exclusivos de desarrollo
miden distancia tarjeta/lector y dedo/botón; las pruebas con entrada nativa
comprueban contacto antes de la acción. Las nuevas manos de Blender siguen
siendo el recurso de autoría; la integración descrita abajo sustituye las mallas
procedurales que se usaban durante la preparación de los clips.

## Manos y tablet exportadas — 2026-11-20

`handInteractionModel` clona únicamente la raíz necesaria del GLB compartido
(`TABLET_ASSEMBLY`, `CARD_GESTURE` o `RADIO_GESTURE`) con esqueletos privados y
geometría/materiales/texturas de caché. Un `AnimationMixer` por instancia evalúa
el clip en el tiempo controlado por las reglas existentes; Blender no ejecuta
acciones de React. Se eliminan las antiguas mallas y curvas de movimiento de los
guantes procedurales. La limpieza libera mixers y texturas de huesos privadas,
nunca geometría ni mapas compartidos, y soporta el replay de StrictMode.

`CARD_CONTACT` se alinea al lector; `RADIO_FINGERTIP` y
`RADIO_BUTTON_CONTACT` provienen del clip y se comprueban contra la piel exportada.
El botón físico sigue ese anclaje animado en vez de reproducir una curva distinta.
Los callbacks ocurren después de muestrear la pose. Movimiento reducido conserva
la pose de contacto y el recorrido del botón, omitiendo acercamiento y retirada.

La tablet conserva sus dos clips, con una transición breve al invertir T a mitad
de recorrido. `SCREEN_UI` aloja la interfaz DOM real. Un pase de primer plano
limpia sólo profundidad después de la nave y conserva profundidad entre dedos y
carcasa; las estadísticas del renderer suman ambos pases. Sólo se renderiza ese
pase adicional cuando la tablet está visible. La escala en pantallas verticales
no modifica su distancia a la cámara ni acerca la malla al plano de recorte.

## Exterior Asterion — 2026-11-23

`AsterionExterior` sustituye el antiguo Sistema Solar. El cielo usa una única
imagen equirectangular que sigue la posición de la cámara; los planetas, anillos
y fragmentos permanecen en coordenadas mundiales y conservan paralaje al caminar.
La consola de inspección reutiliza el cielo, sin cargar otra copia de los mundos.

El GLB deriva del archivo aprobado `docs/assets/cosmos/asterion-expanse-v2.blend`.
Los materiales procedurales y su iluminación se hornean para conservar el aspecto
de Blender sin agregar luces ni sombras dinámicas. La exportación aplica AgX una
vez; los materiales de la app desactivan el tone mapping para evitar aplicarlo
de nuevo. Los bordes atmosféricos dependen de la mirada y se calculan con un shader
ligero; la dirección solar proviene del mismo manifiesto que sus posiciones.

`GzipGLTFLoader` mantiene la compresión de transporte sin pérdidas y la caché de
recursos. Cada instancia posee sólo sus materiales; no libera mapas ni geometría
compartida. El modelo y el cielo participan del Suspense existente, de modo que
la apertura de la intro espera su disponibilidad junto al interior. Los mundos
no giran porque su iluminación está horneada; la nave distante conserva su
movimiento y respeta movimiento reducido. Las mediciones y vistas reales quedan
en `docs/audits/asterion-integration/`.

### Deriva exterior y reposo en pausa

`asterionMotion.ts` define dos trayectorias cerradas suaves: deriva aparente del
conjunto planetas/anillos/atmósferas en 240 s y desplazamiento relativo del campo
de fragmentos en 120 s. Ambas parten de la composición aprobada y avanzan en la
misma dirección inicial. Son una aproximación visual al movimiento orbital de
la nave, no una simulación astronómica. Se trasladan los cuerpos sin girar sus
materiales ni los terminadores horneados. El cielo remoto permanece fijo.

Un tiempo de simulación local avanza con delta completo entre 15 y 144 FPS;
descarta cuadros de más de 250 ms para evitar saltos después de una suspensión.
Pausa, pestaña oculta y movimiento reducido congelan ese tiempo y el de la nave
auxiliar. Los cambios por cuadro reutilizan vectores y grupos, sin crear recursos
ni actualizar estado React.

`hiddenBodies` en el manifiesto excluye Vesper y su halo de los clones de ejecución;
la luna Selene permanece y el GLB original se conserva. `courierModel` sustituye la
nave de octaedros por seis lotes opacos preiluminados. `OrbitalRelay` añade arcos
artificiales a Ítaca, y `MeteorTrails` agrupa las estelas en un dibujo instanciado
con una textura procedural mínima. Todos comparten la política de tiempo,
pausa y movimiento reducido; las estelas se ocultan con esta preferencia.
Detalles, fuente Blender derivada y evidencia en `docs/audits/asterion-traffic/`.

Con la intro completada, Escape lleva el Canvas a renderizado bajo demanda.
La imagen se conserva y una actualización legítima todavía puede invalidarla;
al retomar el recorrido vuelve el renderizado continuo. Los modos de preparación
y revelado de la intro mantienen sus condiciones previas. El contador de cuadros
de diagnóstico es de sólo lectura y exclusivo de desarrollo, para comprobar el
reposo y la reanudación con entrada nativa. Evidencia y límites de las mediciones:
`docs/audits/asterion-motion/`.
