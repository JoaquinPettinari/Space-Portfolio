"""Four manufactured monitor shells; preserve runtime screen planes and input."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
v8=(ROOT/'scripts/assets/detail-bridge-furniture-v8-live.py').read_text()
prefix=v8[:v8.index('existing = set(collection.objects)')]
prefix=prefix.replace('Bridge - Furniture Details V8','Bridge - Console Monitors V12').replace('Bridge - Finished Entry V7','Bridge - Tactical Table V11').replace('BRIDGE V8 / Architecture','BRIDGE V12 / Architecture')
exec(compile(prefix,__file__,'exec'))
existing=set(collection.objects)
layout=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
screens={kind:{'position':[m['position'][0],m['position'][1],m['position'][2]-3.15], 'rotation':m['rotation'],'frame':[1.8,1.1],'display':[1.6,.9]} for kind,m in layout['monitors'].items()}
from math import pi
screens.update({'personal':{'position':[4.205,1.68,2.1-3.15],'rotation':-pi/2,'frame':[1.3,1.1],'display':[1.1,.8]},'arcade':{'position':[-4.205,1.68,.4-3.15],'rotation':pi/2,'frame':[1.3,1.1],'display':[1.1,.8]}})
def octagon(w,h,c):
    return [(-w+c,-h),(w-c,-h),(w,-h+c),(w,h-c),(w-c,h),(-w+c,h),(-w,h-c),(-w,-h+c)]
for kind,s in screens.items():
    start=set(collection.objects)
    px,py,pz=s['position'];a=s['rotation'];w,h=[v/2 for v in s['frame']];iw,ih=[v/2+.009 for v in s['display']]
    pose={'x':px,'z':pz,'yaw':a}
    def world(p):
        x,y,z=p
        return (px+x*cos(a)+z*sin(a),py+y,pz-x*sin(a)+z*cos(a))
    def piece(name,at,size,mat,bevel=.004):
        return box('Monitor '+kind+' '+name,(at[0],py+at[1],at[2]),size,mat,bevel,pose)
    def shell(name,outer,inner,back,front,mat):
        pts=[world((x,y,z)) for z in [back,front] for loop in [outer,inner] for x,y in loop]
        faces=[]
        for i in range(8):
            j=(i+1)%8
            faces.extend([(i,j,j+16,i+16),(i+8,i+24,j+24,j+8),(i+16,j+16,j+24,i+24),(i,i+8,j+8,j)])
        return mesh('Monitor '+kind+' '+name,pts,faces,mat,.003)
    outer=octagon(w,h,.045);aperture=octagon(iw,ih,.003)
    shell('rear shroud',outer,aperture,-.18,-.055,'Graphite')
    shell('machined bezel',outer,aperture,-.055,.006,'Metal')
    # Separate thin dark gasket; inset remains outside the actual display.
    shell('screen seal',octagon(iw+.015,ih+.015,.004),aperture,.007,.012,'Graphite')
    piece('rear service cover',(0,0,-.164),(w*1.80,h*1.75,.018),'Graphite',.012)
    for side in [-1,1]:
        for y in [-h+.055,h-.055]:
            piece('captive screw',(side*(w-.045),y,.011),(.022,.022,.009),'Graphite',.003)
        for y in [-.14,-.07,0,.07,.14]:
            piece('rear ventilation',(side*w*.66,y,-.178),(.13,.018,.008),'Metal',.002)
    piece('status recess',(-w*.55,-h+.045,.012),(.18,.033,.009),'Graphite',.003)
    piece('status light',(-w*.55,-h+.045,.018),(.105,.012,.004),'Amber',.001)
    for x in [w*.30,w*.43,w*.56]:
        piece('bezel key',(x,-h+.045,.014),(.032,.022,.012),'Graphite',.003)
    piece('mounting foot',(0,1.06-py,-.13),(.40,.04,.29),'Metal',.01)
    piece('mounting neck',(0,1.16-py,-.13),(.13,.20,.12),'Graphite',.012)
    piece('neck inset',(0,1.16-py,-.065),(.065,.12,.009),'Metal',.003)
    # Physical keys flank the existing keyboard; decorative, no new actions.
    for side in [-1,1]:
        piece('console key bank',(side*.44,1.052-py,.30),(.14,.018,.22),'Graphite',.004)
        for j in range(3):
            piece('console raised key',(side*.44,1.068-py,.23+j*.065),(.075,.018,.043),'Metal',.004)
        piece('console key lamp',(side*.44,1.08-py,.23),(.037,.004,.012),'Amber',.001)
    for obj in set(collection.objects)-start:obj['interaction']=kind
finish=v8[v8.index('for obj in set(collection.objects)-existing:'):]
finish=finish.replace('bridge-interior-v8.blend','bridge-interior-v12.blend')
finish=finish[:finish.index("print('V8")]+"print('V12 exported: four interactive monitor shells; original display anchors.')"
exec(compile(finish,__file__,'exec'))
