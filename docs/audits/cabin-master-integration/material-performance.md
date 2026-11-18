# Perfil de materiales de la cabina — 2026-11-18

Medición local con Chromium 156, Intel UHD, viewport 1280 × 720 y DPR 1. Entrada y desplazamiento reales con teclado/mouse hasta el ventanal; ninguna modificación de cámara, escena o reglas mediante diagnóstico. Servidor y navegador aislados de otras pruebas. Los tiempos de cuadro provienen de 180 muestras tras 60 cuadros de calentamiento. El perfil CPU de cuatro segundos se registra después, separado del muestreo de cuadros.

| Variante                                       | Mediana cuadro |     p95 | Draw calls | Triángulos enviados |
| ---------------------------------------------- | -------------: | ------: | ---------: | ------------------: |
| PBR Standard, dos luces de esclusa, doble cara |        33,1 ms | 37,5 ms |         65 |              389302 |
| PBR Standard, una luz de esclusa, doble cara   |        32,2 ms | 35,1 ms |         66 |              389410 |
| PBR Standard, una luz, cara frontal en sólidos |        21,4 ms | 24,6 ms |         65 |              389302 |

La segunda posición difiere 5 cm sobre Z; primera y tercera coinciden en Z=15,314946. No interpretar la pequeña diferencia entre una y dos luces como una mejora precisa: puede incluir variación de la pose y del sistema. La reducción de aproximadamente 33,5 % al descartar caras posteriores es mucho mayor. Vidrio y follaje conservan doble cara. Los triángulos informados por Three.js son enviados al renderizador: su conteo no disminuye al descartar caras en GPU.

El inventario confirma el atajo de luces de contribución nula activo en los 235 materiales Standard/Physical visibles. El perfil CPU de la primera variante registra 3679 ms en idle y 373 ms en program; la función JavaScript con mayor tiempo propio acumula 11,4 ms. Esto no sugiere un cuello de botella JavaScript dominante, pero no equivale por sí solo a medir GPU.

En la última variante sí se obtuvo temporización GPU con `EXT_disjoint_timer_query_webgl2`, en una fase separada y descartando muestras disjoint. Ocho consultas entre callbacks consecutivos de requestAnimationFrame: 19,903; 19,516; 19,705; 19,951; 18,890; 19,008; 21,675; 19,514 ms. Mediana 19,610 ms. Estas consultas cubren el trabajo GPU entre dichos callbacks; no representan memoria GPU ni tiempo total de carga. No hay mediciones GPU comparables de las otras dos variantes.

El runtime anterior medía 16,9 ms de mediana y 20,4 ms p95 en la revisión inicial. La cabina nueva todavía cuesta más; no se afirma paridad ni 60 FPS sostenidos. La aceptación visual de superficies, vidrio y objetos con descarte de caras corresponde a la pasada QA final.

Reproducción: definir `CABIN_PROFILE_LABEL` y ejecutar `npx playwright test --config docs/audits/cabin-master-integration/material-profile.config.ts`. Las variantes se seleccionaron mediante cambios acotados del código, no atajos del navegador. El script observa materiales y rendimiento y guarda JSON y perfiles CPU. Las tres ejecuciones pasaron sin excepciones de página. Prettier y ESLint de los archivos de diagnóstico pasaron; las verificaciones generales de aplicación se ejecutan en la entrega principal.
