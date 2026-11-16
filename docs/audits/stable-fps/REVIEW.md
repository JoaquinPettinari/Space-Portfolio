# Presupuesto de 60 FPS — 2026-11-16

## Resultado y límite

Se mejora el margen de renderizado conservando modelos, triángulos, texturas, acabados, luces cálidas y física. El objetivo de 16,7 ms se cumple en buena parte del recorrido, pero **no se alcanzaron 60 FPS constantes sin picos en todas las vistas**. La vista frontal del puente continúa siendo el caso más exigente.

La versión final mantiene la resolución original y el DPR anterior del juego, sin resolución adaptativa ni reducción de texturas. Antialiasing MSAA 4× permanece activo en la GPU medida. Se probó un ajuste de DPR de hasta el 15 %, pero se retiró después de eliminar el trabajo de picking del exterior y comprobar nuevamente el recorrido a resolución nativa. Sus mediciones quedan archivadas en `adaptive-prototype/`; no describen la versión final.

## Cambios

1. Se retira el desenfoque continuo de los dos paneles del HUD. Sus fondos quedan más opacos para mantener legibilidad; el desenfoque de pausa se conserva. La comparación `before/` frente a `hud/` registra esta etapa sin cambiar resolución ni escena.
2. Los paneles del techo pasan a dos superficies de render por acabado, conservando sus normales, todos sus triángulos y los mismos vértices de cada collider. Los elementos exteriores repetidos se instancian por acabado, manteniendo dimensiones, transformaciones, metalicidad y rugosidad. Los detalles no se eliminan.
3. El shader estándar omite la evaluación de la reflexión directa cuando el propio shader de Three informa `directLight.visible == false`: contribución RGB exactamente cero por luz apagada, distancia o cono. No se cambian intensidades, colores, distancias ni número de luces. Los shaders personalizados del fondo y los materiales sin iluminación no se modifican. Los hooks se encadenan, se conserva su identidad en la caché y se restauran al desmontar. El contrato del fragmento se verifica contra la versión instalada de Three.
4. El grupo exterior decorativo queda excluido del raycast de interacción. La esfera del cielo contiene la cámara, por lo que su broad phase admitía el rayo antes de recorrer miles de triángulos; las estrellas también examinaban sus puntos, aunque todo el grupo está fuera del alcance de interacción. El retorno `false` de raycast detiene la recursión en Three r186. Una prueba utiliza el Raycaster real para verificar ese contrato y conservar los impactos sobre superficies cercanas.
5. El cielo se dibuja después de los sólidos, con depth test activo y sin escribir profundidad, para que los píxeles tapados por el interior se descarten antes de sombrearse. Las estrellas se dibujan después del cielo, conservando su visibilidad, movimiento y pruebas de profundidad. El vidrio mantiene su fase transparente y ordenamiento normal.

No se modifican velocidades, reglas de puertas, colliders, transparencia del pasillo ni contenido profesional. No se agregan dependencias, postprocesado o sombras. El archivo Blender permanece intacto.

## Medición

Chromium 1248 completo, ANGLE Intel UHD, viewport CSS 1280 × 720, DPR del navegador 1. Antes: 300 cuadros por vista a resolución nativa. Después: 600 cuadros por vista tras seis segundos de asentamiento, más desplazamiento real de ida y vuelta con teclas sostenidas. Animaciones exteriores activas. Se contrastan el reloj del motor y los timestamps RAF del navegador; sus medias coinciden prácticamente.

El muestreo llama únicamente al observador liviano `performance()`. El recorrido medido usa teclas reales y evita consultar raycasts de diagnóstico repetidamente mientras camina. Las verificaciones de posición ocurren al terminar los tramos. Las mediciones son de desarrollo y varían con la carga del equipo; no constituyen una garantía para otras resoluciones o dispositivos.

| Vista             | Media inicial | P95 inicial | Media posterior | P95 posterior | DPR posterior |
| ----------------- | ------------: | ----------: | --------------: | ------------: | ------------: |
| Entrada           |      15,42 ms |    18,60 ms |        13,02 ms |      14,50 ms |             1 |
| Puente frontal    |      21,72 ms |    24,60 ms |        15,13 ms |      17,70 ms |             1 |
| Puente trasero    |      19,40 ms |    22,10 ms |        14,49 ms |      16,70 ms |             1 |
| Pasillo de vidrio |      14,06 ms |    16,70 ms |         9,62 ms |      11,30 ms |             1 |

