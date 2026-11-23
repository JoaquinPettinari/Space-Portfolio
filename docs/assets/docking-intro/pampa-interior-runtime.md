# PAMPA estacionada detrás del visor

La vista interior aprobada se exporta con
`scripts/assets/export-pampa-interior.py` desde
`pampa-interior-review.blend`. El exportador usa una escena temporal que contiene
únicamente la colección de la punta; no guarda cambios sobre el maestro.

`public/models/pampa-interior-nose.glb` contiene 55.311 triángulos, un mesh,
un material y tres imágenes embebidas. Ocupa 3.521.952 bytes. Conserva UV,
materiales y coordenadas de la revisión. Su extremo queda en Z = 19,35 m,
a 1,085 m del plano del visor; termina en Z = 20,63 m.

`ParkedPampa` se monta dentro de `EntryAirlock` y del mismo límite Suspense que
el resto del mundo, por lo que la preparación de la intro espera también sus
recursos. No precarga Three desde el bootstrap ni añade una escena de render,
luces, animación o trabajo por cuadro. La geometría y texturas pertenecen a la
caché de GLTF y no se disponen al desmontar el componente. El collider de la
puerta fija mantiene esta zona inaccesible.

`parkedPampaAsset.test.ts` comprueba el recurso exportado: coordenadas, separación
del visor, número de triángulos, imágenes embebidas y ausencia de luces, cámaras
y animaciones. El informe `pampa-interior-export.json` registra hashes de fuente
y derivado. El coste de descarga medido no equivale a un resultado de FPS;
la comprobación visual y de navegación se realiza en el navegador.

## Verificación de integración

La prueba nativa `e2e/pampa-interior.spec.ts` pasó: descarga única del GLB,
punta presente en el dibujo, aproximación con teclado/mouse, escotilla
infranqueable y salida/reentrada de Pointer Lock. Se revisó una captura puntual
desde Z ≈ 17,07 m: punta centrada detrás del vidrio, materiales e iluminación
visibles, sin geometría atravesando el marco. Para repetir esa captura usar
`PAMPA_REVIEW_CAPTURE=1`; no se generan imágenes en la regresión normal.

Las cuatro pruebas E2E de intro también pasaron con el nuevo video circular;
la reproducción normal presentó 240 cuadros y reportó cero cuadros perdidos.
Esto verifica esa ejecución local, no garantiza tiempos iguales en otros equipos.

Typecheck, lint y build de producción pasaron. Las pruebas específicas
`npm run test -- src/game/intro src/game/world/parkedPampaAsset.test.ts`
pasaron (23 pruebas). La suite global se interrumpió tras timeouts bajo carga
y posteriores ejecuciones sin progreso; no se declara aprobada.
`format:check` global marca tres JSON preexistentes (`cabin-master/assembly.json`
y los dos informes de `unified-ship/*-refinement/audit.json`); el formato de los
archivos de esta integración pasó. No se modificaron esos informes ajenos.
