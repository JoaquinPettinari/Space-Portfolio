# CRUZ DEL SUR — Terminales y dispositivos interactivos

**Versión:** 1.1 (ilustrada) — especificación de producto y UX para implementación incremental  
**Idioma de las interfaces:** inglés  
**Estado:** propuesta para revisión; no implica que todas las funciones estén implementadas.

## 0. Principios y decisiones vigentes

1. El portfolio es accesible sin completar misiones. La narrativa nunca bloquea proyectos, experiencia, estudios, contacto o CV.
2. Cada dispositivo tiene una responsabilidad reconocible. Evitar duplicar pantallas, formularios y fichas profesionales.
3. La experiencia principal es **una pantalla física dentro del mundo 3D**, enfocada de frente y de cerca al presionar `E`; no una modal genérica flotando. Reutilizar los componentes React existentes.
4. La interfaz de cada dispositivo debe ser legible en el área visible del monitor: navegación y salida fijas, sin scroll horizontal; scroll vertical únicamente cuando sea indispensable para un detalle largo. Preferir vistas de detalle y paginación.
5. Todas las interfaces, diálogos y subtítulos en inglés. En comunicaciones se informa que los mensajes reales pueden escribirse en **English, Spanish, Italian or Norwegian**.
6. **Quick Portfolio Access** vive en la tablet y enfoca Central Archive. No mostrar botón flotante ni múltiples accesos “Accessible Portfolio”. Mantener accesibilidad semántica y de teclado, sin una UI duplicada.
7. La tablet se abre con `T`; `R` activa su modo de cursor y, mientras se usa el mouse, se suspende el movimiento del personaje. Conservar ese comportamiento.
8. Cada recarga inicia una sesión nueva: sin persistencia del progreso de misiones. El contenido profesional no cambia.
9. El usuario diseña CSS, tipografía, espaciado y UI React. Codex se ocupa preferentemente de integración 3D, cámara, interacción, animación, estados de juego, rendimiento y tests. No modificar el HUD sin pedido explícito.
10. Datos profesionales reales y rutas de assets: **usar el repositorio como fuente de verdad**. No inventar nombres de empleadores, fechas, resultados, certificaciones ni proyectos.

## 1. Mapa de responsabilidades

| Dispositivo | Propósito | Entrada | Acciones importantes | Relación con misiones |
|---|---|---|---|---|
| **Crew Access** | Identificación breve | `E` junto a la entrada | Animar tarjeta, verificar, mostrar ficha | Completa identificación |
| **Central Archive** | Portfolio profesional | `E` o Quick Portfolio Access desde tablet | Perfil, proyectos, experiencia, educación, CV | Abrir un expediente real puede completar revisión |
| **Earth Communications** | Contacto real | `E` en puente de mando | Enviar email, omitir envío | Enviar o Skip completa contacto |
| **Personal Workstation** | Escritorio personal y dossier | `E` en rincón personal | CV, galería, terminal, extras | Abrir/descargar dossier o Skip |
| **Tactical Table** | Estado y ficción de la estación | `E` en mesa central | Rotar nave, ver sistemas y registros | Opcional; refleja progreso real |
| **Mission Tablet** | Orientación y acceso rápido | `T`, luego `R` para cursor | Objetivos, mapa, historial, Skip, Quick Portfolio | No obliga a seguir el tutorial |

## 2. Patrón común de interacción de monitores

**Estado de reposo:** la pantalla física muestra el nombre del sistema y una línea de estado corta. Se ve desde la sala. No renderizar contenido profesional completo a distancia.

**Acercamiento:** apuntar y pulsar `E` → cámara interpola hasta un punto frontal, perpendicular al monitor, con el marco visible y el contenido ocupando la mayor parte de la vista. Bloquear locomoción y gestionar Pointer Lock solo según lo exija el modo de entrada.

**Uso:** mouse y teclado interactúan con una única instancia del contenido React; navegación y acción de salida visibles. Mantener foco predecible. `Escape` debe tener un comportamiento documentado y consistente con la pausa global; si `E` sale del terminal, indicarlo.

