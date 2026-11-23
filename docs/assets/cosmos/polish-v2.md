# Asterion — pulido de mundos v2

Archivo independiente: `asterion-expanse-v2.blend`. Se parte de la escena
aprobada y se conserva el mundo galáctico, sus texturas empaquetadas y la
orientación. La versión anterior permanece intacta.

- Vesper usa un mapa esférico de 2048 × 1024 con 480 impactos de radios y
  profundidades diferentes, bordes y depósitos superpuestos. Se combina con
  el relieve geológico existente, reemplazando el patrón uniforme de cráteres.
- Nacre e Ithaca tienen cinturones por latitud, anchuras alteradas por turbulencia
  de varias escalas y una tormenta ovalada. Los materiales son difusos y no
  incorporan relieve artificial de madera en las nubes.
- Orison combina hielo moteado con fracturas parciales deformadas. Las grietas
  no forman una cuadrícula homogénea sobre toda la superficie.
- Los anillos mantienen sus huecos físicos y usan dispersión difusa/translúcida,
  variación radial de color y densidad óptica. La sombra del planeta sobre los
  anillos sale de la misma luz solar; no es una marca pintada. El ecuador de
  Nacre queda alineado con el plano de sus anillos.
- Se conserva un único Sol, con bordes de sombra más definidos y halos
  atmosféricos más tenues. Los halos siguen siendo una aproximación por shader,
  no simulación volumétrica física de atmósferas.
- Lumen y Cinder quedan más presentes y altos en los ventanales laterales.
  Halo aporta un satélite pequeño a la vista superior, conservando cielo oscuro.
  La revisión desde las ventanas ajustó el centro de Lumen a Z = 3,5 m
  en Blender (X = −90, Y = 4, escala 1,44), despejando el marco superior
  de llegada y el montante posterior del lateral del puente.
  Cinder conserva su ubicación elevada.

`scripts/assets/polish-cosmos-worlds.py` genera esta versión desde el archivo
anterior. `-- --render` produce vistas frontal, trasera y detalle de anillos.
`polish-v2-validation.json` registra hash de origen, luz única y recursos.
Las diez cámaras de las ventanas y su revisión contextual se conservan en
`asterion-window-review.blend`; `window-composition-validation.json` registra
sus posiciones y los hashes de las fuentes. Las imágenes `window-01.png` a
`window-10.png` cubren llegada, corredor, proa y techo. Los vidrios de esta copia
son neutros para estudiar el encuadre; no validan el vidrio ni las colisiones
del runtime. Las vistas afectadas por el ajuste de Lumen se vuelven a renderizar.

Se verificó sintaxis Python, formato de documentación e integridad de fuentes.
No se ejecutaron pruebas de la app en esta pasada exclusivamente de Blender.

Estos materiales son de autoría Blender. La app no cambia y aún requiere
horneado/optimización y medición antes de exportar esta versión al navegador.
