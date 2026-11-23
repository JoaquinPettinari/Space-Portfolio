# Asterion: exportación para la app

Fuente aprobada e inmutable: `../asterion-expanse-v2.blend`. SHA-256:
`170bcf42c6b753fc96508e47c76cba4d9c4324766f98de2ff80e76c4baae7387`.

El cielo WebP de 4096 × 2048 contiene solamente el World original. Los nueve cuerpos, los anillos y los 155 fragmentos son geometría tridimensional. Las superficies reciben la iluminación original mediante mapas horneados; AgX y exposición +0.35 se aplican una sola vez. En la app se utilizan materiales unlit sin tone mapping. Las atmósferas se reconstruyen por separado para que el borde dependa del punto de vista. No se agregan luces al interior ni se rotan mapas de iluminación estática.

La inspección desde las ventanas reales mostró que las consolas tapaban Nacre y casi todo Vesper. La composición derivada eleva Vesper de Y=-29 a Y=-12 y Nacre de Y=-17 a Y=28, junto con sus anillos y atmósferas. Se conservan X/Z, tamaño, rotación y mapas horneados. `WINDOW_COMPOSITION` en `export-asterion-finalize.py` es la única configuración de estas posiciones absolutas; aplicarla dos veces produce el mismo GLB. El manifiesto y el audit registran `sourcePosition` y `runtimePosition`. La fuente Blender no se modifica ni se vuelve a hornear.

Los anillos conservan todas las divisiones radiales, su sombra planetaria y su opacidad. Color y profundidad óptica se hornean separados, evitando multiplicar dos veces la transparencia. El campo de fragmentos comparte un atlas y una malla; sus coordenadas procedurales originales se conservan como atributo durante el horneado. Blender 5.3 exporta los nodos de emisión como PBR: el paso `export-asterion-finalize.py` convierte explícitamente estos materiales a `KHR_materials_unlit`, preserva el mapa RGBA del anillo y declara `BLEND`.

## Recursos

- Modelo: `public/models/asterion-worlds.glb`, servido mediante su variante `.glb.gz`.
- Cielo: `public/textures/asterion/sky.webp`.
- Contrato de coordenadas, atmósferas y límites: `src/game/world/asterionManifest.json`.
- 107 600 triángulos; 11 primitivas/materiales, sin luces ni cámaras exportadas.
- Descarga inicial del exterior: aproximadamente 2.87 MB (modelo gzip + cielo), frente a aproximadamente 1.97 MB anterior. Esto no demuestra tiempo de carga; medirlo en navegador.
- 18 219 008 píxeles de textura; estimación RGBA8 con mipmaps: 97 168 043 bytes, aproximadamente 92.67 MiB, inferior a los aproximadamente 104 MiB anteriores. No incluye geometría ni otros recursos de la app.

Los bytes exactos están en `export-audit.json`. Los PNG y el array NumPy de esta carpeta son cachés de autoría; no se descargan en la app.

## Reproducción y comprobación

Desde la raíz, ejecutar Blender 5.3 en segundo plano con `--python scripts/assets/export-asterion-runtime.py`. El script utiliza OptiX y conserva los mapas ya horneados. Una fuente con otro hash exige revisar y renovar explícitamente la caché. Para comparar, ejecutar `--python scripts/assets/export-asterion-compare.py`; `-- --runtime-only` repite solo las vistas del GLB final reimportado.

Se inspeccionaron las parejas `compare-front-*`, `compare-rear-*` y `compare-rings-*`, con cámaras idénticas y fondo transparente. Las posiciones, los terminadores y los patrones de los planetas coinciden estrechamente. Las siluetas negras proyectadas por fragmentos sobre Orison también existen en la fuente. Los anillos mantienen sus huecos y sombra, con una pequeña diferencia de brillo frente al material transmisivo original. La reducción del atlas de fragmentos pierde microdetalle en acercamientos; a distancia su silueta y distribución se conservan. Esta exportación no es visualmente idéntica píxel por píxel. Las atmósferas y el cielo se comprueban conjuntamente en la app.

Las parejas de comparación corresponden al export previo al ajuste de altura; verifican materiales y geometría en la posición de autoría. La composición final se verifica desde las ventanas de la app. `compare-audit.json` registra el hash de la fuente antes y después. El exportador verificó que no se modificó el archivo aprobado.
