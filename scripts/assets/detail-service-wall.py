"""Reference-led starboard service wall, authored inside the shared collider.

Called by detail-reference-cabin in a disposable Blender export process. Reuses
its mesh/material helpers and batches; no lights or interactive screens exported.
"""
from math import pi
import bpy


def dress(arrival, details, made, box, tube, ring, plant, mesh, mats, layout):
    arrival = [o for o in arrival if not o.get('original_object', '').startswith(
        ('ARR10 technical cabinet', 'ARR10 cabinet '))]
    details = [o for o in details if not o.name.startswith('CLEAN / Filter ')]
    mats['service_seat'] = mats['stripe']
    mats['medical_red'] = bpy.data.materials['ARRIVAL V6 Medical red']
    bay = layout['serviceBay']
    before = len(made)

    def text(body, y, z, size=.052, finish='cloth', x=3.665):
        # Text normal points towards -X, into the room; horizontal reads along +Z.
        bpy.ops.object.text_add(location=(x,-z,y), rotation=(pi/2,0,-pi/2))
        o=bpy.context.object; o.name='SERVICE / '+body.replace('\n',' ')
        o.data.body=body; o.data.size=size; o.data.extrude=0
        o.data.resolution_u=2
        o.data.space_line=1.15; o.data.materials.append(mats[finish])
        bpy.ops.object.convert(target='MESH'); made.append(bpy.context.object)

    def face(name, y, z, height, width, finish='frame', x=3.79, depth=.07, bevel=.025):
        return box('SERVICE / '+name,(x,y,z),(depth,height,width),finish,bevel)

    def lamp(y,z,width):
        face('Practical recess',y,z,.085,width+.10,'dark',3.71,.07,.012)
        face('Amber diffuser',y,z,.026,width,'warm',3.668,.014,.009)

    def fasteners(z,width,bottom=.37,top=2.42):
        for zz in [z-width/2+.06,z+width/2-.06]:
            for yy in [bottom,top]: face('Captive bolt',yy,zz,.022,.022,'alloy',3.665,.012,.005)

    # The existing continuous backing/plinth close rear gaps. Define a deliberate
    # single wall face in front, instead of another bank of floating cabinets.
    for z in [12.90,14.67,15.55,16.23,17.08,17.68]:
        face('Bay divider',1.42,z,2.35,.065,'frame',3.80,.20,.014)
    face('Continuous upper fascia',2.58,15.29,.13,4.73,'frame',3.90,.25,.018)
    face('Lower maintenance fascia',.22,15.29,.15,4.73,'frame',3.85,.25,.018)

    # Personal shelf/storage zone at the bridge end, clear of the access terminal.
    # Cover the retained structural cladding/lip with the continuous finish face.
    face('Personal zone backing',1.46,13.77,2.06,1.68,'frame',3.95,.07,.025)
    text('CRUZ DEL SUR',2.32,13.02,.105,'cloth',3.905)
    text('EXPLORATION VESSEL',2.21,13.02,.043,'bronze',3.905)
    for y in [1.15,1.82]:
        box('SERVICE / Display shelf',(3.99,y,13.77),(.64,.045,1.63),'alloy',.012)
        lamp(y-.044,13.77,1.42)
    # Three drawers with individually padded seats; cases are secured on top,
    # never loose in the aisle or behind the cabinetry.
    for i in range(3):
        z=13.21+i*.50
        face('Storage chassis',.39,z,.30,.47,'frame',3.98,.66,.027)
        face('Storage drawer',.39,z,.25,.42,'alloy',3.637,.025,.012)
        face('Recessed drawer pull',.44,z,.039,.15,'dark',3.618,.016,.008)
        box('SERVICE / Saddle cushion',(3.96,.575,z),(.61,.12,.47),'service_seat',.04)
    for z in [13.24,14.22]: lamp(.205,z,.30)
    # Compact survey case and a restrained ochre equipment pouch on the bench.
    face('Survey case',.82,13.83,.34,.44,'frame',3.96,.34,.028)
    face('Case lid seam',.92,13.83,.025,.45,'dark',3.775,.015,.004)
    for z in [13.68,13.98]:
        face('Case clasp',.91,z,.07,.035,'alloy',3.76,.025,.007)
    face('Equipment pouch',.72,14.27,.19,.29,'bronze',3.95,.32,.035)
    for z in [14.18,14.36]: face('Pouch strap',.72,z,.195,.025,'dark',3.775,.012,.005)

    for i in range(7):
        z=13.20+i*.073
        face('Reference manual',1.35+(i%3)*.012,z,.35+(i%3)*.024,.057,
             'cloth' if i==3 else 'bronze' if i%3==1 else 'frame',3.78,.20,.004)
        for yy in [1.23,1.41]: face('Manual spine rule',yy,z,.008,.043,'alloy',3.675,.008,.002)
    plant((3.76,1.845,13.18),.30)
    # Existing expedition imagery: no additional download or large image.
    mats['service_picture']=bpy.data.materials.get('ARRIVAL_MEMORY_01',mats['dark'])
    face('Landscape frame',2.065,14.12,.39,.76,'bronze',3.86,.06,.014)
    photo=mesh('Service expedition image',[(3.824,1.895,13.77),(3.824,1.895,14.47),
               (3.824,2.235,14.47),(3.824,2.235,13.77)],[(0,1,2,3)],'service_picture',False)
    for loop,uv in zip(photo.data.uv_layers.active.data,[(0,0),(1,0),(1,1),(0,1)]): loop.uv=uv
    box('SERVICE / Armillary foot',(3.76,1.19,14.22),(.22,.035,.25),'bronze',.018)
    tube('Service armillary stem',[(3.76,1.20,14.22),(3.76,1.40,14.22)],.012,'bronze')
    for axis in ['x','y','z']: ring('Service armillary orbit',(3.76,1.43,14.22),.14,'bronze',axis,.006)

    # Maintenance cabinet: deep reveal, inset face, hinges and lower safety marks.
    face('Maintenance reveal',1.40,15.11,2.30,.79,'dark',3.86,.20,.04)
    face('Maintenance panel',1.40,15.11,2.19,.68,'frame',3.725,.065,.035)
    lamp(2.51,15.11,.40)
    for y in [1.97,2.015,2.06]: face('Maintenance vent',y,15.11,.012,.23,'dark',3.68,.016,.003)
    for y in [.66,1.27,2.17]: face('Maintenance hinge',y,14.81,.10,.045,'alloy',3.675,.025,.006)
    text('MAINTENANCE\nLOCKER',1.60,14.89,.055)
    # Crossed maintenance tools use the same brushed metal batch.
    for sign in [-1,1]:
        tube('Crossed service tool',[(3.66,1.86,15.11-sign*.06),(3.66,1.74,15.11+sign*.06)],.009,'alloy',6)
    for i in range(3): face('Maintenance caution mark',.49,15.02+i*.09,.035,.055,'bronze',3.68,.012,.003)
    fasteners(15.11,.68)

    # Open engineering bay. Pipes bend around four accessible service boxes.
    face('Open engineering recess',1.40,15.89,2.30,.61,'dark',3.97,.06,.035)
    for z in [15.66,16.12]:
        tube('Copper coolant riser',[(3.89,.48,z),(3.89,2.19,z),(3.89,2.29,15.89)],.028,'bronze',10)
        for y in [.64,1.12,1.79,2.12]:
            face('Pipe collar',y,z,.055,.079,'alloy',3.89,.078,.008)
    for y,z,w,h in [(2.20,15.89,.30,.19),(1.80,15.87,.35,.32),(1.25,15.95,.30,.22),(.64,15.90,.39,.37)]:
        face('Electrical service module',y,z,h,w,'frame',3.88,.25,.025)
        for dz in [-w*.28,w*.28]: face('Module captive bolt',y+h*.32,z+dz,.016,.016,'alloy',3.746,.012,.004)
        for j in range(3): face('Module status pin',y-.04,z-.07+j*.045,.035,.012,'cyan',3.746,.008,.003)
    tube('Flexible service harness',[(3.90,.55,15.73),(3.85,.86,15.72),(3.87,1.03,15.93),
         (3.90,1.52,15.98),(3.90,2.10,16.04)],.016,'dark',8)
    text('!',1.79,15.85,.12,'bronze',3.742)
    face('Engineering cyan header',2.53,15.89,.018,.28,'cyan',3.77,.014,.004)

    # Life support is a static instrument panel, not a new mission or input mode.
    face('Life support reveal',1.40,16.66,2.30,.76,'dark',3.86,.20,.04)
    face('Life support panel',1.40,16.66,2.19,.65,'frame',3.725,.065,.035)
    lamp(2.51,16.66,.40)
    text('LIFE SUPPORT',2.12,16.39,.051)
    text('ENVIRONMENTAL\nCONTROL',2.02,16.39,.033)
    face('Environmental display bezel',1.42,16.66,.69,.51,'alloy',3.674,.04,.025)
    face('Environmental display glass',1.42,16.66,.62,.445,'dark',3.648,.014,.018)
    text('O2    21.0%\nCO2   0.04%\nPRESS 101.3\nTEMP  22.0',1.62,16.47,.042,'cyan',3.637)
    for y in [.48,.53,.58,.63,.68,.73]: face('Life support louvre',y,16.66,.022,.44,'dark',3.672,.035,.006)
    fasteners(16.66,.65)
    lamp(.31,16.66,.26)

    # A narrow medical niche and status plaque complete the docking end.
    face('Medical reveal',1.23,17.39,1.30,.47,'dark',4.01,.13,.028)
    face('Emergency medical case',1.42,17.39,.52,.35,'medical_red',3.83,.27,.035)
    face('Medical cross vertical',1.49,17.39,.20,.063,'cloth',3.686,.012,.003)
    face('Medical cross horizontal',1.49,17.39,.064,.19,'cloth',3.685,.014,.003)
    text('MED KIT',1.23,17.28,.035,'cloth',3.679)
    lamp(1.99,17.39,.24)
    face('Docking status bezel',2.30,17.39,.37,.46,'alloy',3.78,.11,.018)
    face('Docking status glass',2.30,17.39,.31,.40,'dark',3.717,.018,.014)
    text('DOCKING BAY\nARRIVAL\nSYSTEMS NOMINAL',2.39,17.22,.032,'cyan',3.704)
    for y in [.40,.45,.50,.55,.60]: face('Low ventilation louvre',y,17.39,.022,.32,'dark',3.72,.08,.006)
    lamp(.27,17.39,.27)
    for z in [14.86,15.86]: lamp(.20,z,.29)

    # Bound authoring output before batching; static detail must not enter aisle.
    bpy.context.view_layer.update()
    from mathutils import Vector
    bounds = []
    for obj in made[before:]:
        if obj.type != 'MESH': continue
        # Small machined panels need a chamfer, not three rounded edge rings.
        for modifier in obj.modifiers:
            if modifier.type == 'BEVEL': modifier.segments=1
        points=[obj.matrix_world @ Vector(v) for v in obj.bound_box]
        assert min(p.x for p in points) >= bay['frontX']-.015, obj.name
        assert max(p.x for p in points) <= bay['rearX']+.015, obj.name
        assert min(-p.y for p in points) >= bay['startZ']-.015, obj.name
        assert max(-p.y for p in points) <= bay['endZ']+.015, obj.name
        assert min(p.z for p in points) >= -.015, obj.name
        assert max(p.z for p in points) <= bay['height']+.015, obj.name
        if any(part in obj.name.lower() for part in ('armillary', 'terracotta',
                'planter soil', 'plant stem', 'botanical leaf', 'reference manual', 'manual spine')):
            assert max(p.x for p in points) < 3.915, 'Shelf prop intersects backing: '+obj.name
        bounds.extend((p.x,p.z,-p.y) for p in points)
    from pathlib import Path
    import json
    report = Path(__file__).resolve().parents[2] / 'docs/assets/cabin-reference/service-wall-bounds.json'
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps({'newObjects':len(made)-before, 'collider':bay,
        'min':[min(p[i] for p in bounds) for i in range(3)],
        'max':[max(p[i] for p in bounds) for i in range(3)]},indent=2),encoding='utf-8')
    return arrival, details
