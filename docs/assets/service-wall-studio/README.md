# Estudio independiente de la pared técnica

Abrir `service-wall-design.blend` y editarlo directamente. Contiene la revisión
artística de la pared basada en la referencia. Todavía no reemplaza el activo del
juego.

- `01 / Editable wall`: piezas de la pared a escala métrica, con materiales y
  modificadores editables, sin agrupar por material como el GLB de producción.
- `02 / Preview lighting - not for export`: cámara y luces para revisar volúmenes.
- `03 / Reference - not for export`: imagen del usuario empaquetada en el archivo.

La pared se centró para trabajar cómodamente. Al integrar de nuevo, sumar
`(4, -15.285, 0)` en coordenadas Blender; el dato también está en la escena.
Las luces de estudio no representan exactamente las luces del navegador.

El archivo original y la sesión abierta se conservaron. El script
`scripts/assets/create-service-wall-studio.py` sólo prepara esta base y rechaza
sobrescribir un diseño existente: no debe regenerarse después de editarlo.

## Revisión artística

El estudio usa pintura grafito, cobre, metal mecanizado, cuero marrón y goma,
con variaciones de rugosidad y microrrelieve. Los paneles tienen perímetros
escalonados y chaflanes; las tuberías incorporan codos y uniones. Se añadieron
herrajes, correas, costuras, vegetación colgante e instrumentación más legible.
Las luces prácticas cálidas sustituyen el relleno azulado de la base.

`studio-baseline.png` conserva la base inicial, `studio-refined.png` la primera
pasada y `studio-final.png` la revisión final desde la misma cámara de estudio.
El respaldo anterior al trabajo es
`service-wall-before-refinement.blend`.

Los materiales procedurales de Blender requieren preparar texturas compatibles
con glTF antes de integrar el diseño. El render de estudio no demuestra el
resultado ni el rendimiento en Three.js. La integración debe comprobar ambos,
conservando colisiones e interacciones separadas.
