"""Faceted tactical plinth and open layered rim; retain live display/hologram."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
v8=(ROOT/'scripts/assets/detail-bridge-furniture-v8-live.py').read_text()
prefix=v8[:v8.index('existing = set(collection.objects)')]
prefix=prefix.replace('Bridge - Furniture Details V8','Bridge - Tactical Table V11').replace('Bridge - Finished Entry V7','Bridge - Perimeter Desks V10').replace('BRIDGE V8 / Architecture','BRIDGE V11 / Architecture')
exec(compile(prefix,__file__,'exec'))
for obj in list(collection.objects):
    if obj.get('interaction')=='tactical':
        data=obj.data;bpy.data.objects.remove(obj,do_unlink=True)
        if data.users==0:bpy.data.meshes.remove(data)
existing=set(collection.objects)
Z=-2.65

def outline(x,z,cut):
    return [(-x+cut,-z),(x-cut,-z),(x,-z+cut),(x,z-cut),(x-cut,z),(-x+cut,z),(-x,z-cut),(-x,-z+cut)]
def solid(name,lower,upper,bottom,top,material):
    pts=[(x,y,z+Z) for y,loop in [(bottom,lower),(top,upper)] for x,z in loop]
    return mesh(name,pts,[tuple(reversed(range(8))),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)],material,.009)
def ring(name,outer,inner,bottom,top,material):
    pts=[(x,y,z+Z) for y in [bottom,top] for loop in [outer,inner] for x,z in loop]
    fs=[]
    for i in range(8):
        j=(i+1)%8
        fs.extend([(i,j,j+16,i+16),(i+8,i+24,j+24,j+8),(i+16,j+16,j+24,i+24),(i,i+8,j+8,j)])
    return mesh(name,pts,fs,material,.004)
solid('Tactical foundation',outline(.85,1.12,.17),outline(.85,1.12,.17),.025,.14,'Graphite')
solid('Tactical lower armor',outline(.81,1.08,.16),outline(.73,1.00,.15),.14,.22,'Metal')
solid('Tactical tapered pedestal',outline(.73,1.00,.15),outline(.66,.94,.14),.22,.85,'Graphite')
solid('Tactical shoulder',outline(.66,.94,.14),outline(.91,1.20,.12),.82,.91,'Metal')
# Open aperture is larger than the unchanged 1.8 x 2.4 React display.
inner=outline(.913,1.213,.004)
ring('Tactical underside rim',outline(1.04,1.34,.115),inner,.90,.98,'Graphite')
ring('Tactical upper bezel',outline(1.04,1.34,.115),inner,.98,1.065,'Metal')
# Split trim and fixings provide real edges without a competing coplanar slab.
for side in [-1,1]:
    for x in [-.38,.38]:
        box('Tactical front service plate',(x,.52,Z+side*.984),(.55,.45,.024),'Metal',.012)
        box('Tactical front inset',(x,.52,Z+side*1.000),(.44,.32,.012),'Graphite',.005)
        for dx in [-.21,.21]:
            for y in [.36,.68]:
                box('Tactical front fixing',(x+dx,y,Z+side*1.011),(.025,.025,.012),'Metal',.003)
    box('Tactical plinth diffuser',(0,.105,Z+side*1.125),(.70,.032,.014),'Amber',.004)
    for x in [-.60,.60]:
        box('Tactical rim lamp pocket',(x,1.012,Z+side*1.342),(.30,.045,.008),'Graphite',.002)
        box('Tactical rim diffuser',(x,1.012,Z+side*1.347),(.21,.022,.004),'Amber',.001)
    for z in [-.55,.55]:
        box('Tactical side service plate',(side*.723,.50,Z+z),(.022,.42,.62),'Metal',.008)
        for j in range(5):
            box('Tactical side louvre',(side*.738,.38+j*.05,Z+z),(.012,.018,.44),'Graphite',.002)
    for z in [-.85,0,.85]:
        box('Tactical top fixing',(side*.979,1.069,Z+z),(.026,.008,.026),'Graphite',.002)
    for z in [-.80,.80]:
        box('Tactical pedestal rib',(side*.76,.43,Z+z),(.08,.48,.085),'Metal',.012)
for obj in set(collection.objects)-existing:obj['interaction']='tactical'
finish=v8[v8.index('for obj in set(collection.objects)-existing:'):]
finish=finish.replace('bridge-interior-v8.blend','bridge-interior-v11.blend')
finish=finish[:finish.index("print('V8")]+"print('V11 exported: faceted tactical pedestal and open rim; display retained in React.')"
exec(compile(finish,__file__,'exec'))
