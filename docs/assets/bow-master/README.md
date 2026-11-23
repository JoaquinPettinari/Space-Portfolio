# Maestro editable de proa

## Tercera pasada: asientos y consolas

Respaldo: `before-seats-consoles.blend`. La colección
`12 Seat ergonomics and console hardware` añade apoyacabezas con soportes,
inserciones lumbares cosidas, almohadillas de apoyabrazos, palancas de ajuste y
carcasas ventiladas a los cuatro asientos. Los marcos de cinco pantallas tienen
protectores, tornillos cautivos, ventilación y conectores de servicio.

Las superficies originales de apoyo se comprobaron mediante rayos sobre su
geometría para asentar los apoyabrazos y el soporte lumbar. Se conservaron los
ocho anclajes y las áreas de pantalla. `seats-consoles.json` registra 234 objetos
(incluidos grupos y curvas) y 55.244 triángulos adicionales evaluados. Los
biseles de este maestro artístico deberán simplificarse o trasladarse a mapas
cuando se prepare la exportación, con mediciones antes de integrar.

Se revisaron vistas cercanas de ambos lados del asiento y de los marcos. No se
modificaron manos, tablet, tarjeta, radio ni el código del juego en esta pasada.

## Segunda pasada: piso, consolas y marcos

`before-detail-pass.blend` conserva el estado previo. La nueva colección
`11 Deck consoles and window detailing` contiene placas desmontables con juntas,
superficies antideslizantes, fijaciones, cantos de consola y marcos con burletes,
rebajes y retenedores. Los cinco paños de vidrio mantienen sus posiciones.
Los materiales separan goma, titanio satinado, bronce y difusores cálidos.
Se añadieron dos luces de estudio para iluminar las consolas desde las ventanas.

`detail-pass.json` registra 302 objetos y 50.728 triángulos evaluados adicionales.
Los ocho anclajes permanecen intactos y el detalle de piso no supera 2,05 cm.
Se retiraron 24 piezas de los tiradores iniciales sustituidos por las placas;
sus bordes dejan libre el canal luminoso existente.
Este es el maestro de arte: todavía falta preparar y medir una exportación para
el juego. Los cambios no se han aplicado al runtime.

## Recorrer el interior en Blender

El archivo abre con la vista libre dentro de la proa, separada de las cámaras.
Con el cursor sobre la vista 3D: **F3 → Walk Navigation** (o Navegación de paseo).
Moverse con WASD y mirar con el mouse. E/Q suben y bajan si la gravedad está
desactivada; Tab alterna la gravedad. La rueda ajusta la velocidad, Shift acelera
y Alt permite desplazamiento lento. Clic confirma, Esc cancela.

Numpad 0 alterna la cámara. Para recorrer sin modificar una cámara preparada,
salir primero de su vista. Las cámaras `Deck inspection` y `Console and window`
permiten revisar de cerca el detalle, además de las dos vistas generales.
Referencia: [manual de navegación de Blender](https://docs.blender.org/manual/en/latest/editors/3dview/navigate/walk_fly.html).

`bow-master.blend` separa el centro de mando de la fuente unificada existente.
Primera pasada de autoría: no modifica modelos públicos ni el runtime.

## Organización

- Envolvente de presión y vidrio panorámico, conservados desde la fuente nativa.
- Piso y techo; consolas; asientos; detalles interiores en colecciones separadas.
- Corredor de vidrio como referencia, excluido de futuras exportaciones de proa.
- Detalles nuevos: cassettes de luminarias, difusores, abrazaderas, paneles de
  mantenimiento, ventilación, fijaciones y tiradores enrasados. Grano fino del
  metal aplicado al material existente del piso.
- Ocho anclajes de interacción y pantallas de previsualización, separados y
  excluidos de exportación. Las pantallas de Blender son imágenes estáticas.
- Luces y cámaras de estudio separadas; no representan luces nuevas del juego.

La fuente `../unified-ship/cruz-del-sur-interior-panels.blend` permanece intacta;
`assembly.json` conserva su SHA256 y la procedencia de cada objeto. Algunos
equipos de la fuente están agrupados por material y aún requerirán separación
local para modificar piezas individuales. No se trata de una malla única.

## Contrato de posición

Metros. Runtime `(x,y,z)` equivale a Blender `(x,-z,y)`. El maestro ya está en
coordenadas mundiales: no sumar de nuevo el desplazamiento del puente −3,15 m.
Huella de proa: Z −8,55…1,95; transición Z 2,1…5,1; corredor Z 5,1…11,2.
La abertura de conexión mantiene 2,68 m de ancho y 2,5 m de alto.
`validation.json` registra los ocho anclajes y el inventario final.

Radio y cafetera tienen anclajes reservados: su geometría y lógica procedurales
siguen siendo responsabilidad del runtime. La mesa táctica y monitores conservan
su espacio para superficies dinámicas. No se han cambiado colisiones ni reglas.

## Revisión y siguientes exportaciones

`bow-forward.png` y `bow-aft.png` son renders de revisión, no capturas del juego.
Se comprobó la presencia de los 51 objetos del corredor y ocho anclajes, se
retiraron 17 mallas vacías heredadas y se contabilizaron 338.033 triángulos
incluyendo referencias y previsualizaciones. No es un presupuesto de runtime.

`bow-master-initial.blend` conserva el ensamblado previo al ajuste final de
materiales y anclajes. El generador `scripts/assets/build-bow-master.py` rechaza
sobrescribir un maestro existente. Las revisiones siguientes se hacen sobre el
archivo maestro; `finish-bow-master.py` registra la primera pasada y
`render-bow-master.py` genera las dos vistas sin guardar cambios al documento.

Antes de integrar: excluir referencias y displays estáticos, convertir los
materiales procedurales a mapas, conservar las interfaces dinámicas y verificar
coste, colisiones y movimiento real. Esta pasada sólo se validó como arte en
Blender; no requiere pruebas de aplicación porque no cambia su código ni assets.