**Salida:** restaurar cámara, posición y control FPS sin pedir clic extra, salvo que el navegador requiera una nueva activación del usuario. Evitar dobles montajes, overlays duplicados y scroll del documento exterior.

**Requisitos visuales compartidos:** fondo azul grafito `#071923`, superficies `#102D3A`, acento cian `#42E8F5`, texto `#E9F5FA`, secundarios `#9AB6C4`, acento cálido `#E6B778`. Usar estos tokens como punto de partida, no imponer CSS final.

**Tests comunes:** abrir/cerrar repetidamente; navegación por teclado; scroll contenido; foco y Escape; Pointer Lock; restauración de cámara; diferentes tamaños de viewport; errores de carga; rendimiento de Drei Html transform.

## 3. Central Archive — software profesional

**Ubicación:** puesto izquierdo de la consola frontal integrada. **Objetivo:** que un reclutador entienda el perfil en segundos y pueda profundizar sin jugar.

### Navegación propuesta

- **Overview** (inicio): nombre real, cargo, ubicación, resumen breve, tecnologías principales, acceso destacado a proyectos y CV. No repetir mensajes como “no mission required” dentro de la ficha.
- **Projects / Expedition Archives:** lista de proyectos reales. Mostrar título real primero y, opcionalmente, un nombre ficticio secundario. Cada tarjeta: nombre, tipo de trabajo, una frase de problema, tecnologías y botón **Open record**. No inventar métricas.
- **Project Detail:** una ficha por proyecto, con imagen real si existe, contexto, problema, contribución personal, solución, tecnologías, resultados verificables y enlaces reales. Navegación **Back to projects**, **Previous/Next** si aplica. Evitar una página interminable.
- **Service Record:** experiencia laboral real en línea temporal o tarjetas paginadas; empleador, cargo, fechas, aportes y stack desde datos existentes.
- **Education:** licenciatura, máster y otros estudios reales con nombres oficiales y fechas verificadas. Asociar tesina/trabajo final al expediente correspondiente solo cuando los datos coincidan.

### Proyectos candidatos, pendientes de contrastar con el repo

- Accesibilidad web — tesina de licenciatura (según conversación; verificar título exacto).
- Nodos/red de aeropuertos — trabajo final de máster (verificar título y alcance).
- Gestión de turnos/habitaciones universitarias — proyecto colaborativo (no inventar caso de estudio; puede quedar como borrador hasta tener información).

### Interacciones

- Seleccionar sección en navegación lateral compacta.
- Abrir tarjeta de proyecto; volver a lista sin perder posición.
- Descargar CV real desde Overview (enlace visible, sin necesitar la Personal Workstation).
- Eventual acceso contextual a Earth Communications, **sin duplicar el formulario**.
- Abrir un expediente real dispara el evento de misión correspondiente una sola vez; navegar entre tabs no debe completar la misión por accidente.

**Criterios de aceptación:** Overview legible sin scroll en monitor objetivo; navegación fija; sin scroll horizontal; datos no duplicados; todos los enlaces y CV reales; lectura cómoda desde la cámara enfocada.

## 4. Earth Communications — envío real

**Ubicación:** puesto derecho de la consola frontal. **Identidad visual:** consola de enlace terrestre, distinta del archivo profesional.

**Pantalla inicial:** `EARTH COMMUNICATIONS`, estado de enlace (derivado de la lógica real del juego; no fingir conectividad del backend), explicación clara: **“This sends a real message to the portfolio owner.”** Texto visible: **“You can write in English, Spanish, Italian or Norwegian.”**

**Formulario:** Name, Email, Message; botones **Send Transmission** y **Skip**. El segundo omite el contacto real y solo completa la etapa narrativa mediante reporte ficticio; no hace POST. Campos con errores específicos, estado de envío, respuesta de éxito únicamente tras confirmación del servidor, reintento en caso de error.

