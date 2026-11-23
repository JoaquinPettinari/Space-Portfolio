"""Read-only authoring/export capability inspection."""
import bpy
import json
from pathlib import Path

scene = bpy.context.scene
print('ASTERION_INSPECT', json.dumps({
    'image_formats':[x.identifier for x in scene.render.image_settings.bl_rna.properties['file_format'].enum_items],
    'gltf_image_formats':[x.identifier for x in bpy.ops.export_scene.gltf.get_rna_type().properties['export_image_format'].enum_items],
    'bake_types':[x.identifier for x in bpy.ops.object.bake.get_rna_type().properties['type'].enum_items],
    'export_options':[x.identifier for x in bpy.ops.export_scene.gltf.get_rna_type().properties if any(s in x.identifier for s in ('quality','webp','image','unlit'))],
    'objects':[{'name':o.name,'location':list(o.location),'scale':list(o.scale),'vertices':len(o.data.vertices),'uv':len(o.data.uv_layers)} for o in scene.objects if o.type=='MESH' and not o.name.startswith('DEBRIS')],
}))
