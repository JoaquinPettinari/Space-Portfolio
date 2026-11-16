# Cierre del hombro derecho de llegada

El mamparo frontal del GLB une `(3.55, 3.52)` con `(5.10, 1.90)`,
pero el hombro del casco incluye un vértice intermedio en `(5.10, 2.65)`.
El espacio entre ambos perfiles dejaba ver el fondo desde el punto de inicio.

`EntryAirlock` agrega un cierre triangular de 6 cm de espesor detrás del
mamparo existente. Usa el color, la rugosidad y la metalicidad de
`UNIFIED / Graphite ceramic`. Son ocho triángulos y una llamada de dibujo;
no hay nuevas luces, texturas, colliders ni actualizaciones por cuadro.
La geometría propia se libera al desmontar.

El cambio se limita al juego. No se reexportaron los GLB ni los detalles nuevos
de Blender. Puertas, física, ventanas y pasillo mantienen sus datos existentes.

La prueba `arrivalShoulderClosure.test.ts` reproduce tres rayos que escapaban
por la abertura desde el inicio y verifica que el paso central quede libre.
`before.png` y `after.png` documentan la revisión en el navegador local.

Verificación: cuatro pruebas pertinentes, TypeScript y build completados.
Playwright confirmó el cierre desde el inicio con Pointer Lock real y sin
excepciones de JavaScript. El inventario del mismo encuadre pasa de 169 a 170
draw calls y suma ocho triángulos. Esto no es una medición de FPS en hardware real.
El chequeo global de formato señaló únicamente dos informes JSON anteriores
en `chairs-plants-refinement` y `consoles-orbit-refinement`; se conservaron.
