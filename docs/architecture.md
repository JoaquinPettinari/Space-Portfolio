# Arquitectura

## Base existente

Aplicación de navegador con Vite, React, TypeScript, Three.js, React Three Fiber, Drei y Rapier. npm gestiona dependencias y scripts. No se necesita un framework de servidor ni un motor adicional.

- `src/main.tsx` monta React.
- `src/App.tsx` compone la aplicación y su experiencia 3D.
- `src/game/Game.tsx` coordina Canvas, luces, carga de física, estado de entrada y controles de cámara.
- `src/game/world/Greybox.tsx` construye la sala vidriada, mesa y puerta cerrada con colisiones explícitas. `Workstation` contiene escritorio, monitor y silla; `SpaceExterior` contiene estrellas y planeta procedural.
- `src/game/player/Player.tsx` conecta entrada, velocidad del cuerpo físico y posición de cámara. La cápsula invisible representa el volumen del jugador.
- `src/index.css` define presentación DOM y superposiciones.

Mantener esta estructura pequeña. Extraer funciones de movimiento y componentes DOM cuando permitan pruebas claras; no añadir servicios, eventos globales o un gestor de estado sin necesidad.

## Decisiones técnicas

Fiber traduce JSX de la escena a objetos Three.js; los menús siguen siendo DOM. La cámara representa la mirada y sigue al cuerpo físico. Rapier calcula las colisiones contra cuerpos fijos.

La velocidad horizontal depende de la mirada proyectada al piso. Normalizar el vector de entrada evita acelerar en diagonal. `setLinvel` recibe unidades por segundo; Rapier integra el desplazamiento con su paso de física. Multiplicar esa velocidad por delta sería aplicar el tiempo dos veces. Los desplazamientos manuales sí necesitan delta.

Guardar teclas y valores por cuadro en refs. Reservar estado React para cambios de interfaz o modo. Liberar Pointer Lock y limpiar entrada al perder foco; Escape debe permitir volver al menú.

La física usa un paso fijo. `useBeforePhysicsStep` establece velocidad; Rapier con prioridad -1 actualiza e interpola su Object3D; luego la cámara sigue un anclaje hijo en `useFrame`. Esto evita seguir posiciones discretas de `translation()` y no agrega suavizado a la rotación. MouseLook usa PointerLockControls de Three y solicita unadjustedMovement para evitar aceleración del sistema, con reintento convencional ante NotSupportedError. El usuario confirmó la resolución de los tirones en Opera. Tamaño del bundle y fluidez gráfica son métricas diferentes. `App` carga el módulo 3D automáticamente con `React.lazy` y muestra un indicador circular durante la carga. La separación de chunks se mantiene, pero ya no se espera un clic para iniciar la descarga.

`movement.ts` contiene el cálculo de velocidad sin dependencia de React ni física; `EntryMenu.tsx` contiene la presentación DOM. `GameDiagnostics.tsx` se importa únicamente en desarrollo y devuelve observaciones copiadas, nunca setters. El flujo de producto aún no incluye la alternativa accesible.

## Estrategia de pruebas

- **Vitest:** reglas puras existentes, dirección, teclas opuestas, diagonal y movimiento desactivado.
- **React Testing Library:** estados de carga, entrada y error del menú DOM. No comprobar semántica de la escena WebGL mediante selectores DOM.
- **Playwright con Chromium:** carga, menú, canvas, consola y excepciones; activación y liberación real de Pointer Lock, movimiento y colisiones cuando el navegador lo permita.
- **Observación del juego:** cuando sea necesaria, interfaz tipada y de solo lectura disponible en desarrollo/test, sin exposición en producción. No permitir teletransportes o cambios de estado para simular éxito.
- **Pendientes de producto:** interacción E, terminal, misiones, CV/contacto y alternativa accesible. Añadir pruebas cuando se implementen; no presentar escenarios inexistentes como aprobados.

Playwright Test proporciona regresiones repetibles. Playwright MCP permite inspección interactiva por el agente. Configurar un servidor no equivale a haber verificado su conexión. Los tests no dependen del MCP. Si Pointer Lock o WebGL quedan limitados por el navegador, informar el bloqueo y la comprobación manual necesaria.

## Verificación y documentación

Consultar scripts y comandos de desarrollo en `package.json` y `README.md`. Las puertas de calidad son typecheck, lint, formato, pruebas pertinentes, build y verificación del navegador para cambios que lo requieran. Este documento describe la estrategia, no certifica resultados de ejecución.

Las instrucciones permanentes y responsabilidades de roles están en `AGENTS.md`; la dirección del producto y los hitos están en `docs/vision.md`. Registrar resultados y limitaciones de cada entrega sin confundir inspección de código o capturas con pruebas funcionales.

## Observatorio e interacción

Los modos son walking y computer. E selecciona la superficie más cercana bajo el centro de la cámara, hasta 2,8 m; las superficies intermedias bloquean la interacción. Player es el único dueño de la posición de cámara y anima la transición durante 0,65 s; MouseLook solo controla la orientación cuando no hay transición ni pantalla abierta. La cápsula queda en el punto de aproximación mientras se usa el puesto, y volver a caminar recupera ese punto y orientación. La física se pausa fuera del modo caminar.

