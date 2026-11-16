# Presencia de tripulación — 2026-11-16

La tablet conserva sus modos de lectura caminando y foco con cursor, con carcasa
reforzada, indicadores cálidos y guantes redondeados con dedos, pulgar y puños.
La interfaz usa acabados CSS estáticos sin filtros animados.

CrewMirror usa un render target de512×288 a un máximo de10Hz, únicamente cerca
del espejo y mirando hacia él. El astronauta se dibuja en una capa exclusiva de
la cámara reflejada; no obstruye la vista ni las interacciones del jugador. Es
una primera representación procedural del traje, no un personaje riggeado ni
animado para multijugador. La cámara refleja posición/orientación y recorta la
geometría detrás del espejo. Los recursos GPU se liberan al desmontar. El
montaje tiene collider fijo y no invade el recorrido central. No se agregan
luces, sombras ni postprocesado. El coste del reflejo es adicional y no se
prometen60FPS constantes mirándolo.

Se retiran Arrival systems online y Open mission tablet del listado visible.
Los cuatro objetivos restantes tienen contadores compartidos; se conservan
banderas internas de iluminación y tablet para mantener entradas y puertas.

La llegada incorpora dos rejillas de servicio instanciadas, con relieve,
tornillos y marcas ocres. El filtro original tapado todavía requiere identificar
sus triángulos en el GLB agrupado; añadir rejillas no equivale a corregirlo.
Hay tres inserts personales ARRIVAL_MEMORY_01/02/03 en el modelo refinado.
Se preparó public/photos/personal/ para recibir fotos; no se inventaron fotos
personales ni se reemplazaron los inserts actuales sin imágenes.

Validación:219 pruebas unitarias en63 archivos correctas; prueba de navegador
con controles y Pointer Lock reales, subida/bajada de tablet, compilación GPU
sin errores; recorrido unificado de puerta bloqueada/abierta, colisiones de
bahía y retorno correcto. Capturas mirror.png y tablet.png. El reflejo se revisó
visualmente y se adelantó su montaje para evitar una puerta de armario.

Las expectativas de contadores E2E se actualizaron a cuatro. Los flujos antiguos
de station/journey que esperan un interruptor inicial o progreso vacío al
refrescar siguen siendo deuda previa; no se ejecutaron como si estuvieran
actualizados. La suite funcional unificada sí se ejecutó.

La muestra con el espejo visible (180 cuadros,1280×720) registró22,997ms de
media y36,8msP95. Se ejecutó durante las comprobaciones de build/lint del mismo
equipo: no es una comparación aislada ni prueba de60FPS. El espejo agrega una
pasada real; falta una medición aislada larga antes de considerar cerrado su
presupuesto. El recorrido habitual deja de actualizarlo al mirar hacia otro lado.
Typecheck, lint y build finales correctos; build conserva el aviso previo de
chunk grande. Formato: solo quedan los dos informes antiguos de Blender, tras
formatear mirror-timing.json. Diff sin errores de whitespace.
