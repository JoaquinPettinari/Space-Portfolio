# Solar System Scope maps

Author: [Solar System Scope](https://www.solarsystemscope.com/textures/).
License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
Source URL pattern: `https://www.solarsystemscope.com/textures/download/<source filename>`.
Downloaded on 2026-11-16. The author's source page describes maps based on NASA imagery and elevation data, with adjusted colors and some reconstructed regions.

| Runtime file      | Source                  | Width |
| ----------------- | ----------------------- | ----: |
| earth-day.webp    | 8k_earth_daymap.jpg     |  4096 |
| earth-night.webp  | 2k_earth_nightmap.jpg   |  1024 |
| earth-clouds.webp | 2k_earth_clouds.jpg     |  2048 |
| milky-way.webp    | 8k_stars_milky_way.jpg  |  4096 |
| mercury.webp      | 2k_mercury.jpg          |   512 |
| venus.webp        | 2k_venus_atmosphere.jpg |   512 |
| mars.webp         | 2k_mars.jpg             |   512 |
| jupiter.webp      | 2k_jupiter.jpg          |   512 |
| saturn.webp       | 2k_saturn.jpg           |   512 |
| uranus.webp       | 2k_uranus.jpg           |   512 |
| neptune.webp      | 2k_neptune.jpg          |   512 |
| moon.webp         | 2k_moon.jpg             |   512 |

Adaptations: resampling and WebP quality 90 encoding. Custom rendering adds directional illumination, Earth cloud blending, night lights, ocean highlights and an atmospheric rim. Saturn's ring bands are procedural. Body positions and sizes are cinematic, not a simultaneous view of actual solar-system orbits.

Original downloaded JPGs are retained in `docs/assets/solar-system-sources`, outside the public build. Rebuild these maps using Blender Python and `scripts/assets/prepare-solar-textures.py`. Player-facing attribution is available at `/credits.html`, linked from pause.
