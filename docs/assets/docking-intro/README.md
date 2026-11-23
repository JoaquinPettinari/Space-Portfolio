# PAMPA-07 — aproximación y acople

## Versión actual: entrada circular corta

La intro utiliza `circular-arrival-draft.blend` y el video
`public/video/circular-arrival-intro.mp4`. PAMPA entra por la boca circular corta
aprobada, retranqueada respecto de los motores; dos hojas circulares cierran
la entrada antes del fundido negro. El alojamiento dentro del casco es ficticio,
no un espacio físicamente transitable ni una nueva zona jugable.
El flujo de carga, apertura central y bienvenida conserva su implementación.
Diseño aprobado: [circular-arrival-draft.md](circular-arrival-draft.md).

El archivo y la documentación de acople que siguen se conservan como versión
anterior, sin sobrescribir el maestro original. La regeneración del video actual
está en [video-contract.md](video-contract.md).

## Versión anterior: acople exterior

Maestro independiente: `cruz-del-sur-docking-intro.blend`.
No modifica los archivos de cabina, estantes o la app.

## Revisión en Blender

Elegir la cámara con **Numpad 0** y reproducir con **Espacio** sobre el viewport.
Rango 1–241, 30 FPS, duración 8 segundos. Los marcadores de timeline indican:

- 1: aproximación, PAMPA-07 de 6 m frente al casco existente de unos 60 m.
- 91: alineación y guías encendidas.
- 181: contacto con velocidad axial cero y respuesta de cámara de 2,5 cm.
- 207: abrazaderas cerradas y señal verde de conexión.
- 241: punto de transición a negro que controlará la app.

La cámara es continua. El collar externo se conecta mediante un adaptador de
presión a la esclusa existente: salida Three.js `[0, 1.45, 21.125]`, boca de
contacto `[0, 1.45, 27.5]`. El cuerpo de PAMPA no atraviesa el casco principal.
El adaptador nuevo debe acompañar la futura escena exterior; no está agregado
todavía a la escena jugable. Es una propuesta de hardware para revisar.

Las colecciones separan casco original, nave móvil, adaptador y estudio de cámara
e iluminación. La fuente de PAMPA está copiada como `pampa-07-source.glb`.
Texturas empaquetadas en el blend. La reproducción de la app usa ahora un video
prerenderizado, autorizado para corregir las pausas durante la carga del interior.

## Integración en la app

`docking-motion.json` contiene 241 muestras y eventos en segundos, posiciones
Three.js Y-up y metros. La rotación `pampaYaw` corresponde al giro alrededor de
Y en Three.js. El casco hijo lleva la escala y orientación de importación;
no aplicar estas muestras al GLB fuente sin exportar primero ese montaje.

La app usa `public/video/docking-intro.mp4`: H.264, 1280 × 720, 30 FPS,
8 segundos, aproximadamente 1,27 MiB, sin audio y con índice al principio
(faststart). Se genera desde el maestro, conservando cámara, acople y materiales.
El poster inicial pesa unos 65 KB. Regeneración y metadatos en
[video-contract.md](video-contract.md).
Medición de continuidad y límites: [loading-review.md](loading-review.md).

`App` monta el video antes de importar `Game`/Three. Tras el primer cuadro
presentado y el buffer completo del video, empieza a descargar y montar el interior.
La reproducción depende del reloj nativo del medio, no de un RAF de JavaScript.
Los GLB y muestras del contrato anterior se conservan como recursos de autoría;
no se descargan para reproducir la intro.

Durante la película se mantienen detenidos el frameloop, la generación de
reflejos PMREM y la compilación GPU; las descargas y el montaje continúan.
Al terminar el video, un fundido CSS cubre la pantalla; cuando queda totalmente
negra, se habilita ese trabajo GPU.
`InteriorReady` espera
cuerpos y colliders, compilación de shaders y un dibujo real antes de permitir
la apertura central. El contenedor completo de `Game` permanece invisible hasta
esa apertura, independiente de lo que renderice el canvas. Una vez preparado,
el interior detiene su frameloop mientras termina la película.

Durante la intro, movimiento, interacción, tablet y HUD quedan suspendidos.
Al terminar la apertura se habilita el acceso existente con un clic (Pointer
Lock requiere gesto del usuario) y se encola `arrival` una sola vez por sesión.
Usa el diálogo y subtítulos existentes. El sonido comienza apagado.

Movimiento reducido usa el poster y transiciones breves. Ocultar la pestaña o
suspender el juego pausa video y transiciones. Remontar React conserva el avance;
recargar la página inicia una sesión nueva. Un error de video permite reintentar
o continuar sin intro; un error del interior ofrece recarga y portfolio.

Las pruebas E2E observan reproducción real, cuadros presentados, orden de carga,
visibilidad del interior, carga retenida, errores, movimiento reducido y Pointer
Lock nativo. No generan capturas, videos ni trazas. El asset de video anterior
es parte del producto, no una grabación de QA. La denegación de Pointer Lock por
política del navegador sigue siendo una comprobación manual.

La preparación puede superar los ocho segundos en equipos o redes lentos; en ese
caso permanece la espera opaca hasta estar lista. No se promete un tiempo fijo de
carga ni que un video elimine cualquier limitación del decodificador o de la GPU.

Reproducción del maestro: ejecutar `scripts/assets/build-docking-intro.py` desde
Blender con `__file__` definido. Conservar una copia antes de regenerar si se
editaron keyframes manualmente. El render offline se hace en otra instancia;
no modifica el Blender abierto ni el archivo maestro.

## Validación

`validation.json` registra comprobaciones en los 241 frames: el volumen de PAMPA
permanece dentro del encuadre y conserva al menos 2,44 m de separación axial del
casco original (el adaptador ocupa esa separación). El primer plano contiene el
casco grande completo. Esto verifica volúmenes y trayectoria, no sustituye la
revisión artística de orientación, materiales y contacto del hardware.

Se conserva además `session-recovery-before-open.blend`, una copia de la sesión
completa anterior a abrir el archivo independiente, incluidos los estantes.
El maestro abierto tiene la escena y cámara activas, con texturas empaquetadas.

## Unión estructural del tubo

La colección `03B / Integrated docking foundation` añade una carcasa facetada
que se ensancha sobre el casco de popa y se estrecha hacia el collar. Incluye
bandas estructurales, dos largueros inferiores y soportes diagonales. Conserva
la boca, los keyframes y el eje del conducto original. El generador comparte
esta construcción mediante `refine-docking-mount.py`.

`mount-validation.json` registra el encastre geométrico con las superficies del
casco y la ausencia de obstrucción en el eje central. Las intersecciones son
solapes de montaje deliberados, no una operación booleana sobre el casco fuente.
La revisión visual sigue pendiente del usuario, sin capturas automáticas.
Se guardó `docking-before-integrated-mount.blend` antes de modificar el diseño.

Verificación de esta revisión: typecheck, lint y build correctos; formato de
documentación y `git diff --check` correctos. La suite obtuvo 291 pruebas
correctas y un timeout de 5 s en `transitionAssets.test.ts`, sin cambios en ese
sistema. Su repetición aislada pasó las dos pruebas en 2,54 s. No se oculta el
timeout ni se modifica su límite para esta edición de Blender.

La regeneración produce un blend de biblioteca: seleccionar su escena y guardar
como archivo de trabajo si Blender lo abre inicialmente sin escena activa.
