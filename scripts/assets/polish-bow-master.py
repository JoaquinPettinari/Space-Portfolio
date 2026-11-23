"""Bounded second art pass; preserve interaction anchors and the original shell."""
from pathlib import Path
from math import pi
import bpy, json
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/bow-master'
assert Path(bpy.data.filepath)==OUT/'bow-master.blend'
scene=bpy.context.scene
NAME='11 Deck consoles and window detailing'
assert NAME not in bpy.data.collections, 'Pass exists: edit its pieces, do not duplicate it'
backup=OUT/'before-detail-pass.blend'
assert not backup.exists(), 'Preserve the existing backup'
bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True)
anchors={o.name:list(o.matrix_world) for o in bpy.data.collections['08 Interaction anchors - no export'].objects}
col=bpy.data.collections.new(NAME);scene.collection.children.link(col)
# These new service plates replace the isolated first-pass floor handles.
removed_floor_hardware=0
for o in list(scene.objects):
    if o.name.startswith(('BOW / Flush inspection handle well','BOW / Captive handle','BOW / Deck captive fastener')):
        bpy.data.objects.remove(o,do_unlink=True)
        removed_floor_hardware+=1
def xyz(p):return Vector((p[0],-p[2],p[1]))
def material(name,color,metal,rough,grain=0,emission=0):
    m=bpy.data.materials.new('BOW DETAIL / '+name);m.use_nodes=True
    nodes=m.node_tree.nodes;links=m.node_tree.links
    p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    m.diffuse_color=(*color,1)
    if grain:
        noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=grain
        ramp=nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color=(rough*.75,)*3+(1,)
        ramp.color_ramp.elements[1].color=(min(rough*1.3,1),)*3+(1,)
        links.new(noise.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs[0],p.inputs['Roughness'])
        bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.15;bump.inputs['Distance'].default_value=.0015
        links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs[0],p.inputs['Normal'])
    return m
steel=material('Machined dark titanium',(.12,.15,.17),.82,.32,95)
bronze=material('Satin bronze edging',(.29,.21,.12),.8,.35,160)
seal=material('Compression gasket',(.008,.012,.015),.0,.8,75)
deck=material('Anti slip graphite',(.047,.059,.067),.67,.43,150)
amber=material('Warm guide diffuser',(1,.51,.19),.05,.4,emission=2)
cyan=material('Cold status inlay',(.06,.56,.68),.05,.4,emission=1.4)

def box(name,p,size,mat,bevel=.005):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.name='BOW DETAIL / '+name
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o);o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if bevel:
        b=o.modifiers.new('Manufactured radius','BEVEL');b.width=min(bevel,min(size)*.32);b.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
def beam(name,a,b,width,mat):
    a,b=Vector(a),Vector(b);direction=b-a
    o=box(name,(0,0,0),(width,width,direction.length),mat)
    o.location=(a+b)/2;o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector((0,-1,0)).rotation_difference(direction.normalized())
    return o
def bolt(name,p,radius=.014):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=radius,depth=.006,location=xyz(p))
    o=bpy.context.object;o.name='BOW DETAIL / '+name
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o);o.data.materials.append(bronze)
    return o
# Thin service plates fit the clear side aisles, below the existing handle height.
floor=[]
for side in [-1,1]:
    for row,z in enumerate([.25,-1.25,-2.75,-4.25]):
        x=side*2.5
        floor.append(box('Deck expansion seal',(x,.004,z),(1.18,.008,1.38),seal,.003))
        floor.append(box('Removable deck plate',(x,.010,z),(1.14,.010,1.34),steel,.005))
        floor.append(box('Inset anti slip surface',(x,.016,z),(.99,.004,1.18),deck,.001))
        for dx in [-.52,.52]:
            for dz in [-.6,.6]:floor.append(bolt('Captive deck bolt',(x+dx,.017,z+dz),.012))
        for i in range(9):
            # Low, widely spaced herringbone tread: a surface detail, not a step.
            for s in [-1,1]:
                o=box('Stamped grip',(x+s*.09,.019,z-.43+i*.10),(.14,.003,.012),steel,.001)
                o.rotation_euler.z=s*.45;floor.append(o)
        box('Panel identity amber tick',(x+side*.52,.018,z+.35),(.018,.003,.11),bronze,.001)

# Leave the existing illuminated aisle channel fully exposed.
for o in col.objects:
    sign=1 if o.location.x>0 else -1
    o.location.x=sign*2.6+(o.location.x-sign*2.5)*.82
    o.scale.x*=.82

# Fit gaskets and rebates to each actual glazed facet instead of approximating its slope.
facets=[o for o in scene.objects if 'Command panoramic facet' in o.name]
for facet in facets:
    points=[facet.matrix_world@v.co for v in facet.data.vertices]
    assert len(points)==4
    center=sum(points,Vector())/4
    inward=Vector((-center.x,-center.y,0)).normalized()
    for i in range(4):
        a,b=points[i],points[(i+1)%4]
        beam('Window pressure seal',a+inward*.015,b+inward*.015,.11,seal)
        beam('Window machined rebate',a+inward*.065,b+inward*.065,.055,steel)
    # Short top strip and corner retainers leave the full panorama open.
    a,b=points[2],points[3]
    beam('Window header light',a.lerp(b,.22)+inward*.102,b.lerp(a,.22)+inward*.102,.022,amber)
    for p in points:
        toward=(center-p).normalized()
        beam('Window captive corner clamp',p+inward*.095+toward*.04,p+inward*.095+toward*.17,.065,bronze)

