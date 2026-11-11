"""First architectural study. Run in live Blender; preserves existing scenes.

Design coordinates: X right, Y up, Z aft; origin on floor at pocket face.
Future game translation: [0, 0, 12.07]. No runtime integration in this stage.
"""
from pathlib import Path
import bpy
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/arrival-room'
NAME = 'Arrival Room - Architectural Study'

def build():
    assert NAME not in bpy.data.scenes, 'Study already exists; inspect before rebuilding.'
    scene = bpy.data.scenes.new(NAME)
    bpy.context.window.scene = scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1
    groups = {}
    for name in ['Floor', 'Walls', 'Window', 'Roof', 'Furniture', 'Access references']:
        col = bpy.data.collections.new('ARRIVAL / ' + name)
        scene.collection.children.link(col)
        groups[name] = col

    def mat(name, color, metal=.2, rough=.55, emission=0, alpha=1):
        m=bpy.data.materials.new('ARRIVAL '+name)
        m.use_nodes=True
        p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        p.inputs['Base Color'].default_value=(*color,1)
        p.inputs['Metallic'].default_value=metal
        p.inputs['Roughness'].default_value=rough
        p.inputs['Alpha'].default_value=alpha
        p.inputs['Emission Color'].default_value=(*color,1)
        p.inputs['Emission Strength'].default_value=emission
        m.diffuse_color=(*color,alpha)
        if alpha<1:
            enums=[i.identifier for i in m.bl_rna.properties['surface_render_method'].enum_items]
            if 'BLENDED' in enums: m.surface_render_method='BLENDED'
        return m
    graphite=mat('Graphite frame',(.065,.08,.09),.6)
    panels=mat('Warm grey panels',(.29,.31,.30),.35)
    cream=mat('Ivory cabinets',(.52,.51,.44),.2)
    black=mat('Gaskets',(.015,.023,.029),.05,.8)
    fabric=mat('Bench cushions',(.045,.06,.065),0,.88)
    amber=mat('Amber lamps',(1,.55,.22),.1,.35,2)
    cyan=mat('Cyan technical',(.08,.65,.8),.1,.35,1)
    glass=mat('Glazing',(.23,.42,.5),.05,.15,0,.16)

    def xyz(p): return Vector((p[0],-p[2],p[1]))
    def box(name,at,size,material,group='Walls',bevel=.015):
        sx,sy,sz=size[0]/2,size[2]/2,size[1]/2
        vs=[(a*sx,b*sy,c*sz) for a,b,c in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]]
        mesh=bpy.data.meshes.new(name)
        mesh.from_pydata(vs,[],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)])
        mesh.update()
        o=bpy.data.objects.new('ARR '+name,mesh)
        groups[group].objects.link(o)
        o.location=xyz(at)
        mesh.materials.append(material)
        if bevel:
            mod=o.modifiers.new('Soft manufactured edges','BEVEL')
            mod.width=min(bevel,min(size)/4)
            mod.segments=2
        return o
    def beam(name,a,b,width,depth,material,group='Walls'):
        d=xyz(b)-xyz(a)
        o=box(name,tuple((a[i]+b[i])/2 for i in range(3)),(width,d.length,depth),material,group)
        o.rotation_mode='QUATERNION'
        axis=d.normalized()
        depth=Vector((0,1,0)) if abs(axis.y)<.99 else Vector((1,0,0))
        o.rotation_quaternion=Matrix((depth.cross(axis),depth,axis)).transposed().to_quaternion()
        return o

    # Supporting slab stays below finished plates: no coplanar floor layers.
    box('floor substrate',(0,-.14,2.065),(5.6,.20,4.13),graphite,'Floor')
    for x in [-2.1,-.7,.7,2.1]:
        for z in [.516,1.549,2.582,3.615]:
            box('deck plate',(x,-.02,z),(1.37,.04,1.0),panels,'Floor',.007)
    for x in [-1.58,1.58]:
        for z in [.65,1.68,2.71,3.65]:
            box('inset path light',(x,.006,z),(.035,.012,.65),amber,'Floor',.002)

    # Bulkhead opening matches existing 2.68 x 2.50 m. Door sweep stays forward of origin.
    for side in [-1,1]:
        box('front wall',(side*2.08,1.25,-.06),(1.48,2.5,.12),panels)
        box('front jamb',(side*1.40,1.25,.03),(.12,2.5,.16),graphite)
        box('jamb light',(side*1.49,1.8,.125),(.035,.65,.025),amber)
    box('access header',(0,2.79,-.02),(5.6,.58,.16),panels)
    box('opening lintel',(0,2.55,.04),(2.8,.10,.18),graphite)
    box('lintel lamp',(0,2.49,.11),(2.35,.025,.06),amber)
    # Rear docking aperture remains 2.4m wide and 2.5m tall.
    for side in [-1,1]:
        box('rear wall',(side*2,1.25,4.18),(1.6,2.5,.16),panels)
        box('rear jamb',(side*1.22,1.25,4.08),(.12,2.5,.20),graphite)
    box('rear header',(0,2.8,4.18),(5.6,.6,.16),panels)

    # Left panoramic glazing leans in near ceiling, with three framed panes.
    box('window plinth',(-2.76,.40,2.065),(.16,.8,4.13),panels)
    for z in [0,1.377,2.754,4.13]:
        beam('window rib',(-2.76,.80,z),(-2.49,2.45,z),.12,.13,graphite,'Window')
        beam('upper shoulder',(-2.49,2.45,z),(-2.12,3.0,z),.14,.15,graphite,'Roof')
    for a,b in [(( -2.76,.8,0),(-2.76,.8,4.13)),((-2.49,2.45,0),(-2.49,2.45,4.13))]:
        beam('window sill',a,b,.12,.14,graphite,'Window')
    for z in [.6885,2.0655,3.442]:
        beam('panoramic glass',(-2.75,.85,z),(-2.50,2.40,z),.016,1.24,glass,'Window')
        beam('window mid rail',(-2.62,1.64,z-.63),(-2.62,1.64,z+.63),.055,.065,graphite,'Window')
    box('outer hull sill',(-2.97,.65,2.065),(.45,.16,4.13),graphite,'Window')

    box('starboard wall',(2.8,1.22,2.065),(.16,2.44,4.13),panels)
    for z in [.15,1.45,2.75,4.0]:
        beam('starboard rib',(2.72,.1,z),(2.72,2.45,z),.12,.12,graphite)
        beam('starboard shoulder',(2.72,2.45,z),(2.12,3,z),.16,.15,graphite,'Roof')
    # Faceted roof shoulders and removable roof plates.
    for side in [-1,1]:
        a=(side*(2.49 if side<0 else 2.72),2.45,2.065)
        beam('ceiling shoulder panel',a,(side*2.12,3,2.065),.10,4.13,panels,'Roof')
    for z in [.516,1.549,2.582,3.615]:
        box('ceiling panel',(0,3.05,z),(4.24,.10,1.0),graphite,'Roof')
        box('roof crossmember',(0,2.96,z-.49),(4.30,.13,.10),panels,'Roof')
        for x in [-1.6,1.6]:
            box('ceiling lamp housing',(x,2.96,z),(.45,.14,.76),black,'Roof')
            box('ceiling amber diffuser',(x,2.88,z),(.32,.025,.63),amber,'Roof')

    # Simple furniture volumes, inset from circulation and terminal interaction.
    for z in [1.8,2.65,3.5]:
        box('bench locker',(-2.27,.24,z),(.78,.48,.82),cream,'Furniture')
        box('bench seat',(-2.24,.53,z),(.78,.12,.80),fabric,'Furniture',.04)
        box('bench back',(-2.59,.83,z),(.13,.52,.80),fabric,'Furniture',.03)
        box('locker pull',(-1.866,.28,z),(.025,.035,.22),black,'Furniture')
    box('service cabinet',(-2.15,.48,.48),(1.0,.96,.62),cream,'Furniture')
    box('service countertop',(-2.15,.99,.48),(1.10,.06,.72),black,'Furniture')
    box('memory board backing',(-2.1,1.65,.06),(.95,.8,.08),black,'Furniture')
    for z in [1.9,3.2]:
        box('technical cabinet',(2.57,1.34,z),(.30,1.8,1.0),cream,'Furniture')
        box('cabinet handle',(2.39,1.34,z+.30),(.04,.25,.035),black,'Furniture')
    box('crew terminal reserved',(2,1.68,.445),(.65,.84,.16),graphite,'Access references')
    box('crew display reserved',(2,1.72,.535),(.48,.53,.025),cyan,'Access references')
    scene['stage']='Architectural study only; reference terminal is not a runtime duplicate.'
    scene['game_translation']='[0,0,12.07]; front=0, docking hatch=4.13'
    scene['door_opening']='2.68 x 2.50m; existing moving door stays separate'
    for area in bpy.context.screen.areas:
        if area.type=='VIEW_3D':
            space=area.spaces.active
            space.shading.type='MATERIAL'
            eye=xyz((.7,1.7,3.85)); target=xyz((-.25,1.55,.4))
            space.region_3d.view_rotation=(target-eye).to_track_quat('-Z','Y')
            space.region_3d.view_distance=(target-eye).length
            space.region_3d.view_location=target
            space.region_3d.view_perspective='PERSP'
            space.lens=22
            space.clip_start=.02
    OUT.mkdir(parents=True,exist_ok=True)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'arrival-room-study.blend'))
    for obj in scene.objects: obj.select_set(obj.type=='MESH')
    bpy.ops.export_scene.gltf(filepath=str(OUT/'arrival-room-study.glb'),
                              export_format='GLB',use_selection=True,export_yup=True,
                              use_active_scene=True,export_apply=True,
                              export_cameras=False,export_lights=False)
    for obj in scene.objects: obj.select_set(False)
    print('Arrival study created:',len(scene.objects),'objects. Existing scene retained. No game changes.')

if __name__=='__main__': build()
