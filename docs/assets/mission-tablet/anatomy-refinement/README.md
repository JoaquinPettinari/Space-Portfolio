# Revisión del guante — 2026-11-20

`front.png` y `side.png` revisan el maestro de manos enlazado dentro de la tablet, con la misma iluminación de los pases anteriores. `before-front.png` y `before-detail.png` conservan el estado previo. `hand-profile.png` corresponde a la primera iteración de este pase; no usarla como evidencia final.

La piel conecta palma, raíces de los dedos y base del pulgar. Los dedos mantienen separación por encima de la unión interdigital. Las costuras se agrupan en una malla por mano y siguen el rig. La pose de tablet está más cerrada; los anclajes de montaje conservan su posición e inclinación.

Los informes y las pruebas de deformación están en `../../astronaut-hands/`. La pinza todavía requiere ajuste contra el espesor real de la tarjeta. Las poses son estáticas: no son animaciones completas de alcance, contacto y retirada. Tampoco se ha integrado esta malla de autoría en la app.

Comprobaciones de la app ejecutadas durante este pase: typecheck, lint y build correctos; 267 pruebas pasaron y `furnishingsAsset.test.ts` agotó su límite de 5 segundos durante los renders, también en una primera repetición aislada. Al terminar los procesos de render, la repetición aislada pasó con el límite original. No se modificó esa prueba ni se aumentó su límite. El chequeo global de formato conserva los tres avisos previos en archivos ajenos; los documentos modificados de este pase cumplen formato.
