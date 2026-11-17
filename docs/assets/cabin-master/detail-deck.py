"""Large flush maintenance registers, geometric grip and recessed lighting."""
import bpy,bmesh,json
from pathlib import Path
from math import sin,cos,pi
from mathutils import Vector
s=bpy.context.scene;assert s.get('detail_architecture') and not s.get('detail_deck')
folder=Path(bpy.data.filepath).parent;col=bpy.data.collections['17 Turnaround deck panels'];archive=bpy.data.collections['90 Archive / Superseded layout - excluded'];retired=[]
floor=bpy.data.materials['MASTER / Graphite alloy deck'];metal=bpy.data.materials['STUDIO / Worn machined bronze steel'];dark=bpy.data.materials['STUDIO / Carbon rubber'];warm=bpy.data.materials['CABIN / REFERENCE / Warm diffuser']
def xyz(p):return Vector((p[0],-p[2],p[1]))
def bounds(o):
 ps=[o.matrix_world@Vector(v) for v in o.bound_box];return [min(p.x for p in ps),min(p.z for p in ps),min(-p.y for p in ps)],[max(p.x for p in ps),max(p.z for p in ps),max(-p.y for p in ps)]
def stash(o):
 retired.append(o.name)
 for c in list(o.users_collection):c.objects.unlink(o)
 archive.objects.link(o);o.hide_render=True;o['archived']=True;o['exclude_runtime_export']=True
def mesh(name,vs,fs,mat):
 d=bpy.data.meshes.new(name);d.from_pydata([xyz(p) for p in vs],[],fs);d.update();d.materials.append(mat)
 bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free()
 o=bpy.data.objects.new('DETAIL / '+name,d);col.objects.link(o);return o
def box(name,p,size,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.name='DETAIL / '+name
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);return o
def panel(name,x,z,w,d,y,thickness,mat):
 c=.08;pts=[(-w/2+c,-d/2),(w/2-c,-d/2),(w/2,-d/2+c),(w/2,d/2-c),(w/2-c,d/2),(-w/2+c,d/2),(-w/2,d/2-c),(-w/2,-d/2+c)]
 vs=[(x+xx,yy,z+zz) for yy in [y-thickness,y] for xx,zz in pts]
 fs=[tuple(range(8)),tuple(reversed(range(8,16)))]+[(i,i+8,(i+1)%8+8,(i+1)%8) for i in range(8)]
 return mesh(name,vs,fs,mat)
def bevel(o):
 b=o.modifiers.new('Register milled edge','BEVEL');b.width=.002;b.segments=2
# Four broad registers replace eight repetitive central tiles; lateral bands remain.
for o in list(col.objects):
 name=o.name;lo,hi=bounds(o);x=(lo[0]+hi[0])/2;z=(lo[2]+hi[2])/2
 if any(p in name for p in ['Deck plate rim','Graphite deck face','Recessed deck fastener']) and abs(x)<3.3 and 13.6<z<16.6:stash(o)
 elif 'Recessed amber deck channel' in name or 'Amber deck core' in name:stash(o)
grip=bpy.data.materials.new('DETAIL / Dark anti-slip insert');grip.use_nodes=True;p=next(n for n in grip.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.022,.027,.028,1);p.inputs['Metallic'].default_value=.55;p.inputs['Roughness'].default_value=.57
for x in [-1.6,1.6]:
 for z in [14.35,15.85]:
  rim=panel('Large register machined flange',x,z,3.155,1.455,.004,.025,metal);bevel(rim)
  face=panel('Large register dark face',x,z,3.113,1.413,.009,.014,floor)
  cutter=box('Temporary pull pocket cutter',(x,.005,z+.54),(.26,.045,.085),dark)
  mod=face.modifiers.new('Actual recessed handle pocket','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
  bpy.context.view_layer.objects.active=face;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True);bevel(face)
  box('Pull pocket dark bottom',(x,.0048,z+.54),(.255,.001,.080),dark)
  box('Flush folding pull',(x,.0075,z+.54),(.16,.003,.018),metal)
  inset=panel('Anti-slip register inset',x,z-.10,2.71,.90,.011,.002,grip)
  vs=[];fs=[]
  for i in range(23):
   for j in range(8):
    xx=x-1.27+i*.115;zz=z-.47+j*.105;a=pi/4 if (i+j)%2 else -pi/4
    shape=[(-.033,0),(0,-.008),(.033,0),(0,.008)];start=len(vs)
    for y in [.011,.014]:
     vs.extend([(xx+u*cos(a)-v*sin(a),y,zz+u*sin(a)+v*cos(a)) for u,v in shape])
    fs.extend([tuple(start+k for k in range(4)),tuple(start+k for k in reversed(range(4,8)))])
    fs.extend([(start+k,start+(k+1)%4,start+(k+1)%4+4,start+k+4) for k in range(4)])
  mesh('Low diamond grip ribs',vs,fs,grip)
  for xx in [x-1.48,x+1.48]:
   for zz in [z-.64,z+.64]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.016,depth=.003,location=xyz((xx,.0105,zz)));o=bpy.context.object;o.name='DETAIL / Register captive bolt'
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o);o.data.materials.append(metal)
# Recessed cores sit below deck level, with flush protective metal lips.
for z in [12.85,14.35,15.85,17.35]:
 xs=[-3.2,0,3.2] if z in [14.35,15.85] else [-3.2,-1.6,1.6,3.2]
 for x in xs:
  box('Lighting channel dark well',(x,-.002,z),(.042,.012,1.13),dark)
  box('Recessed amber optical core',(x,.002,z),(.011,.004,1.04),warm)
  for xx in [x-.019,x+.019]:box('Lighting channel flush lip',(xx,.0065,z),(.004,.005,1.13),metal)
  for zz in [z-.54,z+.54]:box('Channel end retainer',(x,.0075,zz),(.036,.003,.025),metal)
# Keep tonal variation restrained; grip and panel geometry carry the visual detail.
ramp=next(n for n in floor.node_tree.nodes if n.type=='VALTORGB')
ramp.color_ramp.elements[0].color=(.024,.029,.031,1);ramp.color_ramp.elements[1].color=(.042,.049,.050,1)
bpy.context.view_layer.update()
for o in col.objects:
 if o.type in {'MESH','FONT','CURVE'}:assert bounds(o)[1][1]<.025,(o.name,bounds(o))
dg=bpy.context.evaluated_depsgraph_get();tris=0
active=[o for o in s.objects if not o.get('archived')]
for o in active:
 if o.type not in {'MESH','CURVE','FONT'}:continue
 e=o.evaluated_get(dg);m=e.to_mesh();tris+=sum(len(p.vertices)-2 for p in m.polygons);e.to_mesh_clear()
before=json.loads((folder/'detail-pass-before.json').read_text())
report={'activeObjects':len(active),'archivedObjects':sum(bool(o.get('archived')) for o in s.objects),
 'evaluatedTrianglesBefore':before['activeEvaluatedTriangles'],'evaluatedTrianglesAfter':tris,
 'largeCentralRegisters':4,'floorMaxHeight':.025,'retiredDeckObjects':retired,'runtimeChanged':False}
(folder/'detail-pass-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8');s['detail_deck']=1
version=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=version
print('DECK_DETAIL_READY',{k:v for k,v in report.items() if k!='retiredDeckObjects'})
