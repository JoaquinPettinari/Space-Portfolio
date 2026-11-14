"""Normalize first-pass panel thickness, validate and render the saved design.

Only new editable panels are changed; retained furniture and source scenes are
excluded. Thickness metadata is recovered from the modelling scripts for panels
created before the normal-extrusion helper was corrected.
"""
from pathlib import Path
import ast,bpy,bmesh,json,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio');OUT=ROOT/'docs/assets/unified-ship'
scene=bpy.context.scene
assert scene.name=='CRUZ DEL SUR / Unified compact vessel'
specs={}
for filename in ['build-unified-compact-ship-live.py','refine-unified-compact-ship-live.py','finish-unified-structural-flow-live.py']:
    tree=ast.parse((ROOT/'scripts/assets'/filename).read_text(encoding='utf-8'))
    for node in ast.walk(tree):
        if not isinstance(node,ast.Call) or not isinstance(node.func,ast.Name) or node.func.id!='slab':continue
        if len(node.args)<3 or not isinstance(node.args[2],ast.Constant):continue
        label=node.args[0]
        while isinstance(label,ast.BinOp):label=label.left
        if isinstance(label,ast.Constant) and isinstance(label.value,str):specs[label.value.split('%')[0]]=node.args[2].value
new_cols=[bpy.data.collections['UNIFIED / '+n] for n in ['04 Continuous shoulders and pressure shell','05 Swept canopy and dorsal carapace','06 Structural seams vents and markings','07 Interior oblique ribs']]
corrected=[]
for col in new_cols:
    for ob in col.objects:
        name=ob.name.removeprefix('CDS U / ')
        thickness=ob.get('unified_panel_thickness')
        if thickness is None:
            thickness=next((t for prefix,t in specs.items() if name.startswith(prefix)),None)
        if thickness is None:continue
        n=len(ob.data.vertices)//2
        points=[Vector((v.co.x,v.co.z,-v.co.y)) for v in list(ob.data.vertices)[:n]]
        normal=(points[1]-points[0]).cross(points[2]-points[0]).normalized()
        axis=max(range(3),key=lambda i:abs(normal[i]));outward=sum(p[axis] for p in points)/n if axis==0 else 1
        if normal[axis]*outward<0:normal.negate()
        for i,p in enumerate(points):
            p=p-normal*thickness;ob.data.vertices[n+i].co=(p.x,-p.z,p.y)
        ob['unified_panel_thickness']=thickness
        bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob.data.update()
        corrected.append(ob.name)
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();bevels_removed=[]
for col in new_cols:
    for ob in col.objects:
        e=ob.evaluated_get(dg);data=e.to_mesh();data.calc_loop_triangles();bad=any(t.area<1e-12 for t in data.loop_triangles);e.to_mesh_clear()
        if bad:
            for modifier in list(ob.modifiers):
                if modifier.type=='BEVEL':ob.modifiers.remove(modifier);bevels_removed.append(ob.name)
print('Panel thickness checked:',len(corrected),'Bevels removed:',bevels_removed)
text=(ROOT/'scripts/assets/finish-unified-structural-flow-live.py').read_text(encoding='utf-8')
def xyz(p):return Vector((p[0],-p[2],p[1]))
skin,roofcol,details,ribs=new_cols
exec(compile(text[text.index('# Verify new opaque'):],'unified-final-validation','exec'))
