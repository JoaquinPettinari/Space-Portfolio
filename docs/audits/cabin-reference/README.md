# Cabina basada en la referencia del usuario

Esta auditoría conserva las capturas y mediciones de esa revisión. La modificación
posterior de paredes, techo y marcos se documenta en
[cabina de sección recta](../straight-cabin/README.md); el exportador de llegada
actual ya incorpora ese perfil.

La referencia pedía una llegada cálida, equipada y con más profundidad de
materiales. Esta revisión conserva la distribución y las interacciones, y trabaja
la geometría en Blender y la iluminación final en el juego.

## Cambios

- Techo con cassettes biselados, fijaciones, carcasas y difusores ámbar; indicadores
  cian empotrados en el marco lateral. Las tiras anteriores usan el acabado cálido.
- Sofá con cojines más redondeados, relieve de tapicería, costuras, almohadón y manta
  con pliegues/franjas/flecos estáticos. No se ejecuta simulación de tela.
- Traje completo, incluido pantalón y botas originales NASA; soporte de cuerpo
  completo y colisión hasta el piso. Se retira la rejilla que quedaría oculta.
- Cafetera, bandeja, libros, plantas, fotografías orbitales reutilizadas, mesa
  lateral e instrumento de anillos. Sin cajas sueltas en el recorrido central.
- Reflejos de las luminarias precalculados localmente y dos texturas de piso
  pequeñas para variación de acabado, sin cambiar exposición global ni agregar
  un efecto de postprocesado.
- Cielo existente reorientado y aclarado para mostrar la franja galáctica.

## Reproducción y propiedad de recursos

Desde la raíz del checkout:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' --background 'docs/assets/unified-ship/cruz-del-sur-interior-panels.blend' --python scripts/assets/export-arrival-cleanup.py -- --reference-cabin
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' --background --factory-startup --python scripts/assets/prepare-full-emu.py
```

El exportador reutiliza la misma evaluación/agrupación por material de las
versiones anteriores. El nuevo helper solo aporta decoración. La fuente unificada
y los GLB anteriores quedan intactos. La copia editable de los muebles y detalles
conserva nombres y modificadores en
`docs/assets/cabin-reference/cabin-reference-dressing.blend`; no pretende sustituir
la escena unificada completa. El traje tiene su propia receta y fuente NASA.

En runtime, geometrías y texturas GLTF siguen perteneciendo al loader. Los
materiales clonados, el render target PMREM y los mapas de piso propios se liberan
al desmontar. La reflexión solo se calcula al montar, no en cada cuadro; no es
una captura en vivo de los objetos. La oclusión de contacto del piso es una
aproximación estática basada en los colliders compartidos, empaquetada en R de la
textura de rugosidad existente (G conserva rugosidad). Se crean copias locales de
las geometrías del piso para UV1, conservando UV0 de las normales originales y
liberando las copias propias. No son sombras dinámicas.

## Presupuesto

| Asset                 |     Bytes | Triángulos | Lotes |
| --------------------- | --------: | ---------: | ----: |
| Llegada anterior      | 3.942.148 |     59.703 |    17 |
| Llegada de referencia | 6.708.104 |    116.848 |    25 |
| Detalles compartidos  |   726.640 |     13.380 |    28 |
| Traje completo        | 1.461.080 |     56.206 |     5 |

El aumento de geometría corresponde al techo, pliegues, bordes y hojas. No equivale
por sí mismo a un coste de cuadro determinado. Las texturas nuevas del modelo son
de 256 px; los límites del test de asset se actualizan a 7,2 MB, 28 lotes y 125.000
triángulos para esta variante. Los tests de rutas/puertas siguen comprobando las
mallas exportadas reales.

## Verificación

- `npm run test`: 78 archivos y 253 pruebas aprobadas en la integración final.
- Pruebas de recursos, normalización del traje, colliders y rutas sobre GLB real.
- `npm run test:e2e -- cabin-revision.spec.ts identity.spec.ts`: 2 aprobadas.
  Movimiento contra muebles, intentos por los extremos, recorrido central,
  acreditación y salida/reentrada en Pointer Lock real.
- `npm run test:audit -- cabin-lighting-review.spec.ts`: pasadas comparables antes,
  primera integración, equilibrada, final y con oclusión. Sin `console.error` ni
  excepciones. Se registran avisos existentes y advertencias de precisión ANGLE
  durante la compilación PMREM, sin fallo de shader.
- En Intel UHD, Chromium 156, 1280×720 y DPR1: de 65 a 71 draw calls y de 226.928 a
  296.740 triángulos. La mediana registrada pasó de 15,1 a 25,2 ms y P95 de 17,7 a
  34,9 ms. No mantiene 60 FPS en esta captura. Hay pequeñas diferencias de pose
  por la caminata real; no es un benchmark GPU aislado ni una garantía para otros
  equipos. [Método y resultados](lighting.md).
- [Antes](before.png), [vista final](grounded-wide.png). La revisión detectó y
  corrigió intersecciones de manta, follaje escaso y exceso de luz en techo.
- `npm run typecheck`, `npm run lint` y `npm run build`: aprobados. Build conserva
  el aviso de chunk mayor a 500 kB. El formato global conserva
  dos advertencias de JSON de auditorías previas ajenas al cambio.

Las capturas y métricas se toman con movimiento real y diagnóstico de solo lectura.
No se altera el estado interno ni se usa el servidor MCP como dependencia del test.
