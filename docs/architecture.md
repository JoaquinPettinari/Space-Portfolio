# Arquitectura

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
