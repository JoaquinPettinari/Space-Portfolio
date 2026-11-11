# Puente compacto — revisión aprobada

Se acorta el tramo lateral entre Z=0.4 y el comienzo de las diagonales: antes Z=-6, ahora Z=-3. Profundidad 3.4 m; longitud real inclinada 3.437 m (sqrt(3.4² + 0.5²)). El puente mide 9.6 × 10.5 m, desde Z=5.1 hasta Z=-5.4.

La consola, sillas, monitores, controles centrales y cubierta exterior se desplazan +3 m en Z. Monitores: X=±2.379289, Y=1.65, Z=-3.729289, con orientación interior de ±45°. El foco normal 16:9 queda en X=±1.634821, Y=1.65, Z=-2.984821; se sigue calculando según el aspecto de pantalla. La mesa, entrada y servicios traseros conservan sus posiciones.

Piso, paredes, techo y sus colisiones comparten el contorno actualizado. El mapa y los focos se derivan de los mismos datos. Se conservan alturas y cantidad de paneles/instancias; no se añaden luces ni assets. La luz exterior existente conserva su posición, todavía por encima de la cubierta frontal.

Validación: typecheck, lint y build correctos; 16 pruebas unitarias correctas (bridgeLayout, commandLayout, roofFrames y station). E2E: Archive físico con descarga y Pointer Lock, Communications con Skip/validación/reintento y circulación completa de proa correctos. El recorrido agotó 180 s en su primera ejecución al regresar; la repetición aislada pasó en 2.7 min. No se modificaron sus aserciones ni su límite de tiempo para obtener el resultado. El chequeo global de formato conserva cuatro avisos previos en documentación de assets y especificación; los archivos modificados están formateados. El build mantiene el aviso previo de tamaño del chunk Game. La apariencia, proporciones percibidas y comodidad final quedan para revisión manual del usuario; no se generan capturas ni videos.
