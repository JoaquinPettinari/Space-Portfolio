"""Small shelf finishing pass. Preserve every display prop and photograph."""
from pathlib import Path
import bpy,ast,json,hashlib
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/transition-master'
SOURCE=OUT/'transition-shelves-personal-photos.blend'
digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE));scene=bpy.context.scene
protected=set(o for o in scene.objects if o.name.startswith(('PHOTO /','BOOK /','DISPLAY /')))
for root in list(protected):protected.update(root.children_recursive)
def protected_signature():
    values=[]
    for o in sorted(protected,key=lambda item:item.name):
        geometry=[]
        if o.type=='MESH':geometry=[tuple(v.co) for v in o.data.vertices]
        elif o.type=='CURVE':geometry=[tuple(p.co) for s in o.data.splines for p in s.points]
        uv=[[tuple(p.uv) for p in layer.data] for layer in o.data.uv_layers] if o.type=='MESH' else []
        values.append((o.name,tuple(tuple(row) for row in o.matrix_world),geometry,uv))
    return hashlib.sha256(repr(values).encode()).hexdigest()
protected_before=protected_signature()
details=bpy.data.collections['05 Fasteners seals and labels'];plants=details
def xyz(p):return Vector((p[0],-p[2],p[1]))
for file,names in [('build-transition-master.py',['box']),('detail-transition-shelves.py',['mat'])]:
    tree=ast.parse((ROOT/'scripts/assets'/file).read_text())
    for name in names:
        node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==name);exec(compile(ast.Module(body=[node],type_ignores=[]),'finish-helper','exec'))
steel=bpy.data.materials['TRANSITION / Brushed titanium'];rubber=bpy.data.materials['TRANSITION / Recessed pressure seals']
edge=mat('Shelf satin machined end caps',(.16,.17,.18),.72,.38)
soft=mat('Shelf silicone support pads',(.027,.030,.029),0,.93)
diffuser=mat('Shelf opal diffuser casing',(.43,.38,.29),.04,.68)
# Variation belongs only to new hardware; shared master materials stay unchanged.
nodes=edge.node_tree.nodes;links=edge.node_tree.links;p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=110
mapping=nodes.new('ShaderNodeMapRange');mapping.inputs['To Min'].default_value=.30;mapping.inputs['To Max'].default_value=.47;links.new(noise.outputs['Fac'],mapping.inputs['Value']);links.new(mapping.outputs['Result'],p.inputs['Roughness'])
def hardware(name,p,size,m,bevel=.002):return box('FINISH / '+name,p,size,m,details,bevel)
for side in [-1,1]:
    for a,b in [(2.48,3.44),(3.76,4.72)]:
        center=(a+b)/2
        for y in [1.03,1.78]:
            # Retainer termination, separate from usable shelf space.
            for z in [a+.018,b-.018]:
                hardware('retainer end cap',(side*1.57,y+.045,z),(.023,.059,.032),edge,.003)
                hardware('cap recessed fastener',(side*1.556,y+.047,z),(.003,.008,.008),rubber,.001)
            # Existing under-shelf emitters gain physical shallow diffuser rails.
            for x in [1.655,1.745]:hardware('diffuser side rail',(side*x,y-.052,center),(.012,.014,b-a-.15),edge)
            for z in [a+.076,b-.076]:hardware('opal diffuser end',(side*1.70,y-.052,z),(.10,.014,.016),diffuser)
            for z in [a+.08,b-.08]:
                hardware('bracket captive screw',(side*1.724,y-.115,z),(.006,.014,.014),steel)
                hardware('screw driver recess',(side*1.720,y-.115,z),(.002,.0025,.008),rubber,.0005)
            # Thin support strips stop hard objects sliding without moving them.
            if side>0 and a>3.5:
                for z in [4.00,4.42]:
                    for dz in [-.075,.075]:hardware('photo foot silicone pad',(side*1.73,y+.023,z+dz),(.11,.003,.025),soft,.001)
            elif side>0:
                for z in ([2.56,2.65,2.74] if y<1.5 else [2.59,2.77]):hardware('book rest silicone',(side*1.73,y+.023,z),(.15,.003,.032),soft,.001)
# Preview-only broad reflected light; not an export/runtime light specification.
preview=next(c for c in bpy.data.collections if c.name.startswith('90 '))
for side in [-1,1]:
    data=bpy.data.lights.new('Preview shelf reflected warm fill','AREA');data.energy=3;data.color=(1,.72,.46);data.shape='RECTANGLE';data.size=.55;data.size_y=.14
    o=bpy.data.objects.new('Preview shelf reflected warm fill',data);preview.objects.link(o);o.location=xyz((side*1.42,1.51,3.60));o.rotation_euler=(xyz((side*1.85,1.23,3.60))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();verts=[];faces=[];triangles=0
for o in scene.objects:
    if o.type not in {'MESH','CURVE','FONT'} or any(c.name.startswith(('90 ','98 ','99 ')) for c in o.users_collection):continue
    ev=o.evaluated_get(deps);data=ev.to_mesh();data.calc_loop_triangles();triangles+=len(data.loop_triangles);offset=len(verts);verts.extend(o.matrix_world@v.co for v in data.vertices);faces.extend(tuple(offset+i for i in f.vertices) for f in data.polygons);ev.to_mesh_clear()
bvh=BVHTree.FromPolygons(verts,faces)
for x in [-1.33,-.7,0,.7,1.33]:
    for y in [.1,.45,.75,1.25,1.7,2.0]:assert bvh.ray_cast(xyz((x,y,1.8)),Vector((0,-1,0)),3.5)[0] is None
for x in [-.7,0,.7]:assert bvh.ray_cast(xyz((x,2.5,1.8)),Vector((0,-1,0)),3.5)[0] is None
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==digest
assert protected_signature()==protected_before,'Display geometry, transforms or UV changed'
compile(Path(__file__).read_text(),__file__,'exec')
photos=[]
for index in range(1,5):
    o=bpy.data.objects['PHOTO / Personal image '+str(index)];tex=next(n for n in o.active_material.node_tree.nodes if n.type=='TEX_IMAGE');assert tex.image.packed_file;photos.append({'index':index,'packedPixels':list(tex.image.size),'uvUnchanged':True})
report={'source':SOURCE.name,'sourceSHA256':digest,'sourceUnchanged':True,'runtimeChanged':False,'clearanceRaysPassed':33,'photosPreserved':photos,'displayPropsUnchanged':True,'evaluatedTriangles':triangles,'newPreviewOnlyAreaLights':2,'previewLightWattsEach':3,'render':{'engine':'BLENDER_EEVEE','resolution':[1280,800],'samples':32,'threads':2},'browserPerformanceMeasured':False}
(OUT/'shelves-finished.json').write_text(json.dumps(report,indent=2)+'\n')
camera=scene.camera;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.threads_mode='FIXED';scene.render.threads=2;scene.eevee.taa_render_samples=32
camera.location=xyz((0,1.7,1.15));camera.rotation_euler=(xyz((0,1.42,4))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=16
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-shelves-finished.blend'))
for name,eye,target,lens in [('overview',(0,1.7,1.15),(0,1.42,4),16),('detail',(.67,1.51,3.74),(1.70,1.69,4.18),40)]:
    camera.location=xyz(eye);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.render.filepath=str(OUT/('shelves-finished-'+name+'.png'));bpy.ops.render.render(write_still=True)
print('SHELF_FINISH_READY',json.dumps(report))

