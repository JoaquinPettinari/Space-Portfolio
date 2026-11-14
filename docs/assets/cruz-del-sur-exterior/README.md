# Cruz del Sur — exterior de referencia

Fuente editable creada en Blender a partir de la imagen facilitada por el usuario.
Se interpretaron popa, vientre y costado opuesto, que no aparecen en esa vista.
Es una versión modelada con detalle, no una reproducción fotográfica exacta.

## Archivos

- `cruz-del-sur-exterior.blend`: archivo de trabajo final, también abierto en Blender.
- `before-exterior-work.blend`: copia de seguridad del estado recibido, incluidos los cambios sin guardar.
- `before-precision-pass.blend`: copia de la versión aceptada antes de afinar detalles.
- `cruz-del-sur-detail-pass.png`: vista actual de 1800 × 1000, con el fondo espacial oculto.
- `cruz-del-sur-closeup.png`: toma cercana de paneles, tornillos y vidrios, de 1600 × 1000.
- `cruz-del-sur-hero.png`: render anterior con el planeta de presentación.
- `cruz-del-sur-stern.png`: render de popa anterior a los últimos detalles, de 1400 × 900.
- `validation.json`: conteos de geometría y comprobaciones de coordenadas y caras degeneradas.

## Organización

La nueva nave está en `CRUZ DEL SUR / REFERENCE EXTERIOR`, con colecciones para
casco, blindaje, ventanas, envolvente exterior del puente, motores, detalles y
rotulación. Las luces, cámaras, planeta procedural y estrellas pertenecen a
`CDS PREVIEW`, y deben excluirse de una futura exportación.
Por indicación del usuario, planeta y estrellas están ahora ocultos, preservados
como elementos de presentación. El diseño del fondo queda para un trabajo futuro.

La colección `CDS 08 / Precision fittings` agrega 342 tornillos embutidos en
74 paneles, manijas, conectores, tapas, señalización técnica, detalles de rejillas
y fijaciones en las bocas de los motores. Se ajustó el acabado de rugosidad y
se corrigieron intersecciones en vidrios y paneles del techo detectadas en la
vista cercana. Se conserva la silueta aprobada.

Se preservaron la cabina `BRIDGE / EDITABLE`, el exterior previo
`EXTERIOR / Upper hull` y las dos colecciones `SHIP`. Permanecen ocultos en
esta presentación. No se editaron los objetos de la cabina ni los GLB existentes.

Ejes: Z arriba, proa hacia +Y, popa hacia −Y. Dimensiones aproximadas de la nave:
49.8 m de largo, 16 m de ancho y 11.2 m incluyendo antenas.

## Reproducción

Desde una copia del estado inicial, ejecutar una vez y en orden los scripts de
`scripts/assets/` dentro de Blender:

1. `build-reference-starship-live.py`
2. `refine-reference-starship-live.py`
3. `finish-reference-starship-live.py`
4. `polish-reference-starship-live.py`
5. `microdetail-reference-starship-live.py`
6. `fit-reference-starship-details-live.py`
7. `validate-reference-starship-live.py`

Los scripts de detalle son pasos incrementales, no operaciones idempotentes.
No volver a ejecutarlos sobre el archivo final: duplicarían sus piezas.
El primer script detecta una colección exterior ya creada y se detiene.
Para generar el render principal, usar la cámara `CDS | Reference three quarter`;
para la popa, `CDS | Stern engineering` con lente de 40 mm.
La toma cercana utiliza `CDS | Precision detail camera`.

## Verificación y límites

Se revisaron visualmente lateral, proa y popa en Blender, y los renders guardados.
La revisión geométrica detectó y permitió corregir caras de espesor cero en
estrellas y rieles; el informe final debe quedar sin caras degeneradas ni valores
no finitos. Los vidrios incluyen superficies simples intencionales.

El modelo conserva piezas separadas y modificadores para editarlo. No se ha
exportado ni incorporado al juego. La cantidad de objetos no es una medida de
draw calls: antes de integrarlo habrá que agrupar/exportar, preparar materiales
compatibles con glTF y medir carga, memoria y tiempo de cuadro en navegador.
Los materiales procedurales de Blender requerirán adaptación o bakeado.

Comprobaciones del repositorio ejecutadas durante esta entrega: `npm run typecheck`,
`npm run lint`, `npm run format:check`, `npm run test` (190 pruebas) y
`npm run build`, todas correctas. Build conserva la advertencia del chunk de más
de 500 kB. No se cambiaron componentes de la aplicación ni se ejecutaron E2E de
navegador para este asset que aún no está integrado.
