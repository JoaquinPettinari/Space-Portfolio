"""Run with Blender Python. Resize licensed source maps without changing any scene."""
from pathlib import Path
import imbuf

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/assets/solar-system-sources'
TARGET = ROOT / 'public/textures/solar-system'
TARGET.mkdir(parents=True, exist_ok=True)

FILES = [
    ('8k_earth_daymap.jpg', 'earth-day', 4096),
    ('2k_earth_nightmap.jpg', 'earth-night', 1024),
    ('2k_earth_clouds.jpg', 'earth-clouds', 2048),
    ('8k_stars_milky_way.jpg', 'milky-way', 4096),
] + [(f'2k_{source}.jpg', name, 512) for source, name in [
    ('mercury', 'mercury'), ('venus_atmosphere', 'venus'), ('mars', 'mars'),
    ('jupiter', 'jupiter'), ('saturn', 'saturn'), ('uranus', 'uranus'),
    ('neptune', 'neptune'), ('moon', 'moon'),
]]

for source, name, width in FILES:
    image = imbuf.load(str(SOURCE / source))
    try:
        image.resize((width, width // 2))
        image.file_type = 'WEBP'
        image.quality = 90
        imbuf.write(image, filepath=str(TARGET / (name + '.webp')))
    finally:
        image.free()
    print(name, (TARGET / (name + '.webp')).stat().st_size)
