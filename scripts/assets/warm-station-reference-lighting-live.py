"""Amber practicals and localized warm spill, with source-safe material overrides.

Keep the 16-light budget and Solid edit proxy. Full lighting is judged in renders.
"""
import bpy
import bmesh
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT=ROOT/'docs/assets/station-reference-interior'
scene=bpy.context.scene
root=bpy.data.collections['STATION / Reference interior']
if root.get('amber_lighting_pass'):raise RuntimeError('Amber pass already applied')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'before-amber-lighting.blend'),copy=True)
lights_before=sum(o.type=='LIGHT' for o in scene.objects)
old_energies={o.name:{'energy':o.data.energy,'color':list(o.data.color)} for o in scene.objects if o.type=='LIGHT'}
col=bpy.data.collections.new('STATION / 07 Amber lighting details')
root.children.link(col)

def mat(name,color,metal=.4,rough=.4,glow=0):
    m=bpy.data.materials.new('STATION AMBER / '+name)
    m.use_nodes=True
    m.diffuse_color=(*color,1)
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1)
    p.inputs['Emission Strength'].default_value=glow
    return m
strip=mat('Honey amber light core',(1,.32,.045),.05,.3,4)
ceiling=mat('Soft warm ceiling',(1,.57,.22),.05,.4,2.3)
bronze=mat('Warm brushed trim',(.29,.16,.055),.78,.3)
dark=mat('Warm graphite',(.045,.036,.027),.65,.4)
rubber=bpy.data.materials['STATION / Deep gasket']

# Override material slots per object. Original cabin and ship materials are shared
# by other scenes and must remain unchanged.
overrides={}
affected=0
lamps=0
def warm_surface(original):
    if original in overrides:return overrides[original]
    m=original.copy()
    m.name='STATION AMBER / '+original.name
    p=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if m.use_nodes else None
    if p:
        floor='Deck finish' in original.name
        factor=(.92,.77,.55) if not floor else (.92,.8,.63)
        if p.inputs['Base Color'].is_linked:
            old=p.inputs['Base Color'].links[0].from_socket
            multiply=m.node_tree.nodes.new('ShaderNodeMixRGB')
            multiply.blend_type='MULTIPLY'
            multiply.inputs[0].default_value=1
            multiply.inputs[2].default_value=(*factor,1)
            m.node_tree.links.new(old,multiply.inputs[1])
            m.node_tree.links.new(multiply.outputs[0],p.inputs['Base Color'])
        else:
            c=p.inputs['Base Color'].default_value[:]
            p.inputs['Base Color'].default_value=tuple(c[i]*factor[i] for i in range(3))+(1,)
        if floor:
            for link in list(p.inputs['Roughness'].links):m.node_tree.links.remove(link)
            p.inputs['Roughness'].default_value=.235
            p.inputs['Metallic'].default_value=.65
    c=m.diffuse_color[:]
    m.diffuse_color=(c[0]*.93,c[1]*.78,c[2]*.57,c[3])
    overrides[original]=m
    return m

def render_objects(collection):
    if collection.hide_render:return
    for ob in collection.objects:
        if not ob.hide_render:yield ob
    for child in collection.children:yield from render_objects(child)

for ob in list(render_objects(root)):
    if ob.type not in {'MESH','FONT','CURVE'}:continue
    for slot in ob.material_slots:
        old=slot.material
        if not old:continue
        name=old.name.lower()
        lamp=(old.name in {'BRIDGE V15 Amber','STATION / Warm diffusers'} or 'amber lamps' in name or 'amber diffuser' in name)
        if lamp:
            is_ceiling=any(word in ob.name.lower() for word in ['ceiling','practical diffuser','rectangular diffuser','roof amber'])
            slot.link='OBJECT'
            slot.material=ceiling if is_ceiling else strip
            lamps+=1
        elif any(word in name for word in ['graphite','metal','ivory','warm grey','titanium','counter finish','deck finish','ceramic housings','warm grey panels']):
            if 'display' in name or 'stencil' in name:continue
            new=warm_surface(old)
            slot.link='OBJECT'
            slot.material=new
            affected+=1

def light(name,color,energy,location=None,target=None,size=None,size_y=None,shadow=None):
    ob=bpy.data.objects[name]
    ob.data.color=color
    ob.data.energy=energy
    if location:ob.location=location
    if target:ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    if size is not None:ob.data.size=size
    if size_y is not None and ob.data.type=='AREA':
        ob.data.shape='RECTANGLE'
        ob.data.size_y=size_y
    if shadow is not None:ob.data.use_shadow=shadow

for name in ['STN / Preview warm ceiling.006','STN / Preview warm ceiling.007']:
    light(name,(1,.49,.15),185,size=1.3)
light('STN / Preview entry ceiling.003',(1,.45,.11),110)
light('STN / Forward warm ceiling',(1,.5,.17),240)
light('STN / Preview bow daylight.003',(.3,.5,1),45)
light('STN / Cool window bounce',(.2,.4,1),55)

