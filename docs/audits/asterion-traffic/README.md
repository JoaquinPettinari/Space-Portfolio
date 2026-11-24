# Asterion: composición y tráfico — 23 de noviembre de 2026

- Vesper, el planeta grande de la captura, y su atmósfera salen de la escena
  activa. Selene, su luna, se conserva. `hiddenBodies` es la única regla de
  exclusión para geometría y halo; se aplica al clon, sin alterar la caché.
- La composición Blender sin Vesper queda en
  `docs/assets/cosmos/asterion-expanse-v3-traffic.blend`. El maestro v2 se conserva.
  Las animaciones y los detalles siguientes se generan en la app; ese archivo
  Blender sólo registra la exclusión del planeta, no esos efectos de ejecución.
- La deriva relativa usa los mismos límites espaciales, ahora con ciclos de
  240 s para mundos y 120 s para fragmentos. Cámara y galaxia permanecen estables.
- Ítaca recibe tres arcos artificiales abiertos y nodos de señalización orbital,
  con rotación lenta independiente: dos dibujos, sin luces.
- La nave auxiliar se reemplaza por un courier panelado, con cockpit, radiadores,
  antenas, motores y filamentos de escape. 1.688 triángulos en seis lotes opacos,
  colores precalculados por vértice y ninguna textura o luz adicional. Su proa
  sigue la tangente de una ruta cerrada con cambios de altura y leve inclinación.
- Seis trayectorias de meteoros distribuidas alrededor de la nave comparten un
  dibujo instanciado y una textura procedural de 64 × 16. Sólo una estela puede
  estar activa a la vez; aparece/desaparece suavemente antes de reciclarse.

Pausa y pestaña oculta congelan los relojes; movimiento reducido congela nave,
mundos y arcos y oculta las estelas. No hay estado React actualizado por cuadro,
luces dinámicas nuevas ni cambios a controles o colisiones.

## Comprobación

La revisión nativa `ASTERION_AUDIT=traffic` pasó por las ocho vistas principales,
comprobó ausencia de errores de consola, avance de nave/arco/meteoritos, pausa,
reanudación y movimiento reducido. Las capturas y `after.json` corresponden a
esa ejecución. No se usó un mock de Pointer Lock.

Tiempos medianos de la ejecución final: entrada 40,4 ms; proa frontal 29,3 ms;
proa lateral 22,2/19,1 ms; pasillo lateral 23,4/23,2 ms. Son muestras de esta
ejecución, no un A/B aislado ni una promesa de FPS. Los contadores por vista
quedan en `after.json`. La descarga del exterior permanece en 2.871.730 bytes:
el GLB de origen sigue conteniendo Vesper para conservar una revisión reversible;
su geometría/material no se monta ni se dibuja en la escena activa.

13 pruebas unitarias pasaron: exclusión sin mutar la fuente, geometría/materiales
compartidos, presupuesto y cleanup del courier, límites/cierre de trayectorias,
orientación de proa, ráfagas espaciadas, independencia de FPS y frustum.

También pasaron la navegación E2E nativa, la revisión aislada del courier,
`npm run lint`, `npm run typecheck` y `npm run build`. `git diff --check` quedó
limpio. El formato global mantiene tres avisos previos, ajenos a estos cambios:
`docs/assets/cabin-master/assembly.json`,
`docs/assets/unified-ship/chairs-plants-refinement/audit.json` y
`docs/assets/unified-ship/consoles-orbit-refinement/audit.json`.

`courier-detail.png` es un render aislado del mismo modelo usado por la app;
las capturas `after-*.png` son del recorrido real, sin cambiar cámara por atajos.

```powershell
$env:ASTERION_AUDIT = 'traffic'
$env:ASTERION_PHASE = 'after'
npm run test:audit -- e2e/asterion-review.spec.ts --grep reviews
npm run test:audit -- e2e/courier-review.spec.ts
```