En el desplazamiento, 635 cuadros con movimiento efectivo registraron media 13,36 ms, mediana 13,00 ms, P95 16,80 ms y P99 21,50 ms; 0,31 % superó 25 ms. DPR 1 durante toda la prueba, incluido el movimiento. No se convierte esa media en una promesa de 60 FPS sostenidos sin un solo cuadro lento.

Las llamadas de dibujo en la entrada bajaron de 318 a 287, y en la vista frontal de 172 a 142. Los recuentos en otras vistas pueden variar ligeramente por posición, animación y agrupación de bounds; no se afirma una reducción uniforme de triángulos visibles. La prueba compara también los triángulos totales del techo y sus intersecciones.

Los JSON conservan cada muestra, renderer, viewport, drawing buffer, DPR real y percentiles. La tabla final compara la misma resolución y los mismos assets. Las variantes experimentales con menor DPR se separan de la evidencia final. Se observaron variaciones entre repeticiones: no se atribuye toda diferencia temporal a una sola técnica.

## Reproducción y pruebas

- `FPS_REVIEW_STAGE=before npx playwright test stable-fps.spec.ts --config playwright.refined-review.config.ts`: captura inicial previa a los cambios. `FPS_REVIEW_STAGE=hud` corresponde a la etapa del HUD. Sin variable se guarda en `after/`. La variable de etapa solo elige la carpeta del informe; no activa ni desactiva optimizaciones. La captura inicial se realizó antes de editar el juego. En Windows se establece además `PLAYWRIGHT_EXECUTABLE_PATH` a Chromium 1248; `FPS_REVIEW_SAMPLES` permite variar la duración.
- `npm run test -- --maxWorkers=2 --testTimeout=30000`: **218 pruebas correctas en 63 archivos**, completadas en 195 s sobre la versión final a resolución nativa. Incluye la identidad de caché de hooks, los vértices originales de colisión y la exclusión de picking del exterior con el Raycaster real.
- `npx playwright test refined-interior.spec.ts panoramic-passage-review.spec.ts unified-interior.spec.ts physical-monitor.spec.ts interior-orbit-polish.spec.ts fps-scenery.spec.ts --config playwright.refined-review.config.ts`: **11 pruebas correctas**, con controles, Pointer Lock y desplazamientos reales. Incluye puerta bloqueada y abierta, colisión de vidrio y bahía técnica, ida/vuelta, retorno desde pausa, café, monitor físico y scroll nativo. El caso de contacto comprueba explícitamente respuestas mockeadas; no acredita un envío real.
- Repetición sobre la versión final nativa: `npx playwright test refined-interior.spec.ts panoramic-passage-review.spec.ts unified-interior.spec.ts physical-monitor.spec.ts --config playwright.refined-review.config.ts`: **9 pruebas correctas en 4,1 minutos**, sin errores de consola ni excepciones.
- El benchmark de FPS agrega otra prueba de navegador y registra consola/excepciones. Las pruebas unitarias de strings de shader no se presentan como prueba de compilación GPU: la compilación real se comprueba en Chromium.
- `npm run typecheck`, `npm run lint`, `npm run build`: correctos. Se mantiene el aviso anterior de chunk grande. La observación `__GAME_DEBUG__` no aparece en el build de producción.
- `npm run format:check`: permanecen los dos informes JSON anteriores de Blender fuera del alcance. Los archivos y mediciones de esta revisión se formatean con Prettier.

## Evidencia

- [Cuadros iniciales](before/measurements.json)
- [Cuadros finales](after/measurements.json)
- [Desplazamiento medido](after/movement.json)
- [Puente](after/bridge-forward.png)
- [Vidrio](after/glass-passage.png)

Se probaron el ordenamiento por materiales y la opción de alpha del renderer; no se conservaron al no establecer un beneficio adicional. Three r186 mantiene un contexto alpha real aun con esa opción del renderer. Se conserva el ordenamiento opaco anterior y el contexto original, documentando atributos reales en las mediciones.