**Seguridad:** endpoint del mismo repo si ya está implementado; validación del servidor, límites de tamaño, protección antispam/rate limiting, destino fijo, secreto solo en servidor, no exponer datos privados en logs. Tests con proveedor simulado.

**Criterios de aceptación:** formulario y acciones principales visibles sin scroll inicial; estados loading/success/error; Skip jamás envía email; no duplicar Contact en Archive.

## 5. Personal Workstation — escritorio del tripulante

**Ubicación:** sector posterior/estribor, ambiente más cálido y personal. **No es otra copia del portfolio.**

**Pantalla:** escritorio retrofuturista `CREW DESKTOP`, barra de estado y un conjunto limitado de iconos.

| Aplicación | Acción | Alcance inicial |
|---|---|---|
| `Crew Dossier.pdf` | Abrir/descargar el CV real | Obligatorio para misión, pero omisible |
| `Gallery` | Ver fotos reales aprobadas | Opcional; placeholders solo si están claramente marcados |
| `Command Terminal` | Comandos ficticios seguros, incluido `npm install coffee` | Opcional; comandos en whitelist, sin ejecución real |
| `Arcade` | Minijuego ligero | Posterior, no bloquear v1 |
| `Notes` / `Logs` | Recuerdos y pequeños secretos | Posterior |

**Interacción:** un clic o doble clic para abrir icono; flechas + Enter; cerrar ventana; volver al escritorio. Una ventana activa a la vez inicialmente para evitar un gestor de ventanas complejo. Sin simular comandos del sistema operativo real ni permitir ejecución arbitraria.

**Criterios de aceptación:** CV visible y descargable; escritorio legible sin scroll; navegación con teclado; no repetir Profile/Projects/Service Record completos.

## 6. Crew Access — lector físico

**Ubicación:** junto a la entrada del puente, reutilizando el lugar del antiguo interruptor interior redundante. El único control de energía permanece en la esclusa.

**Flujo:** apuntar al lector → `E` una vez → mano con tarjeta alineada con la ranura → breve escaneo → estado `ACCESS GRANTED` → ficha de identidad en la pantalla del dispositivo, no en una modal flotante. Si el monitor físico es pequeño, mostrar una ficha breve, no intentar meter el CV completo.

**Contenido breve:** foto aprobada, nombre, cargo, ubicación y Master's Degree solo si está verificado en datos del repo. Botón/tecla para cerrar. Repetir interacción puede reabrir la ficha, pero no repetir misión ni diálogo de bienvenida.

**Criterios de aceptación:** no clipping de mano/tarjeta; un solo lector; ningún interruptor duplicado; no scroll de identidad; subtítulo sincronizado con `verified`.

## 7. Tactical Table — holograma opcional

**Ubicación:** centro del puente. **No autentica al usuario ni muestra el portfolio.**

**Reposo:** maqueta holográfica de CRUZ DEL SUR rotando lentamente. Si no hay modelo de estación aprobado, usar un placeholder técnico explícito, no inventar un GLB final. PAMPA-07 aparece acoplada solo si la geometría/estado lo permiten.

**Al pulsar E:** acercamiento a la mesa; el holograma gana tamaño; aparecen secciones `Station Overview`, `Docking Bay`, `Systems`, `Mission Log`. Permitir rotar y hacer zoom con límites; salir al FPS.

**Datos:** energía, puerta, identidad, comunicaciones y misión derivados del estado del juego. La ficción de la estación debe estar claramente separada del estado real de entrega de emails. Registro de señal misteriosa opcional, no obligatorio.

**Criterios de aceptación:** interacción completamente opcional, sin modal profesional, modelo rotatorio eficiente, controles claros, reflejo de estado sin inventar métricas técnicas reales.

## 8. Mission Tablet — navegación de la experiencia

**Modo físico:** `T` levanta/guarda tablet; mientras se sostiene, el jugador ve la estación alrededor. **Modo de uso:** `R` habilita mouse y suspende movimiento del personaje. No rediseñar este flujo sin aprobación.

