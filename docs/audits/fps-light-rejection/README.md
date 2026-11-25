# Entrada: seguimiento de FPS

## Resultado conservado

Se amplía la profundidad previa a los lotes del maestro estático cuyo nombre
empieza por `CABIN_MASTER_cabin_`. El instalador existente sigue rechazando
cristales, recortes alfa, deformaciones, shaders personalizados y otras superficies
que no puede reproducir exactamente. Los proxies comparten vértices y siguen
las transformaciones y visibilidad de su malla, no escriben color ni reciben raycast.
No se cambian luces, mapas PBR, fondo, geometría visible, colisiones ni resolución.

La cobertura completa evita sombrear más fragmentos que luego quedarían tapados.
En la vista de entrada añade 32 dibujos respecto de la versión anterior (66 a 98)
y eleva los triángulos enviados de unos 490 mil a 714 mil. El ahorro de fragmentos
compensa ese coste en el equipo medido; no es una recomendación general para toda
la escena. La proa conserva su selección anterior.

## Comparación de esta tanda

Chromium, 1280 × 720, DPR 1, tres ensayos de 150 cuadros por vista y 30 cuadros de
calentamiento por ensayo. Ruta con teclado/mouse reales. Mediana de las tres
medianas, sin consultas GPU activas; se verifica que el observador GPU sea nulo.
No se ejecutaron builds ni pruebas concurrentes durante las capturas normales.

| Vista   | Antes ms | Final ms | FPS antes | FPS final |
| ------- | -------: | -------: | --------: | --------: |
| Entrada |     64,5 |     55,0 |      15,5 |      18,2 |
| Proa    |     39,9 |     39,1 |      25,1 |      25,6 |
| Pasillo |     41,1 |     38,5 |      24,3 |      26,0 |

La entrada gana aproximadamente 17 % de FPS (14,7 % menos tiempo por cuadro).
Sus tres medianas pasan de 63,1/64,5/65,3 a 54,9/55,0/57,2 ms. Las diferencias
de proa y pasillo son pequeñas y tienen distribuciones solapadas; no se prometen
mejoras generales equivalentes. No se alcanzan 60 FPS. Las posiciones varían
ligeramente y el exterior sigue animado. No comparar con otra sesión como si
fuera el mismo estado de carga del equipo.

`graphics-probe.json` identifica Intel UHD mediante ANGLE/D3D11, con preferencia
`high-performance`: es aceleración gráfica, no SwiftShader. Es una sonda separada
del mismo Chromium; el audit ahora registra también el contexto real de la app en
futuras ejecuciones. No representa necesariamente el navegador habitual del usuario.

Evidencia: `fps-before.json` es la referencia; `full-depth/fps-after.json` y sus
capturas contienen el resultado conservado. Los archivos incluyen muestras,
percentiles, cámara, DPR, dibujos y recursos.

## Candidato descartado

Se probó adelantar el descarte de luces rectangulares que no aportaban color,
sin umbrales de distancia. Pasó paridad de píxeles, pero el resultado no fue
consistente: la versión global (`fps-after.json`) mejoró entrada mientras empeoraba
ligeramente proa; la versión limitada a cabina (`cabin-only/`) no sostuvo la mejora
de entrada. Se retiraron el helper y todos sus cambios de shader y pruebas específicas.
La implementación final no contiene ese candidato.

La primera prueba de luz trasera detectó que el propio suelo de prueba aún recibía
luz; se corrigió la posición y pasó. Una repetición tuvo un fallo de importación
dinámica de Vite antes de comparar píxeles; la repetición completa pasó. Durante
la retirada del candidato falló el ejecutable Python de restauración, provocando
un import incompleto: esa ejecución se interrumpió, se restauraron los archivos
con Node y se repitió desde cero. Ninguna ejecución fallida se usa como evidencia
de rendimiento final.

## Reproducción

```powershell
$env:GPU_COST_DIRECTORY = 'docs/audits/fps-light-rejection/full-depth'
$env:GPU_COST_PHASE = 'fps-after'
npm run test:audit -- e2e/gpu-cost-review.spec.ts e2e/point-light-parity.spec.ts
```

La fase sólo nombra archivos; no activa optimizaciones. Para reproducir el antes,
retirar únicamente la selección por prefijo añadida en este seguimiento.
Las pruebas de paridad standard/physical y profundidad pasaron con tolerancia de
un nivel por canal. Se revisó la captura final de entrada. Persisten avisos previos
de Three y precisión del compilador WebGL, sin errores de consola en la ruta final.

Verificación de entrega: typecheck, lint, formato focal, 16 pruebas unitarias y
build aprobados. Build conserva los avisos de tamaño de chunk y tiempo de plugins.
`git diff --check` correcto. El E2E del inspector exterior pasó con arrastre, zoom,
reset y regreso a Pointer Lock. El del puente agotó inicialmente 60 s esperando
los controles durante la carga; repetido solo pasó con colisión, recorrido en ambos
sentidos y uso de la mesa. No se ampliaron los tiempos ni se omitieron aserciones.