# Two existing softboxes become undercounter strip lights: no extra light count.
light('STN / Observation left softbox',(1,.31,.045),95,(-3.65,2.5,.97),(-2.7,2.5,0),.12,3.3,False)
light('STN / Observation right softbox',(1,.31,.045),95,(3.65,2.5,.97),(2.7,2.5,0),.12,3.3,False)
# Reuse the frontal fill as a rear shelf practical rather than washing the room grey.
light('STN / Entry warm camera fill',(1,.37,.065),65,(-2.85,-1.45,2.28),(-2.85,-.7,1.1),1.15,.12,False)
light('STN / Arrival lounge soft fill',(1,.48,.14),100)
light('STN / Arrival ceiling',(1,.54,.22),260)
light('STN / Docking door warm fill',(1,.52,.18),120)
for name in ['STN / Passage ceiling','STN / Passage ceiling.001']:
    light(name,(1,.48,.12),45,shadow=False)

# Focused fitting details around the rear niches, reflecting references 3/4.
src=(ROOT/'scripts/assets/build-station-reference-interior-live.py').read_text(encoding='utf-8')
ns={'bpy':bpy,'bmesh':bmesh,'math':math,'Vector':Vector,'finish':col,'props':col,'displays':col,'ivory':bronze}
exec(src[src.index('def mesh('):src.index('layout=json.loads')],ns)
box,beam,mesh=[ns[k] for k in ['box','beam','mesh']]
for s in [-1,1]:
    x=s*2.85
    for dx in [-.7,.7]:
        box('Niche dark vertical lamp recess',(x+dx,-1.61,1.82),(.075,.07,1.55),rubber,col,.02)
        box('Niche amber vertical diffuser',(x+dx,-1.561,1.82),(.022,.018,1.34),strip,col,.009)
        box('Niche brushed lamp lip',(x+dx+.033,-1.57,1.82),(.012,.02,1.43),bronze,col,.004)
    for z in [1.04,2.6]:
        box('Niche perimeter header',(x,-1.64,z),(1.47,.08,.055),dark,col,.015)
        box('Niche header machined edge',(x,-1.59,z),(1.29,.012,.012),bronze,col,.004)
    shelf=2.24 if s<0 else 1.36
    box('Niche layered shelf',(x,-1.54,shelf),(1.25,.3,.055),dark,col,.018)
    box('Niche shelf metal leading lip',(x,-1.376,shelf),(1.19,.023,.025),bronze,col,.008)
    box('Niche under-shelf lamp socket',(x,-1.48,shelf-.04),(1.1,.12,.025),rubber,col,.009)
    box('Niche under-shelf amber strip',(x,-1.47,shelf-.057),(1.01,.07,.014),strip,col,.005)
    for dx in [-.64,.64]:
        for z in [1.1,2.54]:
            box('Niche trim captive fastener',(x+dx,-1.59,z),(.022,.015,.022),bronze,col,.004)

# Inset backing behind the existing notes/badge gives the shelf light a dark recess.
def niche_backing(s):
    x=s*2.85
    outline=[(-.68,1.15),(-.56,1.03),(.56,1.03),(.68,1.15),(.68,2.48),(.56,2.6),(-.56,2.6),(-.68,2.48)]
    verts=[(x+dx,y,z) for y in [-1.785,-1.725] for dx,z in outline]
    faces=[tuple(reversed(range(8))),tuple(range(8,16))]
    faces.extend((i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8))
    data=bpy.data.meshes.new('Amber niche recessed backing')
    data.from_pydata(verts,[],faces)
    data.update()
    bm=bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    bm.to_mesh(data)
    bm.free()
    data.materials.append(rubber)
    ob=bpy.data.objects.new('STN / Amber niche recessed backing',data)
    col.objects.link(ob)
for s in [-1,1]:niche_backing(s)

# Sparse yellow markings and warm-edged field-book spines, not a yellow paint wash.
for i in range(5):
    x=2.45+i*.085
    box('Niche field journal',(x,-1.48,1.2),(.065,.17,.27),dark,col,.008)
    box('Journal ochre spine',(x,-1.382,1.2),(.048,.012,.23),bronze,col,.004)
    for z in [1.12,1.27]:box('Journal gilt spine line',(x,-1.374,z),(.037,.006,.008),ceiling,col,.001)

# Close-up camera aimed at the warm niche/desk relationship, alongside the wide view.
data=bpy.data.cameras.new('STN / Amber rear details')
camera=bpy.data.objects.new(data.name,data)
bpy.data.collections['STATION / PREVIEW / Cameras and lighting'].objects.link(camera)
camera.location=(-.4,3.8,1.72)
camera.rotation_euler=(Vector((-2.6,-1.65,1.65))-camera.location).to_track_quat('-Z','Y').to_euler()
data.lens=33
data.clip_end=500

assert sum(o.type=='LIGHT' for o in scene.objects)==lights_before
report={'lights_before':lights_before,'lights_after':sum(o.type=='LIGHT' for o in scene.objects),'new_area_lights':0,'lamp_slots_recolored':lamps,'surface_slots_overridden':affected,'independent_surface_materials':len(overrides),'original_source_materials_modified':False,'old_lights':old_energies,'intent':'Localized honey/amber fixtures and spill, restrained cool rim, cyan screens preserved. Solid proxy is not a lighting preview.'}
(OUT/'amber-lighting-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
root['amber_lighting_pass']=True
root['lighting_reference']='Amber localized practicals, warm reflective dark metal, cyan displays; 5 close-up references supplied by user.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'station-reference-interior.blend'))
print('AMBER PASS SAVED',json.dumps({k:v for k,v in report.items() if k!='old_lights'}))
