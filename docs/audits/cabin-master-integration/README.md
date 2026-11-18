# Integración del maestro de cabina — verificación

La auditoría compara el mismo recorrido y las mismas posiciones de cámara antes
y después de sustituir la llegada por el maestro de Blender. Usa entradas reales
de teclado/mouse, Pointer Lock nativo y observación de desarrollo de solo lectura.
No teletransporta al jugador ni modifica estados de misiones.

## Ejecución

Desde la raíz del repositorio, con el puerto 4173 libre:

```powershell
$env:CABIN_MASTER_PHASE='after'
npx playwright test --config docs/audits/cabin-master-integration/playwright.config.ts
```

`before` omite el recorrido por muebles nuevos; se ejecutó y guardó antes de
modificar la escena. No repetirlo sobre la nueva versión: sobrescribiría la base.
El spec también pertenece a la suite de auditorías optativa.

## Base anterior

- Chromium 156, Intel UHD Graphics mediante ANGLE/D3D11.
- Viewport y canvas 1280 × 720, DPR de render 1.
- Cámara: aproximadamente `[0, 1.699, 15.316]`, mirando al ventanal lateral.
- 60 cuadros de estabilización y 180 muestras.
- 77 draw calls y 275.623 triángulos en la muestra central.
- Mediana 16,9 ms; P95 20,4 ms.
- 19.597 ms desde navegación hasta controles preparados y captura del mouse.
- Sin errores de consola ni excepciones. Avisos de deprecación Three/Rapier y
  precisión del compilador de shaders conservados en `before.json`.

El tiempo de preparación incluye navegación, compilación y carga local; no es una
medición aislada de descarga ni un SLA. Las variaciones de tiempo de cuadro no
demuestran optimización por sí solas. Capturas: `before-window.png`,
`before-docking.png`, `before-service.png`.

## Cobertura de comportamiento

`e2e/cabin-revision.spec.ts` conserva las comprobaciones de bloqueo de muebles,
paso libre y saltos contra vidrio/techo, adaptadas a la repisa en lugar del sofá
y la mesita retirados. `e2e/cabin-master.spec.ts` añade el recorrido desde la
cabina, acreditación, apertura, cruce y retorno, y salida/reentrada en Pointer
Lock. Las capturas son evidencia visual adicional, no prueba de colisiones.

## Primeras comprobaciones de integración

La primera integración (`after-initial.json`) registró 65 draw calls, 389.302
triángulos y mediana/P95 de 36,5/40 ms. La adaptación a materiales estándar
(`after-standard.json`) registró 67 draw calls, 390.626 triángulos y 32,9/38,2 ms.
Ambas recorridas completas aprobaron; estos valores intermedios no deben
confundirse con el resultado final ni considerarse una mejora sobre la base.

Las dos pruebas de `cabin-revision.spec.ts` aprobaron: paso libre donde estaba
el sofá, bloqueos de repisa/equipos/EVA y saltos contenidos por vidrio y techo.

La prueba específica de puerta detectó una falta de interacción al apuntar a la
junta central de 6 mm entre hojas. Se corrigió el volumen de selección móvil.
El intento siguiente atravesó esa etapa y detectó fragilidad en la prueba: un
muestreo puntual tras esperar 500 ms podía observar la acreditación ya terminada.
Se sustituyó por la secuencia real grabada por cuadro: escaneo con puerta cerrada,
identidad verificada y recién después desbloqueo. No se cambió la duración del
gesto ni se simuló la captura del mouse.

## Comparación final

Con materiales estándar, una luz de esclusa y descarte de caras posteriores en
los sólidos, el recorrido final aprobó (1/1, 59,8 s). Vidrio y follaje conservan
ambas caras. `after.json` registra 21,4 ms de mediana, P95 de 25 ms, 67 draw calls,
390.626 triángulos y 20.712 ms hasta controles preparados. La cámara quedó
0,10 m más atrás que en la base por la tolerancia de llegada del recorrido.

