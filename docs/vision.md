# Visión del portfolio

Un pequeño videojuego en primera persona que también funciona como portfolio profesional. El visitante explora una habitación de una nave espacial y descubre experiencia, proyectos, CV y contacto. El proyecto sirve para aprender gráficos 3D y desarrollo de juegos sobre una base de React y TypeScript.

La ambientación y los detalles son flexibles. Priorizamos una habitación pequeña, controles cómodos y versiones jugables antes de ampliar la experiencia.

## Estado y próximos hitos

| Hito               | Alcance                                              | Estado                                         |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------- |
| v0.1 Greybox       | Piso, paredes, cámara, WASD y mouse con Pointer Lock | Implementado; seguir verificando controles     |
| v0.2 Física        | Rapier, cápsula del jugador y colisiones             | Implementado; validar regresiones en navegador |
| v0.3 Interacciones | Mirada, distancia y tecla E                          | Pendiente                                      |
| v0.4 Computadora   | Interfaz de sistema ficticio y regreso al modo FPS   | Pendiente                                      |
| v0.5 Misiones      | Objetivos y progresión comprobable                   | Pendiente                                      |
| v0.6 Espacio       | Ventana, estrellas, planeta e iluminación            | Pendiente                                      |
| v0.7 Assets        | Sustituir volúmenes por modelos GLTF                 | Pendiente                                      |
| v0.8 Audio         | Ambiente e interacciones                             | Pendiente                                      |
| v0.9 Pulido        | Materiales, animación y rendimiento medido           | Pendiente                                      |
| v1.0 Portfolio     | CV, proyectos, experiencia, contacto y publicación   | Pendiente                                      |

El usuario confirmó que la entrada sin aceleración resolvió los tirones del mouse en Opera.

## Acceso a la información

La versión publicada debe ofrecer una alternativa rápida y accesible para quien no quiera o no pueda jugar, también sin WebGL. CV y contacto no deben depender de completar misiones. El usuario aplazó expresamente esta implementación durante la configuración del entorno; permanece como requisito pendiente.

## Etapa actual aprobada

Observatorio azul con ventanas y techo de vidrio, mesa central, silla y computadora. Se implementan sentarse, enfoque de pantalla y regreso a caminar; las aplicaciones internas quedan para más adelante. Estrellas en movimiento, planeta rotatorio y puerta trasera cerrada completan esta primera ambientación. La tabla de hitos describe el plan original: las bases de v0.3, v0.4 y v0.6 se adelantaron por pedido del usuario. No incorporar Zustand ni GSAP sin una necesidad concreta.
