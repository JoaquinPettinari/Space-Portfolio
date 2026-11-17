"""Close the final review: uninterrupted floor signs and borderless preview sky."""
import bpy,bmesh,json
from pathlib import Path
s=bpy.context.scene;assert s.get('turnaround_revision') and not s.get('turnaround_review_finished')
col=bpy.data.collections['17 Turnaround deck panels'];mat=bpy.data.materials['STUDIO / Powder coated structural rails']
for z in [13.0,17.2]:
 a,b,c=1.245,.395,.025
 points=[(-a+c,-b),(a-c,-b),(a,-b+c),(a,b-c),(a-c,b),(-a+c,b),(-a,b-c),(-a,-b+c)]
 vs=[(x,-(z+zz),y) for y in [.0095,.012] for x,zz in points]
 faces=[tuple(range(8)),tuple(reversed(range(8,16)))]+[(i,i+8,(i+1)%8+8,(i+1)%8) for i in range(8)]
 d=bpy.data.meshes.new('Single access sign inset');d.from_pydata(vs,[],faces);d.materials.append(mat);d.update()
 o=bpy.data.objects.new('REV / Continuous access sign plate',d);col.objects.link(o)
for o in col.objects:
 if 'Door direction arrow' in o.name:
  bm=bmesh.new();bm.from_mesh(o.data);bm.normal_update();bmesh.ops.reverse_faces(bm,faces=[f for f in bm.faces if f.normal.z<0]);bm.to_mesh(o.data);bm.free()
# Camera-only spherical sky: original ambient/diffuse lighting remains intact.
nodes=s.world.node_tree.nodes;links=s.world.node_tree.links
background=next(n for n in nodes if n.type=='BACKGROUND');output=next(n for n in nodes if n.type=='OUTPUT_WORLD')
env=nodes.new('ShaderNodeTexEnvironment')
env.image=bpy.data.images.load(str(Path(bpy.data.filepath).parents[3]/'public/textures/cruz-del-sur/deep-space.webp'),check_existing=False)
env.image.name='MASTER / Full spherical star field';env.image.pack()
stars=nodes.new('ShaderNodeBackground');stars.inputs['Strength'].default_value=1.7;links.new(env.outputs['Color'],stars.inputs['Color'])
path=nodes.new('ShaderNodeLightPath');mix=nodes.new('ShaderNodeMixShader');links.new(path.outputs['Is Camera Ray'],mix.inputs[0]);links.new(background.outputs[0],mix.inputs[1]);links.new(stars.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],output.inputs['Surface'])
back=bpy.data.objects['MASTER / Space visible beyond windows'];back.visible_camera=False;back.visible_glossy=False;back['preview_light_only']=True
bpy.data.collections['12 Space backdrop']['exclude_runtime_export']=True
s['turnaround_review_finished']=1
folder=Path(bpy.data.filepath).parent;report=json.loads((folder/'turnaround-audit.json').read_text())
active=[o for o in s.objects if not o.get('archived')]
report.update(activeObjects=len(active),activeGeometry=sum(o.type in {'MESH','CURVE','FONT'} for o in active),
 floorSignPlates='Single chamfered faces at y=.012, below text y=.014',
 panoramaBackground='Camera-only spherical environment, original ambient and backdrop light retained')
(folder/'turnaround-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
version=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=version
print('TURNAROUND_REVIEW_FINISHED',len(active))