**Secciones:** `Current Objective`, `Mission Log`, `Ship Map`, `Quick Portfolio Access`. `Skip Tutorial` disponible mientras corresponda. El mapa debe representar la geometría real del juego, no copiar mapas de juegos de referencia.

**Quick Portfolio Access:** desde la tablet, enfocar y abrir el **mismo** Central Archive. No renderizar un segundo portfolio ni un botón flotante.

**Criterios de aceptación:** no interferencia con WASD en modo físico, sin movimiento durante modo mouse, volver correctamente al mundo, sin pérdida de foco, estado reiniciado en cada recarga.

## 9. Matriz de contenido para evitar duplicaciones

| Información | Fuente principal | Accesos secundarios permitidos |
|---|---|---|
| Perfil completo | Central Archive | Crew Access solo resumen |
| Proyectos | Central Archive | Tablet solo acceso rápido al Archive |
| Experiencia laboral | Central Archive | Ninguna copia completa |
| Estudios | Central Archive | Crew Access solo grado breve |
| Contacto real | Earth Communications | Archive puede enlazar al puesto, no repetir formulario |
| CV | Archivo real único | Archive + Personal Workstation |
| Estado de la estación | Tactical Table | Tablet puede mostrar objetivo, no panel técnico completo |
| Misiones | Mission Tablet | HUD muestra solo objetivo resumido |

## 10. Orden de desarrollo y reparto

**Ahora, en paralelo:**

- **Codex:** revisar componente compartido de cámara/foco de monitores, resolver problemas 3D y Pointer Lock, asegurar que la misma interfaz React se reutilice. **Una sola tarea concreta por iteración.** No tocar CSS del HUD ni rediseñar las pantallas profesionales.
- **Usuario:** implementar diseño de software de **Central Archive Overview**, revisar en el juego y aprobar antes de hacer Projects. Después avanzar pantalla por pantalla: Projects list → Project detail → Service Record → Education → Earth Communications → Personal Workstation.
- **En conjunto:** validar contenido real del repo y acordar qué fotos y enlaces faltan. Más adelante: Crew Access, Tactical Table, animaciones, modelos 3D y decoración.

### Checklist de cada pantalla

1. Se entiende en 5–10 segundos qué permite hacer.
2. El contenido importante cabe en el monitor enfocado.
3. No hay scroll horizontal; navegación y salida siempre visibles.
4. Botones y atajos funcionan; el foco no se pierde.
5. No duplica información sin motivo.
6. Usa datos reales y links verificados.
7. No altera FPS, cámara ni Pointer Lock al salir.
8. Typecheck, lint, tests relevantes y build correctos.
9. Revisión visual manual por el usuario antes de continuar.

## 11. Pendientes por confirmar

- Títulos exactos, imágenes, URLs y detalles de cada proyecto: tomar del repositorio.
- Nombre oficial y detalle de estudios/empleos: tomar del repositorio.
- Ubicación final y dimensiones de los monitores después del rediseño del puente.
- Estado real del backend de contacto y su protección antispam.
- Disponibilidad de GLB definitivo de CRUZ DEL SUR para la mesa táctica.
- Ruta real del CV y fotografías aprobadas.

**Regla de trabajo:** no implementar todas las pantallas de una vez. Diseñar, programar, probar y aprobar **una pantalla por iteración**.


---

# 12. Anexo visual — diseños de referencia v1.2

> **IMPORTANTE: MOCKUPS, NO DATOS DEFINITIVOS.** Estas imágenes fueron generadas como referencias de composición, jerarquía, contraste y estilo. Algunos textos, nombres, retratos, proyectos, métricas, estados de conexión y modelos espaciales que aparecen en ellas son ficticios o incorrectos. **No copiarlos literalmente.** Toda interfaz final debe estar en **inglés** y usar los datos reales del repositorio. En particular, no usar los nombres inventados de los retratos ni presentar la estación como un modelo 3D ya existente.
>
> Las imágenes **no son pantallas implementadas ni layouts a escala**. Adaptar la densidad al monitor físico enfocado y a su resolución efectiva. El flujo descrito abajo tiene prioridad sobre los elementos inventados por la generación de imágenes.

