"""Replace simple React chair visuals with fitted Blender seats; preserve physics."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
v8 = (ROOT/'scripts/assets/detail-bridge-furniture-v8-live.py').read_text()
prefix = v8[:v8.index('existing = set(collection.objects)')]
prefix = prefix.replace("Bridge - Furniture Details V8", "Bridge - Command Seats V9").replace("Bridge - Finished Entry V7", "Bridge - Furniture Details V8").replace('BRIDGE V8 / Architecture', 'BRIDGE V9 / Architecture')
exec(compile(prefix, __file__, 'exec'))
existing = set(collection.objects)
layout = json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
for kind, monitor in layout['monitors'].items():
    position = monitor['chair']
    pose = {'x':position[0], 'z':position[2]-3.15, 'yaw':monitor['rotation']}
    def chair(name, at, size, material, bevel=.012):
        return box('Command seat '+kind+' '+name,at,size,material,bevel,pose)
    # All fittings remain inside the original .84 x .84 x 1.30 collider.
    chair('base hub',(0,.105,0),(.23,.16,.23),'Graphite',.03)
    for side in [-1,1]:
        chair('longitudinal foot',(side*.29,.065,0),(.10,.09,.76),'Metal',.025)
        chair('cross brace',(0,.13,side*.26),(.68,.065,.08),'Graphite',.015)
        for end in [-1,1]:
            chair('foot pad',(side*.29,.03,end*.31),(.14,.04,.15),'Gasket',.01)
    chair('lift sleeve',(0,.32,0),(.20,.30,.20),'Graphite',.025)
    chair('lift piston',(0,.46,0),(.12,.22,.12),'Metal',.02)
    chair('seat pan',(0,.575,-.015),(.71,.10,.69),'Metal',.025)
    chair('seat cushion',(0,.66,-.035),(.62,.12,.59),'Gasket',.03)
    for side in [-1,1]:
        chair('cushion bolster',(side*.30,.69,-.025),(.08,.14,.57),'Graphite',.02)
        chair('arm support',(side*.35,.73,.20),(.065,.26,.075),'Metal',.013)
        chair('arm body',(side*.35,.87,-.005),(.13,.08,.57),'Metal',.022)
        chair('arm pad',(side*.35,.918,-.035),(.105,.034,.46),'Gasket',.012)
    # Tapered shoulder shell: back faces the aisle, front faces the monitor (-Z).
    outline=[(-.34,.74),(.34,.74),(.37,1.12),(.28,1.28),(-.28,1.28),(-.37,1.12)]
    verts=[]
    for z in [.29,.405]:
        for x,y in outline:
            verts.append((pose['x']+x*cos(pose['yaw'])+z*sin(pose['yaw']),y,
                          pose['z']-x*sin(pose['yaw'])+z*cos(pose['yaw'])))
    n=len(outline)
    mesh('Command seat '+kind+' faceted shell',verts,
         [tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],'Metal',.015)
    chair('lumbar cushion',(0,.85,.257),(.56,.20,.065),'Gasket',.025)
    chair('upper cushion',(0,1.09,.257),(.53,.24,.065),'Gasket',.026)
    chair('rear service inset',(0,1.01,.409),(.45,.29,.01),'Graphite',.003)
    for y in [.94,.99,1.04]:
        chair('rear ventilation',(0,y,.416),(.28,.012,.004),'Gasket',.001)
    for x in [-.23,.23]:
        chair('rear fastener',(x,1.17,.410),(.025,.025,.009),'Graphite',.003)
    chair('rear amber marker',(0,.79,.413),(.15,.022,.008),'Amber',.002)
# Same UV and interaction-aware batching as V8, without duplicating its furniture.
finish=v8[v8.index('for obj in set(collection.objects)-existing:'):]
finish=finish.replace('bridge-interior-v8.blend','bridge-interior-v9.blend')
finish=finish[:finish.index("print('V8")]+"print('V9 saved/exported: two console seats, original anchors and collision envelope.')"
exec(compile(finish,__file__,'exec'))
