"""Source-only restrained niche dressing, contained behind existing wall line."""
from pathlib import Path
from math import sin,cos,pi
import bpy,bmesh,random
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'docs/assets/bridge';scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('BRIDGE / Niche dressing')
# Keep the existing backup from before this complete instruments/dressing pass.
collection=bpy.data.collections.new('BRIDGE / Niche dressing');scene.collection.children.link(collection)
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
old={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
for level,(width,height) in enumerate(((.72,.28),(.57,.22))):
    bottom=.803 if level==0 else 1.103
    x=-3.97+(0 if level==0 else .045);y=bottom+height/2;z=1.965
    box('Niche equipment case',(x,y,z),(width,height,.17),'Graphite',.018)
    box('Case recessed face',(x,y,2.054),(width-.10,height-.075,.008),'Metal',.006)
    for side in (-1,1):
        box('Case vertical protector',(x+side*(width/2-.026),y,2.05),(.035,height-.025,.025),'Gasket',.009)
        box('Case clasp socket',(x+side*width*.27,y+.025,2.062),(.055,.075,.009),'Gasket',.005)
        box('Case metal clasp',(x+side*width*.27,y+.025,2.069),(.028,.05,.006),'Metal',.004)
    box('Case handle pocket',(x,y+.014,2.062),(.17,.055,.008),'Gasket',.006)
    box('Case handle grip',(x,y+.025,2.071),(.12,.014,.008),'Metal',.004)
    # Support feet sit on the ledge/case lid, not through the repisa.
    if level==1:
        for side in (-1,1):box('Case stacking foot',(x+side*.19,1.093,z),(.07,.02,.10),'Gasket',.004)

# Compact planter and foliage fit the 21cm-deep existing alcove.
box('Niche planter',(3.97,.913,1.965),(.34,.22,.17),'Metal',.018)
box('Planter dark rim',(3.97,1.022,1.965),(.35,.022,.18),'Graphite',.006)
box('Planter soil',(3.97,1.035,1.965),(.30,.008,.14),'Gasket',.002)
for name,color in [('Leaf',(.065,.15,.035)),('Stem',(.055,.085,.025))]:
    mat=bpy.data.materials.new('BRIDGE '+name);mat.use_nodes=True
    p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.70
    mat.diffuse_color=(*color,1);mat.use_backface_culling=False;materials[name]=mat
rng=random.Random(73)
for branch in range(7):
    side=-1 if branch%2==0 else 1
    endpoint=side*(.10+.035*branch);height=.29+.055*(branch%4)
    last=Vector((3.97,1.038,1.965))
    for step in range(1,6):
        t=step/5
        current=Vector((3.97+endpoint*t,1.038+height*sin(t*pi*.63),1.965+.018*sin(t*pi+branch)))
        # Thin six-sided stem, no curves or procedural material dependencies.
        direction=(current-last).normalized();axis=direction.cross(Vector((0,0,1))).normalized();other=direction.cross(axis)
        verts=[]
        for center in (last,current):
            for k in range(6):verts.append(tuple(center+.002*(axis*cos(2*pi*k/6)+other*sin(2*pi*k/6))))
        mesh('Planter stem',verts,[(k,(k+1)%6,(k+1)%6+6,k+6) for k in range(6)],'Stem',0)
        if step>1:
            sign=-1 if (step+branch)%2 else 1
            tip=current+Vector((sign*rng.uniform(.065,.115),rng.uniform(.025,.075),rng.uniform(-.012,.012)))
            mid=current.lerp(tip,.48);width=rng.uniform(.022,.034)
            vertices=[tuple(current),tuple(mid+Vector((0,width,-.006))),tuple(tip),tuple(mid-Vector((0,width,.006))),tuple(mid+Vector((0,0,.014)))]
            leaf=mesh('Planter shaped leaf',vertices,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],'Leaf',0)
            for poly in leaf.data.polygons:poly.use_smooth=True
        last=current
bpy.context.view_layer.update()
for obj,(matrix,metadata) in old.items():assert obj.matrix_world==matrix and dict(obj.items())==metadata
# World/game-space containment: no dressing in walkways or through recess back.
for obj in collection.objects:
    for vertex in obj.data.vertices:
        p=obj.matrix_world@vertex.co
        assert 3.26<abs(p.x)<4.68 and .80<=p.z<2.33
        assert 1.86< -p.y <2.08,(obj.name,-p.y)
assert sum(o.type=='LIGHT' for o in scene.objects)==4
previous=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=previous
print('Niches dressed: two equipment cases, planter with 28 shaped leaves. All vertices inside existing recess clearances; no lights, textures, gameplay or app export.')
