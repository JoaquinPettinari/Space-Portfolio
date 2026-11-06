# Fuentes del contenido del portfolio

Los datos editables están en `src/data/portfolio.ts`.

- **Joaquin Pettinari Resume.pdf**: experiencia laboral y docente, formación, idiomas, tecnologías, correo y enlaces profesionales. El PDF descargable es una copia íntegra del archivo recibido. No se muestra el teléfono en las pantallas del portfolio.
- **Joaquin Pettinari Tesis.pdf**: AccesiWeb, tesina de licenciatura de julio de 2024. Introducción/objetivos (páginas 5–6), desarrollo (37–52), pruebas (53–72) y conclusiones (73–75). Se conserva el alcance académico; no se afirma certificación legal ni cobertura automática completa.
- **COPIA de Memoria Joaquin Pettinari trabajo final.docx**: RouteWise. Resumen, resultados, tecnologías, limitaciones y anexo de repositorios. Se explicitan datos simulados, ausencia de reservas y validación manual. No se publican la memoria completa ni supuestas demos activas.

## Pendiente de confirmar

El CV consigna 01/2015 para Advanced React y enlaza una publicación de 2025. La aplicación muestra la certificación sin fecha; el PDF permanece sin cambios. El puesto de Blue Alba se muestra como actual tal como figura en el CV recibido. No se verificó la disponibilidad pública de los repositorios enlazados en la memoria.

## Project screenshots and ambient sound

- RouteWise screenshots extracted from `word/media/image15.png` and `image16.png` in the supplied master's DOCX (landing page and itinerary).
- AccesiWeb screenshots extracted from PDF pages 48 and 50 of the supplied thesis (analysis overview and detailed findings).
- Assets are resized to at most 1440 px and encoded as WebP under `public/images/projects`. Original interface language is preserved in screenshots; portfolio copy and captions are English.
- Ambient ship sound is synthesized locally with Web Audio, enabled only by the visitor's sound button. No external recording or audio download is used.
- The astronaut arm component is retained for future interactions but is not mounted in the default scene.

The hologram portrait (`public/images/crew-portrait.webp`) is the actual embedded photograph from page 1 of the supplied CV, extracted at 224 × 191 pixels. It is displayed as an archived still with a blue shader, not represented as a video or live feed.
