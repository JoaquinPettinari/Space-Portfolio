# PAMPA desde el visor — revisión en Blender

Estado: **vista interior aprobada e integrada**. Se conservó el diseño exterior
circular corto aprobado. La punta se exportó por separado y se validó en la app;
ver [contrato y comprobaciones](pampa-interior-runtime.md).

Archivo independiente: `pampa-interior-review.blend`. Usa la cabina existente
como contexto y muestra únicamente la punta de PAMPA detrás del visor de la
puerta fija. Se conserva separación entre vidrio y nave, con parte de la esclusa
visible alrededor. Dos cámaras permiten revisar la vista frontal y oblicua.

La punta debe ser geometría recortada del modelo original, conservando sus
materiales y UV. No usar una segunda escena renderizada en el vidrio ni cargar
la nave completa para esconder la mayor parte. La revisión Blender conserva
el contexto completo, mientras el recurso del juego contiene solo la punta.

La revisión conserva 55.311 triángulos de los 258.560 del modelo original
(78,6 % menos), con los materiales y UV originales. La punta queda a 1,085 m
del plano del vidrio. Se reutilizan la iluminación y el vidrio de la cabina.
El frente circular mecánico pertenece al modelo de PAMPA original.

Esta reducción de geometría no es una medición de rendimiento de la app.
Los archivos originales de cabina y exterior se verifican mediante SHA256
en `pampa-interior-validation.json`. Las imágenes frontal y oblicua permiten
revisar la composición que dio origen a la integración.
