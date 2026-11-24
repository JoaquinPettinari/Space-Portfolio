# Intro prerenderizada

La entrega web usa `/video/circular-arrival-intro.mp4`: 8 segundos, 240 cuadros a 30 FPS,
1280 × 720, H.264 sin audio. `/video/circular-arrival-poster.jpg` es el primer cuadro,
para cubrir la espera inicial del decodificador. El video conserva la cámara,
la entrada y el cierre de las compuertas circulares; no depende de cargar sus GLB en el navegador.
La revisión actual conserva el marco circular y las hojas articuladas: abre
durante la llegada, mantiene el paso libre y cierra después de entrar PAMPA.
La cámara mantiene más contexto del casco al terminar. El maestro anterior se
conserva como versión previa.

## Regeneración

Desde la raíz del proyecto, con Blender 5.3 instalado:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background 'docs/assets/docking-intro/circular-arrival-detailed.blend' --python scripts/assets/render-docking-video.py -- --output-name circular-arrival --samples 32 --benchmark
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background 'docs/assets/docking-intro/circular-arrival-detailed.blend' --python scripts/assets/render-docking-video.py -- --output-name circular-arrival --samples 32
```

El primer comando genera el poster y mide un cuadro. El segundo renderiza la
animación completa con el encoder incluido en Blender. Se ejecutan en un proceso
aislado: no guardan cambios en el master ni alteran la sesión interactiva abierta.

EEVEE usa 32 muestras, sombras y los materiales de la revisión pulida, sin ray tracing ni
compositor. Esta configuración reduce el costo de producción del recurso, no la
calidad de los materiales del interior. Aun pueden quedar pequeñas variaciones de
ruido en superficies metálicas; el archivo fuente permite regenerarlo con más
muestras si hace falta.

El script coloca el índice MP4 `moov` antes de los datos de video y corrige sus
offsets (`faststart`) para permitir reproducción progresiva. El resultado y su
SHA-256 quedan registrados en `circular-arrival-video-export.json`. No requiere FFmpeg externo.

## Integración

Reproducir como video DOM con `muted` y `playsInline`, manteniéndolo encima del
interior durante toda la carga. La animación y la disponibilidad del interior son
condiciones independientes: terminar el video no autoriza mostrar una escena
incompleta. Al terminar se funde el último cuadro a negro; si el interior tarda
más, la cobertura permanece opaca hasta que esté listo. La apertura central y el diálogo de bienvenida
corresponden a la aplicación, después de esas dos condiciones.

Al publicar, servir este recurso estático con tipo `video/mp4`; no convertirlo en
una importación JavaScript ni cargar el master de Blender para reproducirlo.