## 12.1 Central Archive — Overview y expedientes

![Concepto Central Archive](images/central-archive.png)

**Diseño:** navegación lateral compacta, header fijo, panel de identidad profesional, accesos a proyectos destacados y estado de archivo. Eliminar la pestaña **Contact** que aparece en el mockup: el formulario vive en Earth Communications. Sustituir todos los nombres, retratos y títulos ficticios por datos verificados del repo. No presentar CRUZ DEL SUR ni PAMPA-07 como proyectos profesionales a menos que estén registrados como tales.

**Flujo de clics:** `E` en monitor izquierdo (o Quick Portfolio Access desde tablet) → **Overview** → **Projects** → seleccionar tarjeta → **Project Detail** → **Back to Projects**. Desde barra lateral: **Service Record** o **Education**. **Download CV** accesible desde Overview. **Exit** retorna a FPS.

**Vistas:**
1. Overview: nombre, rol, resumen, 3–5 tecnologías, CV, proyectos destacados; sin scroll inicial.
2. Projects: lista de proyectos reales con título, rol, problema y `Open record`.
3. Project Detail: portada si existe, problema, solución, aportes, stack y enlaces verificados; `Back` y opcional `Next`.
4. Service Record: empleos reales, fechas y contribuciones; navegación paginada si es necesario.
5. Education: grados y trabajos académicos reales; evitar datos inventados.

**Estados:** idle físico → focusing → browsing → detail → exiting. Mantener navegación y salida visibles; nada de scroll horizontal ni duplicación del portfolio.

## 12.2 Earth Communications — mensaje real

![Concepto Earth Communications](images/earth-communications.png)

**Diseño aprobado v1.2:** una única pantalla de composición, **sin sidebar, sin Inbox / Sent / Contacts y sin adjuntos**. Formulario centrado y legible con **Name**, **Email** y **Message**; asunto opcional solo si aporta valor, y destinatario fijo mostrado como texto, nunca editable. En el pie, **Skip** a la izquierda (acción secundaria) y **Send Message** a la derecha (acción primaria). El mockup ilustra el aspecto, pero sus campos `To` y `Subject` no reemplazan la validación real del formulario. Mostrar de forma visible que el envío es real y que se aceptan mensajes en inglés, español, italiano o noruego. Un indicador de enlace narrativo no debe presentarse como confirmación de disponibilidad de la API.

**Flujo:** `E` en monitor derecho → formulario con **Name**, **Email**, **Message** → leer aviso **“This sends a real message to the portfolio owner.”** y **“You can write in English, Spanish, Italian or Norwegian.”** → **Send Transmission** o **Skip**.

**Estados:** idle → editing → validating → sending → sent (solo si API confirma) / failed (con reintento). `Skip` → cierre narrativo local, **sin request de red**. Errores inline; no scroll inicial; destinatario fijo en servidor. **Exit** vuelve al FPS.

## 12.3 Personal Workstation — escritorio personal

![Concepto Personal Workstation](images/personal-workstation.png)

**Diseño:** escritorio retrofuturista de iconos, con un tono ligeramente más cálido que Central Archive. El nombre y rol de la persona que aparecen en la imagen son inventados y **deben omitirse o reemplazarse por datos reales**. `Settings` no es una app obligatoria: el sonido y los subtítulos se configuran desde el menú de pausa.

**Flujo:** `E` en computadora posterior → **Crew Desktop** → elegir aplicación por mouse o flechas + Enter → ventana de app → `Back/Close` → escritorio → `Exit` al FPS.

