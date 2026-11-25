# Mini cocina de estribor e iluminación cálida

Archivo final: `bridge-galley-warm-final.blend`. Fuente: `bridge-port-corner-review.blend`, conservada. Script reproducible: `scripts/assets/build-starboard-galley.py`. Blender rechazó un guardado intermedio por un error de renombrado; el archivo final se guardó con otro nombre.

Módulo compacto junto al arco derecho: mesada, dos puertas con ventilación y tiradores, repisa y recipientes, cafetera con grupo, boquilla, taza y bandeja, radio con antena, dial y rejilla. La esquina izquierda y los estantes personales permanecen en su lugar.

Se copiaron localmente los materiales emisivos de 30 mallas de la sala principal para darles un tono amarillo cálido y limitar su intensidad. Las luces de revisión principales también se calentaron; las pantallas cian y la iluminación exterior se conservaron. Se agregó una luz de área bajo la repisa, marcada para excluirla del export automático.

El script se ejecutó correctamente en Blender. Verifica hash de fuente y transformaciones originales; estos controles no demuestran ausencia de todas las intersecciones. Se revisaron renders general, de detalle y del techo: `galley-room-preview.png`, `galley-detail-preview.png`, `galley-warm-ceiling-preview.png`.

Sólo Blender: no hay integración de nuevos objetos, colisiones o acciones en la app. Falta adaptar luces y hornear materiales al exportar, y medir rendimiento. No se ejecutaron pruebas TypeScript/E2E porque no se modificó código de la aplicación.
