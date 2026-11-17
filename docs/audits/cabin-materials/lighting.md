# Materiales e iluminación: método y coste

## Método

Auditoría nativa `npm run test:audit -- cabin-lighting-review.spec.ts`, variando
`CABIN_REVIEW_PHASE`. Chromium 156 sobre ANGLE / Direct3D11, Intel UHD Graphics
(0x00009BC4), viewport y canvas 1280×720, DPR 1. Entrada y recorrido mediante
teclado/mouse reales. Después de 60 cuadros de calentamiento se observan 180
cuadros mediante el diagnóstico de solo lectura. Se comprueban `console.error`
y excepciones; las capturas adicionales muestran piso y nicho.

El encuadre depende de la caminata, con diferencias de aproximadamente 0,15 m.
La mediana y P95 son tiempos de cuadro observados, no tiempos GPU aislados. El
tiempo hasta controles utilizables incluye carga/inicialización; no es una prueba
de red fría calibrada. No se midió memoria GPU.

| Fase                            | Draw calls | Triángulos | Mediana ms | P95 ms | Entrada s |
| ------------------------------- | ---------: | ---------: | ---------: | -----: | --------: |
| Antes                           |         71 |    278.764 |       15,6 |   19,3 |      17,5 |
| Primeros acabados compartidos   |         71 |    277.948 |       15,9 |   18,9 |      17,2 |
| Reflejos amplios                |         71 |    277.948 |       16,6 |   18,7 |      19,7 |
| Experimento con luz rectangular |         71 |    277.948 |       22,8 |   28,3 |      25,4 |
| Piso visible corregido          |         71 |    277.948 |       15,6 |   20,0 |      18,1 |
| Equilibrio final                |         71 |    277.948 |       15,8 |   18,6 |      18,1 |

La luz rectangular sustituyó una de las dos puntuales; no añadió sombras, pero
su coste observado y resultado visual no justificaban conservarla. Se retiró,
incluida la inicialización de sus tablas LTC. Las comparaciones intermedias
coinciden con cambios de arte y no aíslan el coste de cada modificación.

El resultado final conserva la mediana dentro de la variación observada, con el
mismo número de draw calls. No constituye una garantía de 60 FPS en otros equipos.
Se prefirió un metal satinado oscuro frente al reflejo amplio que lavaba el piso.
La escena sigue siendo estilizada: no se reproduce la reflexión especular exacta
ni las sombras físicas de la imagen de referencia.

Evidencia: [antes](../cabin-reference/material-before-wide.png),
[final](../cabin-reference/material-balanced-wide.png),
[piso](../cabin-reference/material-balanced-floor.png),
[nicho](../cabin-reference/material-balanced-suit.png) y
[muestras finales](../cabin-reference/material-balanced.json).

## Propiedad y alcance

- Un proveedor local genera una única reflexión PMREM estática (128 px/cara) y
  dos mapas de piso de 256 px. Los consumidores reciben las mismas instancias;
  se desconectan antes de liberar los recursos. No hay captura por cuadro.
- Los acabados del casco solo afectan a los batches `UNIFIED_RUNTIME_arrival_`.
  Se clonan sus materiales y geometrías para UV1; puente y casco exterior
  conservan los recursos originales. Un mapa lineal de 128 px combina rugosidad
  y relieve cepillado sutil. No cambia la geometría de colisión.
- El detalle del piso está en coordenadas mundiales. Su UV1 resta el origen de
  llegada para coincidir con el atlas de las placas locales. Los batches del
  puente no reciben este acabado.
- La oclusión de contacto del piso deriva de los muebles y del volumen real del
  nicho. Es una aproximación estática, no una sombra dinámica.
- Permanecen dos luces puntuales sin sombras. Las reflexiones rectangulares son
  una aproximación local de las luminarias, no un reflejo trazado de la escena.

Los ensayos mantuvieron los avisos existentes de Three.Clock/Rapier y precisión
numérica ANGLE durante la compilación PMREM. No hubo errores de shader ni
excepciones en las auditorías completadas.