**Aplicaciones v1:** `Crew Dossier.pdf` (abrir y descargar CV real), `Gallery` (solo fotos aprobadas), `Command Terminal` (comandos ficticios en whitelist, como `npm install coffee`). **Opcionales posteriores:** `Notes/Logs`, `Arcade`. Una ventana activa por vez; no recrear todo el portfolio.

**Estados:** desktop → app open → app close → desktop → exiting. Asegurar que el CV pueda obtenerse también en Central Archive.

## 12.4 Crew Access — identificación física

![Concepto Crew Access](images/crew-access.png)

**Diseño:** lector industrial cerca de la entrada, con una tarjeta, estado de escaneo y ficha breve. **El retrato, nombre, identificador, división y nivel de autorización de la imagen son inventados**: no copiarlos. La interfaz final debe caber en el tamaño físico real del dispositivo. No usar este mockup como permiso para agregar una modal gigante.

**Flujo:** apuntar al lector → `E` una vez → animación mano/tarjeta → `SCANNING` → `ACCESS GRANTED` → ficha breve real (foto aprobada, nombre, rol, ubicación, grado verificado) → cerrar. Reabrir muestra ficha sin repetir misión ni diálogo.

**Estados:** idle → scanning → verified → info → idle. Si la pantalla del lector es pequeña, reducir información en vez de forzar scroll.

## 12.5 Tactical Table — holograma opcional

![Concepto Tactical Table](images/tactical-table.png)

**Diseño:** modelo holográfico central, controles de inspección y pequeños paneles de estado. La ilustración muestra una estación espacial, porcentajes, sectores y registros inventados. **No convertirlos en telemetría real.** Usar únicamente estados existentes del juego: energía, puerta, autenticación, contacto y misiones. Si no hay modelo 3D aprobado de CRUZ DEL SUR, usar representación técnica temporal claramente identificada.

**Flujo:** `E` en mesa → cámara enfoca holograma → `Station Overview` → `Docking Bay` (PAMPA-07) / `Systems` / `Mission Log` → rotar o hacer zoom dentro de límites → `Exit` al FPS.

**Estados:** idle rotation → focused → inspecting → exit. No mostrar datos profesionales ni exigir esta interacción para progresar.

## 12.6 Mission Tablet — referencia de interacción

![Referencia tablet y controles — usar solo el panel superior izquierdo como inspiración](images/tablet-reference.png)

**Esta imagen es un collage de referencias anteriores, no un mapa válido del juego.** Usar solo la idea de manos sosteniendo una tablet física. El mapa debe basarse en la geometría real actualizada de CRUZ DEL SUR. Los textos de ejemplo pueden no coincidir con las misiones vigentes.

**Flujo:** `T` levantar → mirar mientras se ve el mundo → `R` activar cursor y detener locomoción → seleccionar objetivo / mapa / historial / Quick Portfolio Access / Skip Tutorial → cerrar cursor y tablet según controles actuales. Quick Portfolio Access abre **la misma instancia** del Central Archive físico.

## 12.7 Contrato de implementación y aprobación

Para cada pantalla, seguir **este orden y detenerse entre pasos**:

1. Definir layout responsive del **software** con datos reales, sin tocar geometría 3D.
2. Implementar navegación y estados del dispositivo en componentes React pequeños.
3. Comprobar manualmente legibilidad desde la cámara física enfocada; corregir escala, padding y scroll.
4. Integrar acciones reales (CV, email, misión) y validar fallos y retorno al FPS.
5. Ejecutar typecheck, lint, tests relevantes y build.
6. **Aprobación visual del usuario** antes de pasar al siguiente dispositivo.

**Orden sugerido:** Central Archive Overview → Projects list → Project Detail → Service Record → Education → Earth Communications → Personal Workstation → Crew Access → Tactical Table. La tablet se mantiene funcional y se retoca de forma independiente.

**Separación de tareas:** usuario: React/CSS y contenido; Codex: integración 3D, foco de cámara, animaciones, colisiones, rendimiento y lógica de juego. No permitir que Codex reconstruya todas las interfaces a partir de una sola imagen.
