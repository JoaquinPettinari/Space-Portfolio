"""Geometric source checks only; never substitutes for runtime physics/E2E."""
from pathlib import Path
from math import sin,cos,pi
import bpy,json,hashlib
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2]
scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
deps=bpy.context.evaluated_depsgraph_get();verts=[];polys=[];triangles=0
seen={};duplicates=[]
meshes=[o for o in scene.objects if o.type=='MESH']
for obj in meshes:
    evaluated=obj.evaluated_get(deps);data=evaluated.to_mesh();data.calc_loop_triangles()
    triangles+=len(data.loop_triangles);offset=len(verts)
    verts.extend(obj.matrix_world@v.co for v in data.vertices)
    polys.extend([offset+k for k in p.vertices] for p in data.polygons)
    evaluated.to_mesh_clear()
    fingerprint=hashlib.sha256(repr(sorted(tuple(round(c,5) for c in obj.matrix_world@v.co) for v in obj.data.vertices)).encode()).hexdigest()
    key=(len(obj.data.polygons),fingerprint)
    if key in seen:duplicates.append([seen[key],obj.name])
    seen[key]=obj.name
tree=BVHTree.FromPolygons(verts,polys)
def xyz(p):return Vector((p[0],-p[2],p[1]))
layout=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
screens=[(m['position'][0],m['position'][1],m['position'][2]-3.15,m['rotation'],1.6,.9) for m in layout['monitors'].values()]
screens += [(4.205,1.68,-1.05,-pi/2,1.1,.8),(-4.205,1.68,-2.75,pi/2,1.1,.8)]
screen_hits=[]
for index,(x,y,z,a,w,h) in enumerate(screens):
    normal=Vector((sin(a),0,cos(a)))
    for dx in (-w*.45,0,w*.45):
        for dy in (-h*.45,0,h*.45):
            target=Vector((x+dx*cos(a),y+dy,z-dx*sin(a)))
            if tree.ray_cast(xyz(target+normal*.8),xyz(-normal),.78)[0] is not None:screen_hits.append(index)
route_hits=[];samples=0;nearest_clearance=100
for side in (-1,1):
    route=[(0,4.8),(0,.2),(side*1.65,-.2),(side*1.65,-4.3),(0,-4.6)]
    for a,b in zip(route,route[1:]):
        a,b=Vector(a),Vector(b)
        steps=max(2,int((b-a).length/.15))
        for step in range(steps+1):
            p=a.lerp(b,step/steps)
            for y in (.4,1.0,1.65):
                hit=tree.find_nearest(xyz((p.x,y,p.y)),.6)
                samples+=1
                if hit[0] is not None:
                    nearest_clearance=min(nearest_clearance,hit[3])
                    if hit[3]<.28:route_hits.append([round(p.x,3),y,round(p.y,3),round(hit[3],3)])
materials={s.material for o in meshes for s in o.material_slots}
images={n.image for m in materials for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image}
missing=[i.name for i in images if not i.packed_file]
report={
 'scene':scene.name,'meshes':len(meshes),'evaluatedTriangles':triangles,
 'materials':len(materials),'textures':[{'name':i.name,'size':list(i.size),'packed':bool(i.packed_file)} for i in sorted(images,key=lambda i:i.name)],
 'previewLights':sum(o.type=='LIGHT' for o in scene.objects),
 'exactDuplicateMeshes':duplicates,'screenRayCount':36,'screenObstructions':screen_hits,
 'routeSampleCount':samples,'minimumSampledClearanceMetres':nearest_clearance,'routeObstructions':route_hits,
 'limits':'Sampled Blender visual geometry only. No runtime export, physics, Pointer Lock, browser performance or visual screenshot verification.'}
(ROOT/'docs/assets/bridge/source-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='textures'}))
assert not screen_hits
assert not duplicates
assert not missing
assert not route_hits
assert len(bpy.data.scenes)==1
