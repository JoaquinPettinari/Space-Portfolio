"""Capture the Blender maquette only; save the canonical blend with a prior backup.
Order: maquette-side-reference-panels, fit-side-reference-panels,
finish-side-reference-foliage, then this script. No GLB/runtime export.
"""
import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
s=bpy.context.scene
out=ROOT/'docs/assets/unified-ship/side-panels-reference'
out.mkdir(exist_ok=True)
assert (ROOT/'docs/assets/unified-ship/before-side-panel-reference-pass.blend').exists()
for name,color in [('Graphite ceramic armor',(.023,.032,.042)),('Brushed titanium',(.065,.08,.09))]:
 m=bpy.data.materials['CDS NICHE / '+name];bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 bs.inputs['Base Color'].default_value=(*color,1);m.diffuse_color=(*color,1)
for m in bpy.data.materials:
 if m.name.startswith('CDS NICHE /') and m.use_nodes:
  for n in m.node_tree.nodes:
   if n.type=='BUMP':n.inputs['Distance'].default_value=.001;n.inputs['Strength'].default_value=.1
bs=next(n for n in bpy.data.materials['CDS NICHE / Warm protected LED diffuser'].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
bs.inputs['Base Color'].default_value=(1,.45,.12,1);bs.inputs['Emission Color'].default_value=(1,.45,.12,1);bs.inputs['Emission Strength'].default_value=3
bs=next(n for n in bpy.data.materials['CDS NICHE / Ivory lettering'].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
bs.inputs['Emission Color'].default_value=(.65,.69,.64,1);bs.inputs['Emission Strength'].default_value=.08
bs=next(n for n in bpy.data.materials['CDS NICHE / Diagnostics screen'].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
bs.inputs['Emission Strength'].default_value=1.2;bs.inputs['Specular IOR Level'].default_value=.1
for name in ['CDS POLISH / Niche warm practical -3.05','CDS POLISH / Niche warm practical 3.05']:
 bpy.data.objects[name].data.color=(1,.55,.24)
for name,x,cx in [('UNIFIED / Reference technical cassette',.95,2.86),('UNIFIED / Reference specimen cassette',-.95,-2.86)]:
 c=bpy.data.objects[name];c.location=(x,1.8,1.75);c.rotation_euler=(Vector((cx,-1.3,1.52))-c.location).to_track_quat('-Z','Y').to_euler()
 c.data.lens=38;c.data.sensor_fit='VERTICAL';c.data.sensor_height=36
c=bpy.data.objects['UNIFIED / Reference paired side cassettes'];c.location=(0,5.8,1.75);c.rotation_euler=(Vector((0,-1.5,1.5))-c.location).to_track_quat('-Z','Y').to_euler();c.data.lens=32
formats=[i.identifier for i in s.render.image_settings.bl_rna.properties['file_format'].enum_items]
assert 'PNG' in formats
s.render.image_settings.file_format='PNG'
s.eevee.taa_render_samples=96
s.render.resolution_percentage=100
for label,camera in [('technical','UNIFIED / Reference technical cassette'),('specimen','UNIFIED / Reference specimen cassette'),('paired','UNIFIED / Reference paired side cassettes')]:
 s.camera=bpy.data.objects[camera]
 s.render.resolution_x=1600 if label=='paired' else 1000
 s.render.resolution_y=1000 if label=='paired' else 1400
 s.render.filepath=str(out/(label+'.png'))
 bpy.ops.render.render(write_still=True)
collection=bpy.data.collections['UNIFIED / 13 Reference side cassettes - Blender only']
points=[o.matrix_world@v.co for o in collection.objects if o.type=='MESH' for v in o.data.vertices]
report={'scene':s.name,'new_collection':collection.name,'mesh_batches':len(collection.objects),
 'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in collection.objects if o.type=='MESH'),
 'lights_total':sum(o.type=='LIGHT' for o in s.objects),'additional_lights':0,
 'bounds_min':[min(p[i] for p in points) for i in range(3)],'bounds_max':[max(p[i] for p in points) for i in range(3)],
 'door_clearance_x':min(abs(p.x) for p in points),
 'archived_original_meshes':len(bpy.data.collections['SOURCE / Side cassette prior geometry'].objects),
 'runtime_exported':False,'scope':'Blender reference maquette; no game code, GLB or collider edits'}
(out/'audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
# Open on the paired composition. Hide only preview helpers in the viewport.
s.eevee.taa_render_samples=64
bpy.ops.object.select_all(action='DESELECT')
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_perspective='CAMERA'
   area.spaces.active.overlay.show_overlays=False
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/unified-ship/cruz-del-sur-interior-panels.blend'))
print('SAVED',report)