La computadora libera Pointer Lock y muestra aplicaciones DOM alimentadas por `src/data/portfolio.ts`. El botón de salida vuelve a caminar y solicita Pointer Lock mediante el mismo clic; Escape deja el cursor libre y muestra solo una indicación discreta para retomar. Estrellas y planeta rotan con delta, sin renders React por cuadro. Las transiciones y el ambiente respetan prefers-reduced-motion. La puerta trasera está cerrada, sin interacción de apertura.

## Forma del casco

`ShipHull.tsx` reemplaza el cerramiento cuadriculado: un ventanal frontal continuo, dos ventanas por lado, dos lucernarios y mamparo trasero opaco. Las esquinas achaflanadas y los hombros inclinados tienen colliders propios; se conserva el recorrido del puesto de trabajo. Las alas son geometría exterior visible desde los laterales, sin áreas caminables nuevas. Las estrellas usan una distribución pseudoaleatoria reproducible, radios entre 55 y 103 metros y tres grupos de brillo/tamaño. La deriva exterior mantiene la sensación de movimiento sin balancear la cámara FPS.

## Perfil y presentación del usuario

Contenido basado en Resume.pdf, Tesis.pdf y la memoria DOCX facilitados por Joaquín. Se distinguen trabajos académicos de experiencia laboral. RouteWise conserva la limitación de precios/horarios simulados y validación manual; AccesiWeb no se presenta como certificación automática de cumplimiento. La fecha de Advanced React se omite por inconsistencia entre CV y enlace. El CV descargable es una copia sin cambios del original; los textos extraídos y documentos académicos no se publican como archivos completos.

El brazo original de astronauta sigue la cámara después de Player (prioridad -0.5); no participa en raycasts ni colisiones. El techo tiene bóveda elíptica y lucernarios curvos.

## Recovery mission prototype

The mission tablet opens with T or the HUD button; Escape/T closes it without recapturing the pointer. Movement pauses while open. Hover, keyboard focus and touch select objectives on the deck map. Objectives can be completed in any order. The crew dossier has a physical rear-wall panel with E-to-download interaction; the other objectives currently use the forward terminal. The terminal retains a CV link for direct access. Progress lasts for the current page session; reload starts a new run.

Terminal actions mark objectives: Education (crew), Experience (diagnostics), opening a project (archives), requesting the CV download (dossier), and opening an email draft (uplink preparation). The app does not claim the email was delivered. Completing diagnostics stops the emergency beacon. No portfolio section is gated.

The scene uses a continuous floor, a broad blue light spill, a slow emergency pulse, an instanced asteroid field and procedural celestial surfaces. These are stylized procedural assets, not photorealistic scanned textures. Reduced motion freezes exterior movement and makes the emergency light steady.

The procedural planet uses lightweight smooth analytic patterns per fragment to avoid the visible triangle interpolation of the previous vertex-colour version. Asteroids rotate individually and drift; a distant maintenance shuttle moves slowly. The scene renders on demand while the tablet or settled terminal is open; camera transitions resume continuous rendering. Browser validation uses an extended timeout on slower hosts; passing functional checks alone does not establish frame-rate performance.

The mouse-capture hint is shown after Escape or a capture error, not automatically after closing the tablet or a terminal screen. The rear-wall dossier uses a rendered copy of the supplied English CV (`public/images/crew-dossier.webp`); E requests the original PDF download and marks that objective. The map points to the rear panel when that mission is selected.

## View height, jumping and orbital scenery

The walking eye is approximately 1.70 m above the floor, with a 1.9 m capsule. Space requests one grounded jump; a downward support query excludes the player and sensors and checks the surface normal. Requests are consumed in the air, and holding the key does not repeat on landing. Jump intent clears with controls on blur, pointer unlock and mode/transition changes.

The crew dossier is lower and closer to the rear doorway. The exterior's `orbital-drift` group rotates slowly around the cabin to suggest an orbit while the FPS camera stays stable. Earth starts to port, a smaller warm planet to starboard; the arrangement is cinematic, not a scale solar-system simulation. The asteroid belt is more than 40 m from the cabin origin, including its largest surfaces. Reduced-motion preference stops the orbital drift as well as the individual animations.

## Holographic crew station

`StationMode` includes walking, computer and hologram. The central table is identified through its ancestor group when raycasting the nearest surface, up to 4.5 m; terminal and dossier retain 2.8 m. Hologram mode pauses player physics and returns to the saved player position and orientation on exit. The camera frames the projection from [2.15, 1.8, 2.8], rather than moving against the table.

The genuine CV portrait is projected by a lightweight transparent blue shader with scanlines. The adjacent accessible DOM panel exposes profile and training records; it is an archived still, not a live/video feed. Reduced motion freezes scanlines. A transparent input shield prevents canvas capture while the panel is open; explicit exit buttons can return pointer control. Opening the tablet and entering the hologram mark separate independent objectives. Optional future activities and the supplied design references are recorded in `docs/cabin-roadmap.md`.