# Continuous desk edge, using the same miter-offset construction as commandLayout.ts.
path=[(-4,3),(-4,-.4),(-3.3,-2.95),(-1.6,-4.65),(1.6,-4.65),(3.3,-2.95),(4,-.4),(4,3)]
normals=[]
for a,b in zip(path,path[1:]):
    d=Vector((b[0]-a[0],b[1]-a[1])).normalized();normals.append(Vector((-d.y,d.x)))
inner=[]
for i,p in enumerate(path):
    a=normals[max(0,i-1)];b=normals[min(i,len(normals)-1)]
    v=Vector(p)+(a+b)*(.525/(1+a.dot(b)));inner.append((v.x,v.y-3.15))
for i,(a,b) in enumerate(zip(inner,inner[1:])):
    beam('Console impact trim',xyz((a[0],1.01,a[1])),xyz((b[0],1.01,b[1])),.045,steel)
    start,end=xyz((a[0],.93,a[1])),xyz((b[0],.93,b[1]))
    beam('Console underside gasket',start,end,.038,seal)
    beam('Console recessed guide light',start.lerp(end,.18),end.lerp(start,.18),.013,amber)
# Protective caps on the tactical table rim; avoid the live screen rectangle.
for x in [-.99,.99]:
    for z in [-3.88,-1.42]:
        box('Tactical protective corner',(x,1.068,z),(.09,.026,.13),steel,.008)
        bolt('Tactical rim captive screw',(x,1.085,z),.012)

# Preserve colors and authored textures while adding a subtle brushed normal to console metal.
for m in list(bpy.data.materials):
    if not m.name.startswith('BRIDGE V15 Metal') or m.get('bow_detail_grain'):continue
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    nodes=m.node_tree.nodes;links=m.node_tree.links
    tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=210
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.004
    if p.inputs['Normal'].is_linked:links.new(p.inputs['Normal'].links[0].from_socket,bump.inputs['Normal'])
    links.new(tex.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs[0],p.inputs['Normal']);m['bow_detail_grain']=True

studio=bpy.data.collections['09 Studio lights and cameras - no export']
def aim(o,p):o.rotation_euler=(xyz(p)-o.location).to_track_quat('-Z','Y').to_euler()
for side in [-1,1]:
    data=bpy.data.lights.new('Bow window practical','AREA');data.energy=85;data.color=(1,.66,.36);data.shape='RECTANGLE';data.size=2;data.size_y=.15
    o=bpy.data.objects.new('LIGHT / Window grazing '+str(side),data);studio.objects.link(o);o.location=xyz((side*2.4,2.6,-6.8));aim(o,(side*2,1,-5))
for name,pos,target in [('Deck inspection',(2.1,1.65,.9),(2.5,0,-2)),('Console and window',(-.6,1.7,-5),(-2.4,1.55,-7))]:
    d=bpy.data.cameras.new(name);d.lens=28;o=bpy.data.objects.new('CAM / '+name,d);studio.objects.link(o);o.location=xyz(pos);aim(o,target)
bpy.context.view_layer.update()
maxfloor=max((o.matrix_world@Vector(v)).z for o in floor for v in o.bound_box)
assert maxfloor<.025,maxfloor
for name,matrix in anchors.items():assert list(bpy.data.objects[name].matrix_world)==matrix,name
triangles=0;dg=bpy.context.evaluated_depsgraph_get()
for o in col.objects:
    if o.type=='MESH':
        e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();triangles+=len(m.loop_triangles);e.to_mesh_clear()
scene.camera=bpy.data.objects['CAM / Forward overview']
# Start the viewport inside, outside camera mode, so Walk Navigation cannot move a review camera.
eye=xyz((2.0,1.7,.8));target=xyz((0,1.4,-6))
rotation=(target-eye).to_track_quat('-Z','Y')
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        space=area.spaces.active;r=space.region_3d
        r.view_rotation=rotation;r.view_distance=.1;r.view_location=eye+rotation@Vector((0,0,-.1));r.view_perspective='PERSP'
        space.clip_start=.02;space.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bow-master.blend'))
(OUT/'detail-pass.json').write_text(json.dumps({'collection':NAME,'objectsAdded':len(col.objects),'removedSupersededFloorHardware':removed_floor_hardware,'evaluatedTrianglesAdded':triangles,'floorMaxHeight':maxfloor,'anchorsPreserved':len(anchors),'windowFacets':len(facets),'newStudioLights':2,'runtimeChanged':False,'previewCameras':['Deck inspection','Console and window']},indent=2))
print('BOW_DETAIL_COMPLETE',len(col.objects),triangles,maxfloor)
