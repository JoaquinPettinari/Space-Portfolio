"""Arrival coffee supplies and replaceable memory mounts. Preserve gameplay."""
from pathlib import Path
from math import pi
import bpy, bmesh
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
NAME='Arrival Room - Coffee and Memories V9'
assert NAME not in bpy.data.scenes
source=bpy.data.scenes['Arrival Room - Fitted Lounge V8']
scene=bpy.data.scenes.new(NAME);bpy.context.window.scene=scene
scene.world=source.world;scene.unit_settings.system='METRIC'
for old_col in source.collection.children:
    col=bpy.data.collections.new(old_col.name.replace('V8','V9'));scene.collection.children.link(col)
    for old in old_col.objects:
        obj=old.copy();obj.data=old.data.copy();obj.name=old.name.replace('ARR8','ARR9');col.objects.link(obj)
details=bpy.data.collections.new('ARRIVAL V9 / Coffee and memories');scene.collection.children.link(details)
mats={k:bpy.data.materials['ARRIVAL V4 '+k] for k in ['Graphite frame','Warm grey panels','Ivory cabinets','Gaskets','Amber lamps']}
# Reuse the primitive/UV helpers, without executing a previous revision.
helper=(ROOT/'scripts/assets/detail-arrival-v6-live.py').read_text()
exec(helper[helper.index('def xyz'):helper.index('# Equipment case')].replace("'ARR6 '+name","'ARR9 '+name").replace("'ARR6 '+text","'ARR9 '+text"))

# The old board fills this entire wall; divide its area between shelves and memories.
old=next(o for o in scene.objects if o.name.startswith('ARR9 memory board backing'))
bpy.data.objects.remove(old,do_unlink=True)
box('service backsplash',(-2.095,1.48,.065),(.85,.87,.07),'Graphite frame')
box('coffee shelf',(-2.46,1.61,.25),(.34,.035,.32),'Ivory cabinets')
box('coffee shelf lower',(-2.46,1.13,.25),(.34,.035,.32),'Ivory cabinets')
for x in [-2.60,-2.32]:
    box('shelf bracket',(x,1.54,.12),(.025,.13,.06),'Graphite frame')
box('coffee shelf light',(-2.46,1.585,.34),(.27,.012,.025),'Amber lamps',.002)
box('counter edge trim',(-2.23,.97,.83),(1.04,.035,.018),'Warm grey panels')
box('counter drip tray',(-2.40,1.028,.57),(.36,.018,.25),'Graphite frame')
for i in range(8):
    box('tray slot',(-2.54+i*.04,1.039,.57),(.012,.005,.19),'Gaskets',.001)

def cylinder(name,at,radius,height,material,inner=0):
    # Hollow cups have an actual rim and inner floor, not a solid cylinder top.
    count=24;verts=[];faces=[]
    rings=[(radius,-height/2),(radius,height/2)]
    if inner:rings += [(inner,height/2),(inner,-height/2+.012)]
    for r,y in rings:
        for i in range(count):
            from math import sin,cos
            a=2*pi*i/count;verts.append(xyz((at[0]+r*cos(a),at[1]+y,at[2]+r*sin(a))))
    for ring in range(len(rings)-1):
        for i in range(count):
            j=(i+1)%count;faces.append((ring*count+i,ring*count+j,(ring+1)*count+j,(ring+1)*count+i))
    faces += [tuple(reversed(range(count))),tuple((len(rings)-1)*count+i for i in range(count))]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();uv(mesh)
    obj=bpy.data.objects.new('ARR9 '+name,mesh);details.objects.link(obj);mesh.materials.append(mats[material])
    return obj

for x,h in [(-2.55,.20),(-2.43,.16),(-2.32,.18)]:
    cylinder('coffee canister',(x,1.63+h/2,.22),.044,h,'Warm grey panels')
    cylinder('canister lid',(x,1.634+h,.22),.047,.015,'Graphite frame')
    box('canister label',(x,1.63+h/2,.265),(.048,.055,.008),'Ivory cabinets',.002)
cylinder('insulated flask',(-2.57,1.21,.64),.065,.38,'Warm grey panels')
cylinder('flask cap',(-2.57,1.416,.64),.069,.032,'Graphite frame')
for x,z in [(-2.38,.58),(-2.13,.63)]:
    offset=0 if x==-2.38 else -.02
    cylinder('crew mug',(x,1.105+offset,z),.055,.13,'Ivory cabinets',.045)
    # Compact rectangular ceramic handle, open in the middle.
    for y in [1.065,1.145]:box('mug handle',(x+.074,y+offset,z),(.045,.012,.016),'Ivory cabinets',.004)
    box('mug handle outer',(x+.093,1.105+offset,z),(.012,.08,.016),'Ivory cabinets',.004)

# Empty photo inserts: unique materials and explicit 0..1 UVs for future images.
# Slot sizes are local metres; no invented people or personal memories.
box('memory board',(-1.95,1.56,.12),(.53,.77,.055),'Warm grey panels')
slots=[('01',-2.07,1.76,.20,.15),('02',-1.82,1.70,.18,.24),('03',-2.04,1.43,.25,.18)]
for key,x,y,w,h in slots:
    box('memory frame '+key,(x,y,.165),(w+.025,h+.025,.025),'Ivory cabinets',.004)
    mat=bpy.data.materials.new('ARRIVAL_MEMORY_'+key);mat.use_nodes=True
    shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value=(.035,.065,.075,1);shader.inputs['Roughness'].default_value=.85
    mat.use_backface_culling=True
    mesh=bpy.data.meshes.new('Memory UV '+key)
    mesh.from_pydata([xyz((x-w/2,y-h/2,.179)),xyz((x+w/2,y-h/2,.179)),xyz((x+w/2,y+h/2,.179)),xyz((x-w/2,y+h/2,.179))],[],[(0,1,2,3)])
    layer=mesh.uv_layers.new(name='UVMap')
    for i,coord in enumerate([(0,0),(1,0),(1,1),(0,1)]):layer.data[i].uv=coord
    obj=bpy.data.objects.new('ARR9 MEMORY_PHOTO_'+key,mesh);details.objects.link(obj);mesh.materials.append(mat)
    obj['photo_slot']=key;obj['aspect_ratio']=w/h
    box('memory retaining clip '+key,(x,y+h/2+.008,.19),(.035,.022,.012),'Graphite frame',.002)
box('notes holder',(-1.83,1.35,.17),(.14,.14,.02),'Ivory cabinets',.003)
for i in range(3):box('blank note line',(-1.83,1.38-i*.025,.182),(.095,.004,.003),'Warm grey panels',.001)
label('CREW MEMORIES',(-1.95,1.98,.16),.034)
label('COFFEE',(-2.46,1.87,.12),.036)

exporter=ROOT/'scripts/assets/export-arrival-runtime-live.py'
exec(compile(exporter.read_text(),str(exporter),'exec'),{'__file__':str(exporter)})
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/arrival-room/arrival-room-v9.blend'))
print('V9 exported. Three named photo slots, no personal images, existing bridge interactions retained.')
