# Fondo violeta — revisión Blender

Archivo: `asterion-violet-review.blend`, derivado de
`asterion-expanse-v3-traffic.blend`, conservado intacto.

La referencia guía la paleta índigo, violeta y lavanda, el protagonismo del
planeta con anillos y la iluminación lateral. Se conserva la estructura del
cielo existente y se remapea su color mediante nodos; no es una reproducción
literal de las nubes de la referencia. Las texturas originales no cambian.

Nacre tiene más presencia angular, bandas atmosféricas más irregulares,
una mitad nocturna marcada y anillos más rasantes de tonos perlados.
Se elimina de su shader la mancha ovalada demasiado dura de la revisión previa.
Los anillos conservan sus huecos físicos y dispersión translúcida. Vesper
permanece oculto, conforme a la composición de tráfico aprobada.

Reproducción: ejecutar `scripts/assets/review-violet-cosmos.py` sobre el archivo
fuente. `violet-review-validation.json` registra su hash y la versión de salida.
Se revisaron vistas frontal y trasera con Cycles, 16 muestras: previews
`violet-front-preview.png` y `violet-rear-preview.png`. No se revisaron aún
todas las ventanas en contexto ni se midió coste GPU de esta variante.

La app conserva el fondo anterior. Esta propuesta necesita aprobación visual,
exportación de materiales/texturas y validación en navegador antes de integrarse.
