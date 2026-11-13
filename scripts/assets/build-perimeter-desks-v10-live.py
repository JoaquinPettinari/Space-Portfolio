"""Continuous perimeter desk, real knee openings and four console seats."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
v8=(ROOT/'scripts/assets/detail-bridge-furniture-v8-live.py').read_text()
prefix=v8[:v8.index('existing = set(collection.objects)')]
prefix=prefix.replace('Bridge - Furniture Details V8','Bridge - Perimeter Desks V10').replace('Bridge - Finished Entry V7','Bridge - Command Seats V9').replace('BRIDGE V8 / Architecture','BRIDGE V10 / Architecture')
exec(compile(prefix,__file__,'exec'))
remove_prefixes=('Console','Drawer','Instrument','Control bank','Counter','Recessed service','Fastener slot','Service label','Command seat')
for obj in list(collection.objects):
    if obj.name.startswith(remove_prefixes):
        data=obj.data;bpy.data.objects.remove(obj,do_unlink=True)
        if data.users==0:bpy.data.meshes.remove(data)
existing=set(collection.objects)
layout=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
for i,seg in enumerate(layout['consoles']):
    footprint=[(x,z-3.15) for x,z in seg['footprint']]
    prism('Perimeter countertop '+str(i),footprint,.94,1.04,'Ivory')
    pose=dict(seg);pose['z']-=3.15
    for j,support in enumerate(seg['supports']):
        prism('Perimeter cabinet '+str(i)+' '+str(j),[(x,z-3.15) for x,z in support],0,.94,'Graphite')
        local=[(x-seg['x'])*cos(seg['yaw'])-(z-seg['z'])*sin(seg['yaw']) for x,z in support]
        a,b=min(local),max(local)
        # Restrained front panels, inset from miter ends and open knee bay.
        width=min(b-a-.12,.68)
        if width>.12:
            mid=(a+b)/2
            box('Perimeter cabinet panel',(mid,.49,.532),(width,.66,.014),'Metal',.006,pose)
            box('Perimeter cabinet pull',(mid,.74,.546),(min(width*.6,.24),.027,.02),'Gasket',.003,pose)
            for k in range(4):
                box('Perimeter cabinet vent',(mid,.28+k*.035,.542),(width*.7,.01,.005),'Gasket',.001,pose)
    box('Perimeter edge seam',(0,.99,.529),(seg['length']-.18,.018,.015),'Gasket',.002,pose)
    # Keep the complete knee bay free below .94 m, including its back.
    if 'opening' in seg:
        x=seg['opening']
        box('Perimeter key tray',(x,1.05,.30),(.66,.02,.24),'Graphite',.006,pose)
        for row in range(3):
            for col in range(8):
                box('Perimeter keyboard key',(x-.26+col*.074,1.065,.23+row*.065),(.05,.012,.04),'Metal',.002,pose)
        for side in [-1,1]:
            box('Perimeter amber marker',(x+side*.64,1.047,.43),(.12,.009,.018),'Amber',.002,pose)
    else:
        for side in [-1,1]:
            x=side*seg['length']*.25
            box('Perimeter auxiliary bezel',(x,1.055,-.1),(.30,.025,.25),'Graphite',.005,pose)
            for row in range(3):
                box('Perimeter auxiliary readout',(x,1.07,-.16+row*.055),(.22-row*.03,.004,.01),'Cyan',.001,pose)
# Regenerate all chairs from the same source, with the new side anchors.
layout['monitors'].update(layout['sideChairs'])
v9=(ROOT/'scripts/assets/detail-command-seats-v9-live.py').read_text()
chairs=v9[v9.index('for kind, monitor'):v9.index('# Same UV')]
exec(compile(chairs,__file__,'exec'))
finish=v8[v8.index('for obj in set(collection.objects)-existing:'):]
finish=finish.replace('bridge-interior-v8.blend','bridge-interior-v10.blend')
finish=finish[:finish.index("print('V8")]+"print('V10: continuous desks, four seats, 1.10 m knee bays; runtime export complete.')"
exec(compile(finish,__file__,'exec'))
