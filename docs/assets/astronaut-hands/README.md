# Manos reutilizables — maestro Blender

`astronaut-hands.blend` contiene dos colecciones para enlazar: `HAND / Left` y `HAND / Right`. Cada colección contiene su armature, superficie con pesos, refuerzos y anclajes. El estudio `PREVIEW / Studio - not for export` es independiente.

- Unidades: metros. Origen local: muñeca. Dedos hacia +Z, manga hacia −Z, dorso visible hacia −Y.
- Los rigs `HAND_RIG.L` y `HAND_RIG.R` tienen 17 huesos cada uno. La piel continua `HAND_SURFACE.L/R` usa aproximadamente 18.600 vértices por mano, pesos normalizados y como máximo cuatro influencias por vértice; `HAND_SLEEVE.L/R` conserva la manga anterior. Las piezas de refuerzo y el hilo también siguen el rig.
- Para la tablet, usar los anclajes `GRIP_LEFT` y `GRIP_RIGHT` de su maestro; su posición e inclinación están registradas en `../mission-tablet/tablet-contract.json`. El pulgar izquierdo apunta hacia +X y el derecho hacia −X en el espacio local del rig.
- La pose inicial queda congelada en las rotaciones del rig, sin acción activa: las instancias enlazadas muestran `tablet_hold`. Las acciones se conservan con usuario permanente.

## Poses

Cada mano tiene `neutral.L/R`, `tablet_hold.L/R`, `card_pinch.L/R` y `radio_press.L/R`. Son **poses clave estáticas**, con claves iguales en los cuadros 1, 15 y 30; todavía no son gestos con entrada, contacto y retirada temporizados.

Para editarlas, trabajar sobre la colección original o crear una copia local/Library Override. Asignar la acción correspondiente al rig y actualizar el cuadro. `FINGERTIP_INDEX.L/R` sigue la punta del índice; `CARD_PINCH.L/R` sigue la punta del pulgar y sirve de referencia para alinear una tarjeta. No son colisionadores.

La pinza acerca las puntas óseas a 12,8 mm, pero eso **no demuestra contacto de la piel**. La revisión de la piel nueva encuentra unos 8,3 mm entre las muestras más distales: queda pendiente calibrarla con el espesor y la posición de la tarjeta al hacer su animación. La pose de radio mantiene extendido el índice y dobla los otros dedos. El encaje exacto y el recorrido final dependen del tamaño/posición del objeto de cada interacción.

## Validación y límites

`anatomy-validation.json` registra la estructura y los pesos actuales. `anatomy-pose-review.json` registra puntas óseas, muestras de piel evaluada y estiramiento de aristas en las cuatro poses. Los reportes `validation.json`, `contact-validation.json`, `pose-validation.json` y `natural-fingers-validation.json` son evidencia histórica de los pases anteriores, no validación de la piel actual.

Los materiales incluyen tejido procedural, goma, refuerzos, manga marfil, acentos naranja y señal cian. La exportación de interacción hornea el tejido y conserva la geometría articulada; el contrato y las limitaciones están en [RUNTIME_EXPORT.md](RUNTIME_EXPORT.md). La reducción posterior de densidad requiere medir el coste real en la app.

El generador `scripts/assets/build-astronaut-hands.py` solo crea un maestro nuevo y rechaza sobrescribir uno existente. Los scripts de esta carpeta documentan los pases posteriores. `refine-and-validate.py`, `freeze-default-pose.py` y `finalize.py` son pases de autoría ya aplicados, no comandos idempotentes para regenerar automáticamente. No ejecutarlos sobre futuras ediciones sin revisar su alcance. `render-poses.py` genera vistas sin guardar modificaciones del maestro.

## Refinamiento de dedos y agarre

### Piel continua y costuras — 2026-11-20

`scripts/assets/polish-hand-anatomy.py` crea una piel cerrada y continua para palma, raíces de dedos y volumen del pulgar. La sección del pulgar sigue su eje inclinado. Mantiene cuatro dedos separados por encima de las raíces; la comprobación de componentes evita soldaduras accidentales que producirían membranas al flexionar.

