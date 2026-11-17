# Cabina de sección recta

La sección compartida en `src/game/world/arrivalShellLayout.json` mantiene paredes
en X ±4,95 m hasta Y 2,50 m, hombros rectos hasta X ±3,35 m / Y 3,30 m y techo plano.
El tramo habitable va de Z 11,86 a 18,42 m. Los collares de ambos extremos conservan
sus aberturas y ajustan su contorno exterior exactamente a esa sección.

Se retiran las dos familias superpuestas de marcos antiguos, las nervaduras
oblicuas interiores, los salientes del techo y el alféizar curvo detrás del sofá.
El vidrio lateral continuo participa en la colisión estructural. El techo y los
hombros visuales comparten geometría fuente con esa colisión, sin bevels físicos.
El banco conserva sus medidas y recibe un único cierre trasero recto.

La fuente original `cruz-del-sur-interior-panels.blend` permanece intacta. La copia
editable `straight-pressure-shell.blend` contiene el casco estructural completo,
sin mobiliario ni lógica interactiva. Los assets anteriores también se conservan.

Receta desde la raíz del proyecto:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' --background 'docs/assets/unified-ship/cruz-del-sur-interior-panels.blend' --python scripts/assets/export-straight-arrival-shell.py
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' --background 'docs/assets/unified-ship/cruz-del-sur-interior-panels.blend' --python scripts/assets/export-arrival-cleanup.py -- --reference-cabin
```

`export.json` registra dimensiones y presupuesto de los nuevos GLB. La verificación
de colisiones y funcionamiento se realiza en los tests del juego, no en Blender.
