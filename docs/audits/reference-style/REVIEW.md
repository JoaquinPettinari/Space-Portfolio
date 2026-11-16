# Interfaces, guantes, radio y llegada

Implementación en el juego a partir de las cinco referencias del usuario. La
maqueta Blender anterior permanece separada y no se reexporta en este cambio.

- Subtítulo inferior con IA, divisor, onda y cierre X accesible. Sin blur ni
  animaciones de filtros sobre el canvas.
- Escritorio con fondo orbital local, paneles petróleo y acentos cian. Conserva
  las cuatro aplicaciones reales, datos profesionales, navegación con teclado
  y descarga del CV. No añade aplicaciones vacías para copiar la referencia.
- Crew Access con escáner, ficha real y acceso confirmado por las reglas
  existentes. Las etiquetas y el estado no se hornean en imágenes.
- Tablet con marco completo, protectores naranjas, mapa y guantes. El mismo
  generador de guante se utiliza para la tarjeta: un mesh de 5.800 triángulos
  por instancia, sin luces ni sombras. La versión de cámara tiene orden de
  dibujo explícito para que el escenario no tape la carcasa.
- Holograma azul de la nave actual. El cuerpo escribe profundidad para que
  las aristas traseras no saturen la silueta; no cambia su geometría.
- Armario, nicho con chaqueta/casco y señalética en la pared trasera. Seis
  materiales fusionados, dos planos y tres colliders locales. Se preservan las
  rejillas, liberación de emergencia, escotilla y circulación existentes.
- Radio física con E, Play/Pause, Next y volumen. Dos instrumentales originales
  sintetizados localmente; no se descargaron canciones del catálogo NCS. La
  radio tiene activación explícita e independiente del sonido ambiental.

## Revisión nativa

`npm run test:audit -- reference-style-review.spec.ts` recorre con entradas
reales la llegada, tablet, escaneo, puente, workstation y radio, y produce estas
capturas. Comprueba también reproducción/pausa, cambio de pista, volumen y
regreso a Pointer Lock. Sin excepciones ni errores de consola en la ejecución
final.

El gesto dura 1,2 s y la verificación continúa hasta 2,7 s. Esperar al montaje
del DOM y otros 650 ms capturaba la retirada (elapsed 1,21 s), no demostraba un
fallo visual del gesto. La auditoría observa alcance y proyección de solo
lectura antes de capturar. La toma final incluye la tarjeta y el guante; no se
pausa ni altera la animación para producirla.

La cámara de Crew Access amplía únicamente su encuadre vertical a 1,35 m para
incluir lector y muñeca. Las otras pantallas conservan su escala física. El
gesto se detiene al pausar o transicionar sin cambiar sus reglas temporales.

## Coste observado

Chromium nativo, 1280 × 720, DPR 1. Cada vista calienta 30 cuadros y toma 120
muestras del observador público de desarrollo. La llegada usa movimiento
reducido; tras la tarjeta se activa movimiento normal y el holograma gira.

| Vista           |  Mediana |      p95 | Llamadas de muestra | Triángulos de muestra |
| --------------- | -------: | -------: | ------------------: | --------------------: |
| Llegada         | 13,20 ms | 20,40 ms |                  66 |               188.986 |
| Mesa y exterior | 17,40 ms | 20,40 ms |                 139 |               471.137 |

Las muestras completas están en `timing.json`. Son dos posiciones concretas,
sin baseline comparable de este cambio ni medición del hardware del visitante.
La vista de mesa supera 16,67 ms y no demuestra 60 FPS estables. No se añadieron
luces, mapas de sombras, postprocesado ni descargas de texturas/música.

## Verificación y límites

Typecheck, lint y 235 pruebas unitarias pasaron. Cuatro regresiones nativas
verificaron tablet, dos recorridos del workstation con teclado/descarga y
puerta cerrada/abierta, colisión inclinada y regreso por el pasillo de vidrio.
La auditoría visual pasó y la prueba de producción verifica el build real.
El formato global conserva dos advertencias anteriores en JSON de Blender.

La radio se verificó con AudioContext real en Chromium y con pruebas unitarias
de secuencia, volumen, suspensión y limpieza; no se hizo una evaluación auditiva
manual. Tampoco se afirma igualdad fotográfica con los renders de referencia:
las formas y materiales siguen adaptados al runtime actual.
