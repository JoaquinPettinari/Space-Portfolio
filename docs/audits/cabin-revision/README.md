# Revisión de cabina e inspección exterior

Fecha: 2026-11-17. Implementa los ocho puntos de las capturas del usuario.

## Geometría y circulación

- EMU: brazos y antebrazos orientados hacia abajo en la exportación; conserva
  hombros, guantes, cinco materiales y 41.678 triángulos. Fuente original intacta.
  [Render](../../assets/nasa-emu/hanging-preview.png).
- Banco recto de tres plazas, cojines redondeados, soporte lumbar, apoyabrazos y
  almacenaje integrado. El cierre trasero sigue la curva original del casco.
- El banco técnico tiene zócalo continuo y retornos que impiden acceder por detrás.
- Se retiran las dos cajas de transporte sueltas y se detalla el panel de servicio
  junto al botiquín con junta, herrajes, asa, rejilla y señalética.
- `src/game/world/arrivalCabinLayout.json` es la fuente común de dimensiones para
  el exportador y los colliders. No se modifica el recorrido central ni la puerta
  automática de acreditación.

Exportación reproducible, desde la raíz del proyecto, con una instancia separada:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' --background 'docs/assets/unified-ship/cruz-del-sur-interior-panels.blend' --python scripts/assets/export-arrival-cleanup.py -- --cabin-revision
```

El exportador no guarda el `.blend` ni sustituye los GLB anteriores. Selecciona los
nuevos archivos mediante `refinedArtAssets.ts`. El helper `revise-arrival-cabin.py`
aporta geometría al exportador existente, sin duplicar su manejo de materiales,
normales, UVs o agrupación.

| Assets de llegada y detalles |     Antes |   Después |
| ---------------------------- | --------: | --------: |
| Lotes de geometría           |        45 |        45 |
| Triángulos                   |    77.109 |    73.083 |
| Bytes                        | 4.964.988 | 4.668.788 |

Son medidas de los archivos, no una medición de FPS. Sin luces ni sombras nuevas
en la cabina. El visor exterior sí usa luces propias sin sombras y un contexto
WebGL adicional mientras está abierto; renderiza solo al cambiar su vista.

## Interacción

La consola panorámica central abre Exterior Inspection con E. Arrastre orbita,
rueda acerca/aleja, flechas y botones ofrecen la misma operación. Home/Reset
restablece la vista; E/Escape o Return regresan al recorrido. La nave está centrada
en el origen del visor y no permite pan. Usa el casco y cielo locales existentes.

Radio: contacto a 0,5 s, pulsación física y efecto simultáneos, retirada hasta
0,85 s. Acreditación: presentación inicial sin indicador de carga; escaneo y sonido
empiezan al contacto. Se conserva pausa, movimiento reducido y limpieza de recursos.

## Verificación

- `npm run test`: 76 archivos, 248 pruebas aprobadas.
- `npm run typecheck`, `npm run lint`, `npm run build`: aprobados.
- El build mantiene el aviso de chunk mayor que 500 kB.
- `npm run format:check`: detectó dos JSON preexistentes de auditorías antiguas
  fuera del alcance; se conservan sin cambios. Los archivos de esta revisión se
  formatean y comprueban de forma específica.
- `npm run test:e2e -- identity.spec.ts radio.spec.ts`: 2 aprobadas. La medición
  dentro del navegador verificó al menos 490 ms entre E y reproducción; también
  las cinco pistas, volumen, acreditación y regreso con Pointer Lock real.
- `npm run test:e2e -- navigation.spec.ts cabin-revision.spec.ts`: 2 aprobadas.
  Movimiento real contra frente, extremos y huecos del mobiliario; ruta central
  libre. Órbita por arrastre, rueda, botones y teclado; reset, foco inicial,
  tamaño del Canvas, Escape y reentrada en Pointer Lock comprobados.
- Sin errores de consola ni excepciones en las cuatro pruebas nativas. Persisten
  avisos existentes de obsolescencia de Three.Clock/inicialización de Rapier.
- Capturas finales inspeccionadas: [banco](straight-lounge.png),
  [paneles técnicos](service-bank.png), [escotilla](side-service-hatch.png),
  [visor orbital](exterior-dragged.png), [traje](hanging-suit.png).
- Una prueba inicial intentaba atravesar el collider del traje para llegar detrás
  del banco; se corrigió la ruta y se comprobó que ambos extremos bloquean el paso.
  La revisión visual también detectó y corrigió el fondo que tapaba las rejillas y
  la medición del Canvas dentro del panel transformado.
- No se midieron FPS/GPU ni se ejecutó toda la suite E2E histórica. Queda pendiente
  la valoración estética del usuario y la comprobación en sus otros navegadores.
