# Entrada circular — borrador para aprobación

Estado: **forma exterior corta e interior aprobados para integración**. Se conserva
la geometría aprobada y se entrega su animación como video prerenderizado:
`public/video/circular-arrival-intro.mp4`, con poster independiente. El flujo
de carga de la app no cambia. Metadatos: `circular-arrival-video-export.json`.

El usuario rechazó el hangar rectangular por ser demasiado grande. Esta variante
parte del maestro circular original y conserva su silueta: ampliar sólo lo
necesario la boca, permitir la entrada completa de PAMPA y cerrar con una
compuerta redonda sencilla. Sin habitaciones jugables ni cambios del flujo de carga.

Archivo de autoría: `circular-arrival-draft.blend`. Las versiones anteriores
se conservan. El exportador no modifica este maestro.

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
