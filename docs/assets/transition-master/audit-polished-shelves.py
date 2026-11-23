"""Verify grouped props remain inside their intended shelf modules."""
from pathlib import Path
import bpy,json,hashlib
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(OUT/'transition-shelves-polished.blend'))
scene=bpy.context.scene;deps=bpy.context.evaluated_depsgraph_get();groups={}
for root in [o for o in scene.objects if o.type=='EMPTY' and o.name.startswith('DISPLAY /')]:
    points=[]
    for o in root.children_recursive:
        if o.type not in {'MESH','CURVE'}:continue
        evaluated=o.evaluated_get(deps)
        data=evaluated.to_mesh()
        for vertex in data.vertices:
            p=evaluated.matrix_world@vertex.co;points.append((p.x,p.z,-p.y))
        evaluated.to_mesh_clear()
    assert points,('Empty display group',root.name)
    low=[min(p[i] for p in points) for i in range(3)];high=[max(p[i] for p in points) for i in range(3)]
    assert -2.1<=low[0]<=high[0]<=2.1 and .98<=low[1]<=high[1]<=2.65,(root.name,low,high)
    limits=(3.76,4.75) if 'plant' in root.name.lower() else (2.48,3.44)
    assert limits[0]-.01<=low[2]<=high[2]<=limits[1]+.01,(root.name,low,high)
    groups[root.name]={'minimumRuntimeXYZ':low,'maximumRuntimeXYZ':high}
assert len(groups)==6,len(groups)
assert not bpy.data.objects.get('Padded shoe collar'),'Old floating collar retained'
report=json.loads((OUT/'shelves-polished.json').read_text());assert hashlib.sha256((OUT/report['source']).read_bytes()).hexdigest()==report['sourceSHA256']
report['evaluatedGroupBounds']=groups;report['groupBoundsPassed']=True;report['oldShoeCollarRemoved']=True
(OUT/'shelves-polished.json').write_text(json.dumps(report,indent=2)+'\n')
compile((ROOT/'scripts/assets/polish-transition-personal-props.py').read_text(),'polish-transition-personal-props.py','exec')
print('POLISHED_GROUPS_AND_COMPILE_PASSED',json.dumps(groups))

