# Cocina en L: revisión Blender

Archivo final: `bridge-galley-l-review.blend`. Script: `scripts/assets/extend-galley-l.py`, sobre `bridge-galley-warm-final.blend`. Fuente conservada por hash.

La mesada se prolonga lateralmente hasta Y=0.05, antes de la planta y el puesto existente. Incluye dos puertas adicionales, bandeja y recipientes. Las 20 piezas de la radio se trasladaron mediante una transformación rígida y se giraron hacia el pasillo. Esto prepara su accesibilidad visual; no implementa una interacción en la app.

Se agregaron cierres opacos traseros y laterales, tapajuntas, cornisa y paneles superiores. La pared trasera se amplió detrás del estante para cerrar la ranura observada en el primer render. Se comprobaron 20 rayos sobre la pared posterior; resultados en `galley-l-validation.json`. No es una prueba exhaustiva de toda la estructura.

Iluminación: luz cálida suave sobre la mesada, rebote bajo el lateral, mayor superficie de luz bajo la repisa y menor intensidad del relleno azulado de la ventana. Luces nuevas marcadas como excluidas del export automático.

Script ejecutado en Blender, revisión visual cercana y general (`galley-l-preview.png`). No se modificó la app; integración, colisiones, alcance de interacción y FPS pendientes. No se ejecutaron pruebas TypeScript ni E2E para este cambio de assets.
