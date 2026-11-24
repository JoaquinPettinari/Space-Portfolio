"""Background-only delivery render of the authored docking master.

blender --background docs/assets/docking-intro/cruz-del-sur-docking-intro.blend
  --python scripts/assets/render-docking-video.py [-- --benchmark]
Never saves or modifies the source .blend. No external encoder dependency.
"""
import bpy
import argparse
import hashlib
import json
import struct
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/video'
OUT.mkdir(parents=True, exist_ok=True)
parser = argparse.ArgumentParser()
parser.add_argument('--benchmark', action='store_true')
parser.add_argument('--output-name', default='docking')
parser.add_argument('--samples', type=int, choices=(8,16,32,64), default=8)
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
if not args.output_name.replace('-', '').isalnum():
    raise ValueError('Output name must contain only letters, digits and hyphens')
scene = bpy.context.scene
scene.render.resolution_x, scene.render.resolution_y = 1280, 720
scene.render.resolution_percentage = 100
scene.render.fps, scene.render.fps_base = 30, 1
scene.frame_start, scene.frame_end = 1, 240
scene.eevee.taa_render_samples = args.samples
scene.eevee.use_raytracing = False
scene.eevee.use_shadows = True
scene.eevee.shadow_ray_count = 1
scene.eevee.shadow_step_count = 4
scene.render.use_compositing = False
scene.render.use_sequencer = False
scene.render.film_transparent = False


def enum(owner, prop, wanted):
    values = [item.identifier for item in owner.bl_rna.properties[prop].enum_items]
    if wanted not in values:
        raise RuntimeError(f'{prop} requires {wanted}, got {values}')
    setattr(owner, prop, wanted)


def atoms(data, start=0, end=None):
    end = len(data) if end is None else end
    position = start
    while position < end:
        if end-position < 8:
            raise RuntimeError('Truncated MP4 atom')
        size, kind = struct.unpack_from('>I4s', data, position)
        header = 8
        if size == 1:
            size = struct.unpack_from('>Q', data, position+8)[0]
            header = 16
        elif size == 0:
            size = end-position
        if size < header or position+size > end:
            raise RuntimeError('Invalid MP4 atom length')
        yield position, size, kind, header
        position += size


def faststart(path):
    """Relocate the final moov before mdat and adjust absolute chunk offsets."""
    data = path.read_bytes()
    top = list(atoms(data))
    moov = next(a for a in top if a[2] == b'moov')
    mdat = next(a for a in top if a[2] == b'mdat')
    if moov[0] < mdat[0]:
        return
    if moov[0]+moov[1] != len(data):
        raise RuntimeError('Expected trailing moov for safe faststart relocation')
    block = bytearray(data[moov[0]:moov[0]+moov[1]])
    containers = {b'moov', b'trak', b'mdia', b'minf', b'stbl'}

    def adjust(start, end):
        for pos, length, kind, header in atoms(block, start, end):
            if kind in containers:
                adjust(pos+header, pos+length)
            elif kind in {b'stco', b'co64'}:
                count = struct.unpack_from('>I', block, pos+header+4)[0]
                width, code = (4, '>I') if kind == b'stco' else (8, '>Q')
                for i in range(count):
                    offset = pos+header+8+i*width
                    value = struct.unpack_from(code, block, offset)[0]
                    # All media chunks precede moov in Blender's ordinary MP4.
                    if not mdat[0] <= value < moov[0]:
                        raise RuntimeError('Unexpected media chunk offset')
                    struct.pack_into(code, block, offset, value+len(block))
    adjust(0,len(block))
    path.write_bytes(data[:mdat[0]]+block+data[mdat[0]:moov[0]])


started = time.perf_counter()
if args.benchmark:
    scene.frame_set(1)
    enum(scene.render.image_settings, 'file_format', 'JPEG')
    scene.render.image_settings.quality = 88
    scene.render.filepath = str(OUT / f'{args.output_name}-poster.jpg')
    bpy.ops.render.render(write_still=True)
    print('DOCKING_BENCHMARK', json.dumps({'seconds':time.perf_counter()-started}),flush=True)
else:
    if hasattr(scene.render.image_settings, 'media_type'):
        enum(scene.render.image_settings, 'media_type', 'VIDEO')
    enum(scene.render.image_settings, 'file_format', 'FFMPEG')
    enum(scene.render.ffmpeg, 'format', 'MPEG4')
    enum(scene.render.ffmpeg, 'codec', 'H264')
    enum(scene.render.ffmpeg, 'constant_rate_factor', 'MEDIUM')
    enum(scene.render.ffmpeg, 'ffmpeg_preset', 'GOOD')
    enum(scene.render.ffmpeg, 'audio_codec', 'NONE')
    scene.render.ffmpeg.gopsize = 30
    scene.render.ffmpeg.use_max_b_frames = True
    scene.render.ffmpeg.max_b_frames = 2
    scene.render.filepath = str(OUT / f'{args.output_name}-intro.mp4')
    bpy.ops.render.render(animation=True)
    path = OUT / f'{args.output_name}-intro.mp4'
    if not path.is_file():
        # Blender may append the rendered frame range to the movie filename.
        candidates = sorted(OUT.glob(f'{args.output_name}-intro*.mp4'),key=lambda p:p.stat().st_mtime)
        if not candidates:
            raise RuntimeError('Blender did not produce the expected video')
        candidates[-1].replace(path)
    faststart(path)
    result = {'file':f'/video/{args.output_name}-intro.mp4','source':bpy.data.filepath,'frames':240,'fps':30,'duration':8,
              'resolution':[1280,720],'codec':'H264','audio':False,'faststart':True,'renderSamples':args.samples,
              'renderSeconds':time.perf_counter()-started,'bytes':path.stat().st_size,
              'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    metadata = 'video-export.json' if args.output_name == 'docking' else f'{args.output_name}-video-export.json'
    (ROOT/'docs/assets/docking-intro'/metadata).write_text(json.dumps(result,indent=2))
    print('DOCKING_VIDEO',json.dumps(result),flush=True)