Los pesos se calculan por el eje de cada dedo, se suavizan localmente en las raíces y se normalizan con un máximo de cuatro influencias. La deformación conserva volumen. No se usa transferencia por proximidad a vértices de dedos vecinos. La manga conserva su malla y materiales; el panel dorsal sigue la superficie y las puntadas finas de panel, dedos y manga se agrupan en `HAND_STITCHING.L/R`.

Los refuerzos de falange se proyectan por vértice sobre la piel y reciben los pesos interpolados de la cara correspondiente. Sus bordes cosidos siguen el mismo campo de deformación; ya no son placas rígidas de un solo hueso. La revisión de poses mide también la separación entre refuerzo evaluado y piel para detectar solapas al flexionar.

Solo cambió la pose `tablet_hold`: MCP, PIP y DIP se ajustan para cerrar el agarre y devolver las puntas hacia el respaldo de la tablet. Neutral, tarjeta y radio conservan sus rotaciones en los cuadros 1, 15 y 30. Eso conserva las poses, pero no sustituye la revisión de la piel deformada: `review-anatomy-poses.py` registra además los vértices evaluados, incluidas las instancias de colección.

El respaldo previo al pase es `astronaut-hands-before-anatomy.blend`; `astronaut-hands-anatomy-v1.blend` conserva la primera iteración para trazabilidad y **no es una entrega válida** (tenía uniones no deseadas entre dedos). El script rechaza aplicarse sobre una escena que ya tenga este pase. La malla actual es de autoría: exportación, retopología/LOD y medición de coste en la app quedan pendientes. No se afirma que la densidad actual sea óptima para producción.

### Materiales textiles

`scripts/assets/refine-hand-textiles.py` reemplaza los nodos experimentales acumulados por una trama cruzada a escala local, microrelieve y variación suave de rugosidad. Guante grafito, refuerzos densos, manga marfil, cinta naranja e hilo tienen acabados diferenciados no metálicos. Conserva los materiales del instrumento de muñeca. Las texturas procedurales requieren horneado para glTF.

`textile-validation.json` verifica mediante firma que geometría, pesos y pose no cambian en este pase. El respaldo es `astronaut-hands-before-textiles.blend`. Las vistas del conjunto y del detalle están en `../mission-tablet/textile-refinement/`; se generan con `review-tablet-grip.py -- textile-refinement`, sin cambiar luces para favorecer la comparación.

`scripts/assets/refine-hand-shape.py` sustituye los refuerzos rectangulares por piezas acolchadas de contorno redondeado, alineadas con cada falange. Afina las secciones de los dedos, redondea las puntas y adapta costuras a las superficies del dorso y de la manga. El respaldo del guante es más delgado y curvo. Se conserva el esqueleto y sus nombres.

La pose `tablet_hold` usa una flexión distinta por dedo y acerca las puntas al respaldo de la tablet: el índice pasa de Y local 0,0588 m a 0,0155 m. Esto es una referencia geométrica del agarre, no una simulación física de presión. El ajuste final se revisa con las instancias montadas en la tablet.

El archivo `astronaut-hands-before-natural-fingers.blend` conserva el estado anterior. `natural-fingers-validation.json` registra pesos y posiciones; `validate-preserved-poses.py` compara las rotaciones de todos los huesos de las poses neutral, tarjeta y radio en los cuadros 1, 15 y 30 con ese respaldo. No guarda cambios sobre el maestro. Las imágenes `hands-natural-front.png` y `hands-natural-side.png` muestran la nueva forma.

### Animaciones de interacción

`hand-gestures.blend` contiene las escenas de elevar/bajar la tablet, presentar la credencial y pulsar la radio. Enlaza la geometría del maestro y conserva las poses estáticas originales. La guía [GESTURES.md](GESTURES.md) detalla reproducción, tiempos compartidos con la app, calibración de contacto y límites de integración.

La app consume `public/models/cruz-del-sur-hand-interactions.glb`, generado desde
estos maestros sin modificarlos. Contiene los cuatro clips, los anclajes de
contacto y los atlas textiles. `runtime-export.json` registra el tamaño y los
hashes de origen; `runtime-validation.json` comprueba la animación exportada con
Three, incluida la posición de la piel deformada durante la pulsación.
