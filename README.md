# Space Portfolio

Portfolio como una pequeña estación espacial explorable. Lo construimos en pasos pequeños, entendiendo cada concepto.

## Ejecutar

- `npm install`: instalar dependencias.
- `npm run dev`: iniciar desarrollo.
- `npm run build`: comprobar TypeScript y generar producción.
- `npm run lint`: revisar el código.
- `npm run preview`: servir la compilación de producción.

## Base técnica

- React + TypeScript + Vite: aplicación, tipos y desarrollo.
- Three.js: objetos, cámaras, materiales y renderizado 3D.
- React Three Fiber: permite describir la escena de Three.js con componentes React.
- Drei: helpers para las próximas etapas; todavía no hace falta usarlo.

## Estructura actual

```text
src/
  main.tsx                Entrada de React
  App.tsx                 Página y texto HTML
  index.css               Estilos globales
  game/
    Game.tsx              Canvas, cámara e iluminación
    world/
      Greybox.tsx         Piso y cubo
```

Agregaremos player, interaction y missions cuando implementemos esos sistemas.

## Primera práctica: escena fija

`Canvas` prepara el renderizador y la escena. Una cámara en `[4, 3, 6]` mira hacia el cubo. Cada `mesh` une una geometría (forma) con un material (superficie). `meshStandardMaterial` responde a las luces.

Convención: una unidad representa un metro. X es el eje lateral, Y la altura y Z la profundidad. Las posiciones de estas geometrías se refieren a su centro: el cubo de un metro debe estar en Y = 0.5 para apoyar en el piso. Las rotaciones se expresan en radianes.

La escena es estática y usa `frameloop="demand"` para dibujar cuando sea necesario. Al implementar movimiento continuo revisaremos el bucle y `useFrame`.

Experimentos en `Greybox.tsx`:

1. Cambiar la posición del cubo a `[2, 0.5, 0]` y observar el eje X.
2. Cambiar su altura a 2 en `boxGeometry` y su posición Y a 1 para mantenerlo apoyado.
3. Cambiar el color del material.
4. Cambiar la posición de la luz en `Game.tsx` para observar las caras iluminadas. Todavía no hay sombras proyectadas.

## Próximos pasos

1. Completar v0.1: cuatro paredes, muebles simples, mouse look y movimiento WASD.
2. v0.2: colisiones.
3. v0.3: raycasting e interacción.
4. v0.4: computadora con información profesional.

La escena actual es el primer paso de v0.1, todavía no un FPS. Física, modelos, misiones y efectos se incorporarán cuando hagan falta.

Documentación: https://r3f.docs.pmnd.rs/getting-started/your-first-scene