La cabina detallada sigue siendo más costosa que la anterior: aproximadamente
47 FPS frente a 59 FPS en esta Intel UHD, calculados desde la mediana; no es una
promesa de rendimiento para otros equipos. El ajuste redujo el costo inicial de
36,5 ms sin reducir la resolución ni retirar detalles del modelo.

Las capturas finales de ventanal, pared técnica, EVA, piso, techo y docking no
muestran caras ausentes evidentes. El visor deja ver la esclusa y su puerta
interior. Esta inspección visual no sustituye las pruebas de movimiento.

El maestro estático aparece una sola vez en Resource Timing: 20.835.664 bytes de
transferencia local. Esa corrida todavía registraba dos descargas de la envolvente
anterior; la corrección posterior de su clave de caché quedó comprobada en
producción: una sola transferencia de 7.555.656 bytes. Estos tiempos corresponden
al servidor local y no representan descarga por Internet. No se midió memoria GPU.

Las tres regresiones finales aprobaron (3/3, 2,5 min): puerta con bloqueo físico
y secuencia de acreditación, visor exterior con arrastre/zoom/reset y retorno,
y mesa táctica con datos de sesión e inspección. Ninguna registró errores de
consola ni excepciones. Se conservaron `after-exterior.png` y
`after-tactical.png`; ambos modelos compuestos se muestran sin fallos de carga.

```powershell
npx playwright test e2e/bulkhead.spec.ts e2e/navigation.spec.ts e2e/next-phase.spec.ts --grep 'credential-controlled bulkhead|inspects the exterior|optional tactical table'
```

## Producción y controles finales

`npx playwright test --config playwright.production.config.ts e2e/production.spec.ts`
aprobó 1/1 (31,9 s incluyendo build; prueba 17,4 s). Se comprobó ausencia de
`__GAME_DEBUG__`, entrada/salida real de Pointer Lock, acceso al portfolio y
retorno, y cabeceras/CSP. Sin errores de aplicación; el único error de consola
esperado corresponde al script deliberadamente bloqueado por la prueba de CSP.
`production-report.json` conserva estado, duración y Resource Timing del
attachment: maestro y envolvente se descargan una sola vez cada uno.

El coordinador ejecutó typecheck, lint, build y 265 pruebas en 80 archivos:
aprobados. El formato global conserva tres JSON históricos fuera de este cambio;
los archivos nuevos y modificados de esta integración pasaron la comprobación
acotada. ESLint de los cinco specs/listado modificados por QA y `git diff --check`
también aprobaron. No se ejecutó toda la suite E2E; la evidencia cubre los
recorridos y sistemas enumerados arriba.

## Corrección posterior: piso de esclusa y extremos técnicos

Se recortó la envolvente heredada que atravesaba la esclusa y se cerraron los
dos extremos del equipamiento técnico con remates visibles y un volumen de
colisión continuo. La nueva prueba recorre ambos extremos con teclado real,
intenta alcanzar el pasillo tras los equipos y comprueba que queda delante del
plano x=3,56. Luego vuelve a la puerta y mira hacia abajo por el visor.

```powershell
npx playwright test e2e/cabin-revision.spec.ts --grep 'technical wall .* end prevents'
```

Resultado final: **2/2 aprobadas**, 1,5 min. Sin errores de consola ni excepciones.
Las capturas `technical-forward-closed.png`, `technical-aft-closed.png` y
`vestibule-floor-fixed.png` muestran remates sólidos y la esclusa sin las placas
elevadas; el marco oculta parte del piso desde esa posición normal de cámara.

El primer intento previo no reprodujo el defecto: su ruta chocaba con Crew
Access antes de llegar al extremo. Se corrigió el recorrido, sin teletransporte.
Un intento posterior no inició pruebas por un import JSON sin atributo ESM;
se corrigió el import del módulo y se ejecutaron ambas pruebas correctamente.

Controles generales informados por el coordinador para esta corrección:
typecheck, lint y build aprobados. La corrida unitaria general dio 265 aprobadas
y una fallida porque el test táctico suponía geometría indexada; tras aceptar
también geometría no indexada, la suite afectada aprobó 3/3. No se repitió toda
la suite general después de ese ajuste. Formato acotado y diff check aprobados.
