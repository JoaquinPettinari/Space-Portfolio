# Entrada circular — borrador para aprobación

Estado: **forma exterior corta e interior aprobados para integración**. Se conserva
la geometría aprobada y se entrega su animación como video prerenderizado:
`public/video/circular-arrival-intro.mp4`, con poster independiente. El flujo
de carga de la app no cambia. Metadatos: `circular-arrival-video-export.json`.

El usuario rechazó el hangar rectangular por ser demasiado grande. Esta variante
parte del maestro circular original y conserva su silueta: ampliar sólo lo
necesario la boca, permitir la entrada completa de PAMPA y cerrar con una
compuerta redonda sencilla. Sin habitaciones jugables ni cambios del flujo de carga.

Archivo de autoría actual: `circular-arrival-detailed.blend`. La base aprobada
`circular-arrival-draft.blend` se conserva. El exportador no modifica el maestro.

## Integración estructural y mecanismo

`scripts/assets/detail-circular-arrival.py` deriva la versión detallada desde
`circular-arrival-polished.blend`, sin modificar la fuente. Agrega seis refuerzos
laterales apoyados sobre el casco mediante consultas de superficie y travesaños
que siguen la base. Dos actuadores telescópicos unen puntos fijos de la estructura
con anclajes de las hojas: su orientación y extensión siguen la animación real.

Las marcas `DOCK / 01` identifican las hojas. El aro y los indicadores pasan
suavemente de verde (sellado) a ámbar (maniobra), cian (paso libre) y de vuelta a
ámbar/verde al cerrar. No hay parpadeos. Se conservan por comparación de matrices
los 240 cuadros de cámara, PAMPA y hojas; también resolución, duración y muestras.
El mecanismo conserva 40,7 cm de margen lateral al paso de PAMPA y la cola está
33 cm dentro antes de iniciar el cierre. La validación queda en
`circular-arrival-detailed-validation.json`.

Validación adicional: separación mínima de 14 cm entre actuadores y el volumen
conservador de PAMPA durante toda la secuencia, incluido el cierre. Se revisaron
seis renders. Pasaron 22 pruebas unitarias de intro y dos E2E nativos (reproducción,
transición/controles y movimiento reducido), con 240 cuadros presentados, cero
perdidos y ninguna pausa inesperada. `typecheck`, `lint` y `git diff --check`
pasaron; formato global con los tres avisos previos indicados abajo.
El MP4 mantiene ocho segundos a 1280 × 720 y ocupa 1.070.489 bytes, sólo 13.297
bytes más que la revisión pulida. No se agregan recursos de render al juego.

## Pulido de materiales, luces y movimiento

La revisión `circular-arrival-polished.blend` deriva de `circular-arrival-timed-doors.blend`
mediante `scripts/assets/polish-circular-arrival.py`, conservando ambas fuentes.
La entrada recibe materiales propios de titanio y grafito azulado, variación fina
de rugosidad, paneles de refuerzo y tornillos. Las luminarias cálidas empotradas y
el relleno frío del túnel se renderizan offline; no añaden luces a la escena web.
La entrega utiliza 32 muestras para reducir ruido en los reflejos del metal.

Las hojas se separan axialmente 18 cm del sello en los cuadros 30–36, giran entre
36–66 y permanecen abiertas hasta 187. Cierran entre 187–222 y se asientan entre
222–230. Las curvas de giro y desplazamiento suavizan velocidad y aceleración
en sus extremos, sin rebote ni desaparición de geometría. Se conservan la cámara,
la ruta de PAMPA, los ocho segundos y el solape de cierre de la revisión anterior.

Validación del pulido: 240 cuadros, cámara/ruta comparadas con la fuente intacta,
paso de PAMPA entre 91–161, margen lateral de 26,7 cm incluyendo actuadores y
cola despejada 33 cm antes del cierre. Se revisaron seis cuadros renderizados.
Pasaron las 22 pruebas unitarias de intro y los dos E2E nativos de reproducción,
transición/controles y movimiento reducido. El video presentó 240 cuadros sin
pérdidas ni pausas inesperadas. Entrega: 1.057.192 bytes, frente a 1.466.971 de la
revisión anterior, sin cambiar duración ni resolución. `typecheck` y `lint`
pasaron; el formato global mantiene los tres avisos ajenos listados abajo.

## Revisión de cámara y compuertas — 24 de noviembre

La cámara termina más lejos, con contexto del casco y focal constante de 36 mm.
Las hojas conservan su mecanismo articulado y permanecen visibles durante todo
el recorrido: no se animan su escala, transparencia ni visibilidad. Abren en los
cuadros 30–66, permanecen abiertas hasta el 187 y cierran entre 187–225; los
últimos quince cuadros muestran el cierre completo. El paso de PAMPA queda
dentro del intervalo abierto, comprobado en el script de autoría.

El radio de cada hoja aumenta de 1,70 a 1,79 m para solapar el borde de la boca;
una lengua posterior de 7,5 cm sella la junta central. Se añaden apoyos de
bisagra y se reduce el bisel para evitar la ranura luminosa del cierre anterior.
Reproducción: `scripts/assets/refine-circular-arrival.py` sobre la base aprobada;
evidencia en `circular-arrival-timed-validation.json` y `circular-timed-review-*.png`.

Verificación: seis cuadros revisados visualmente y validación de 240 cuadros;
22 pruebas unitarias de intro y dos E2E nativos pasaron (reproducción/transición/
controles y movimiento reducido). La reproducción presentó 240 cuadros, cero
perdidos y ninguna pausa inesperada. Pasaron `typecheck`, `lint` y `build`.
`format:check` mantiene únicamente tres avisos previos en los JSON de
`cabin-master/assembly`, `chairs-plants-refinement/audit` y
`consoles-orbit-refinement/audit`, ajenos a esta revisión.

## Diseño aprobado anterior

Se recortó el saliente longitudinal 2,5 m, conservando el diámetro útil de 3,4 m.
La compuerta cerrada queda 40,2 cm retranqueada del borde de los tres motores.
Dos mitades circulares abren hacia afuera. El cuadro 90 muestra la entrada;
el archivo abre en el 240, con la puerta cerrada, para revisar el largo.
La versión anterior se conserva en `circular-arrival-before-shortening.blend`.

El estacionamiento continúa ficticiamente dentro del casco, como autorizó el
usuario. La validación de 240 cuadros mantiene comprobaciones de paso radial,
puertas y encuadre; registra 14 polígonos internos intersectados por el volumen
recorrido. No se presenta este alojamiento como físicamente libre ni jugable.
Las vistas exteriores de entrada y cierre se revisaron sin observar piezas
asomando por techo o ventanas. El maestro original permanece intacto y no se
generó otro MP4 durante la revisión; la integración posterior usa la versión aprobada.

Integración interior aprobada: mostrar sólo la punta de PAMPA
detrás del visor de la esclusa, mediante un GLB recortado y estático que use las
luces existentes. Medir carga y fluidez al integrarlo; no importar la escena
cinemática completa ni asumir que tapar el resto del modelo evita su descarga.
