"""Run in the open Blender via MCP with STAGE='structure', 'glazing', or 'save'.

Preserves the original collection. Coordinates below are glTF X/Y-up/Z.
Requires the editable v1 source; does not open/replace the user's file.
"""
from pathlib import Path
import json
import shutil
import bpy
from mathutils import Matrix, Vector, Quaternion

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/panoramic-bay'
LENGTH = 6.1 / 3
NAME = 'Panoramic Bay V2'
PROFILE = [(1.65, .10), (2.05, .85), (2.05, 2.4), (1.65, 3.2)]


def point(x, y, z):
    return Vector((x, -z, y))


def box(name, at, size, material, assembly, bevel=.01, basis=None):
    half = Vector((size[0], size[2], size[1])) / 2
    vertices = [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),
                (1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]
    vertices = [Vector((x*half.x,y*half.y,z*half.z)) for x,y,z in vertices]
    if basis is not None:
        vertices = [basis @ v for v in vertices]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], [(0,4,6,2),(1,3,7,5),(0,1,5,4),
                                    (2,6,7,3),(0,2,3,1),(4,5,7,6)])
    mesh.update()
    obj = bpy.data.objects.new('V2 ' + name, mesh)
    bpy.data.collections[NAME].objects.link(obj)
    obj.location = point(*at)
    obj.data.materials.append(bpy.data.materials[material])
    obj['assembly'] = assembly
    if bevel:
        mod = obj.modifiers.new('Edge bevel', 'BEVEL')
        mod.width = min(bevel, min(size) / 4)
        mod.segments = 2
    return obj


def beam(name, a, b, width, depth, material, assembly, bevel=.01):
    delta = point(*b) - point(*a)
    axis = delta.normalized()
    y = Vector((0,1,0))
    basis = Matrix((y.cross(axis), y, axis)).transposed()
    return box(name, tuple((a[i]+b[i])/2 for i in range(3)),
               (width,delta.length,depth), material,assembly,bevel,basis)


def structure():
    assert NAME not in bpy.data.collections, 'V2 already exists; inspect before rerunning.'
    assert bpy.context.mode == 'OBJECT'
    original = bpy.data.objects.get('DECK structural tray')
    assert original is not None, 'Open the editable panoramic-bay.blend first.'
    old = original.users_collection[0]
    col = bpy.data.collections.new(NAME)
    bpy.context.scene.collection.children.link(col)
    # The floor keeps its established details, widened from 3.14 to 3.4 m.
    for src in list(old.objects):
        if src.type == 'MESH' and src.get('assembly') == 'FLOOR':
            obj = src.copy()
            obj.data = src.data.copy()
            obj.name = 'V2 ' + src.name
            col.objects.link(obj)
            obj.matrix_world = Matrix.Diagonal((3.4/3.14,1,1,1)) @ src.matrix_world
            # Recess supporting surfaces below the visible plates/slats (top Y=0).
            if src.name.startswith('DECK structural tray'):
                obj.location.z -= .04
            elif src.name.startswith('DECK grating recess'):
                obj.location.z -= .012
    old.name = 'Original Bay V1 (comparison)'
    old.hide_viewport = True
    old.hide_render = True
    for side in [-1,1]:
        for z in [-LENGTH/2+.07, LENGTH/2-.07]:
            for i, (a,b) in enumerate(zip(PROFILE, PROFILE[1:])):
                beam('RIB %s %s %s' % (side,z,i), (side*a[0],a[1],z),
                     (side*b[0],b[1],z), .14,.14,'Graphite structural alloy','STRUCTURE')
        for x,y in PROFILE:
            box('longitudinal sill', (side*x,y,0), (.12,.12,LENGTH),
                'Graphite structural alloy','STRUCTURE')
        box('floor cyan guide',(side*1.57,.028,0),(.025,.018,LENGTH-.26),
            'Cyan floor guidance','FLOOR',.003)
        # External rails sit below the lower glazing, visible through it.
        box('outer hull shoulder',(side*2.20,.12,0),(.34,.14,LENGTH),
            'Warm grey removable panels','OUTER_HULL')
        box('outer hull rail',(side*2.37,.23,0),(.08,.12,LENGTH),
            'Machined edge steel','OUTER_HULL')
        for z in [-.72,0,.72]:
            beam('outer bracket',(side*1.75,.16,z),(side*2.36,.23,z),
                 .08,.08,'Graphite structural alloy','OUTER_HULL')
    for z in [-LENGTH/2+.07,LENGTH/2-.07]:
        beam('ROOF crossbeam',(-1.65,3.2,z),(1.65,3.2,z),
             .14,.14,'Graphite structural alloy','ROOF')
    box('ROOF spine',(0,3.2,0),(.13,.14,LENGTH),
        'Graphite structural alloy','ROOF')
    for a in bpy.context.screen.areas:
        if a.type == 'VIEW_3D':
            a.spaces.active.region_3d.view_location = (0,0,1.5)
            a.spaces.active.region_3d.view_rotation = Quaternion((1,0,0), 1.57079632679)
            a.spaces.active.region_3d.view_distance = 7.0
    bpy.context.view_layer.update()
    print('Structure ready: floor 3.4 m; middle envelope 4.1 m; roof 3.3 m; height 3.2 m.')


def glazing():
    assert NAME in bpy.data.collections
    assert not any(o.name.startswith('V2 GLASS') for o in bpy.data.collections[NAME].objects)
    glass = bpy.data.materials['Blue-grey glazing'].copy()
    glass.name = 'Blue-grey glazing V2'
    methods = [i.identifier for i in glass.bl_rna.properties['surface_render_method'].enum_items]
    if 'BLENDED' in methods:
        glass.surface_render_method = 'BLENDED'
    for side in [-1,1]:
        for i,(a,b) in enumerate(zip(PROFILE,PROFILE[1:])):
            # Shorten the glass at its ends so it seats within frame channels.
            d = Vector(b)-Vector(a)
            start,end = Vector(a)+d.normalized()*.055, Vector(b)-d.normalized()*.055
            beam('GLASS side facet %s %s'%(side,i),
                 (side*start.x,start.y,0),(side*end.x,end.y,0),
                 .012,LENGTH-.22,glass.name,'GLASS',0)
            for z in [-LENGTH/2+.13,LENGTH/2-.13]:
                beam('gasket side facet', (side*start.x,start.y,z),
                     (side*end.x,end.y,z),.035,.028,'Black glazing gaskets','STRUCTURE',.002)
        for x,y in PROFILE:
            box('glazing joint',(side*(x-.025),y,0),(.045,.045,LENGTH-.16),
                'Black glazing gaskets','STRUCTURE',.002)
        # Flat ceiling lights: opaque housing only on top, no shoulder lamps.
        box('ROOF lamp housing',(side*1.29,3.19,0),(.375,.12,LENGTH-.30),
            'Off-white ceramic housings','ROOF')
        box('ROOF lamp recess',(side*1.29,3.121,0),(.30,.025,LENGTH-.39),
            'Black glazing gaskets','ROOF',.003)
        box('ROOF amber diffuser',(side*1.29,3.102,0),(.21,.016,LENGTH-.48),
            'Amber diffuser','ROOF',.003)
        box('GLASS roof',(side*.84,3.2,0),(1.51,.012,LENGTH-.22),
            glass.name,'ROOF_GLASS',0)
    # Material view shows alpha glass; solid shading deliberately looks opaque.
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            shading = area.spaces.active.shading
            valid = [i.identifier for i in shading.bl_rna.properties['type'].enum_items]
            if 'MATERIAL' in valid:
                shading.type = 'MATERIAL'
    bpy.context.view_layer.update()
    print('Six glazed side facets + two skylights. Lamp housings now only on flat roof.')


def save_export():
    col = bpy.data.collections[NAME]
    bpy.context.scene['module_length_m'] = LENGTH
    bpy.context.scene['v2_profile_xy'] = json.dumps(PROFILE)
    bpy.context.scene['integration'] = 'Native-scale V2: three bays in PanoramicPassage; faceted colliders.'
    valid = [i.identifier for i in bpy.context.preferences.filepaths.bl_rna.properties['file_preview_type'].enum_items]
    if 'NONE' in valid:
        bpy.context.preferences.filepaths.file_preview_type = 'NONE'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'panoramic-bay-v2.blend'))
    # Export evaluated copies batched per assembly/material, never join source parts.
    temp = bpy.data.collections.new('V2 export temporary')
    bpy.context.scene.collection.children.link(temp)
    deps = bpy.context.evaluated_depsgraph_get()
    groups = {}
    for obj in col.objects:
        if obj.type != 'MESH': continue
        key = (obj.get('assembly','STRUCTURE'),obj.data.materials[0])
        verts,faces = groups.setdefault(key,([],[]))
        evaluated = obj.evaluated_get(deps)
        mesh = evaluated.to_mesh()
        offset = len(verts)
        verts.extend(tuple(obj.matrix_world @ v.co) for v in mesh.vertices)
        faces.extend(tuple(offset+i for i in p.vertices) for p in mesh.polygons)
        evaluated.to_mesh_clear()
    exports=[]
    previous_selected=list(bpy.context.selected_objects)
    for obj in previous_selected: obj.select_set(False)
    try:
        for (assembly,mat),(verts,faces) in groups.items():
            mesh=bpy.data.meshes.new('V2 export mesh')
            mesh.from_pydata(verts,[],faces)
            mesh.update()
            obj=bpy.data.objects.new('V2_'+assembly+'__'+mat.name.replace(' ','_'),mesh)
            temp.objects.link(obj)
            mesh.materials.append(mat)
            obj.select_set(True)
            exports.append(obj)
        out=ROOT/'src/dev/assets/05-panoramic-bay-v2.glb'
        bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,
                                  export_yup=True,export_cameras=False,export_lights=False)
        shutil.copyfile(out, ROOT/'public/models/cruz-del-sur-panoramic-bay.glb')
        print(json.dumps({'glb':str(out),'bytes':out.stat().st_size,'meshes':len(exports),
                          'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in exports)}))
    finally:
        for obj in exports:
            mesh=obj.data
            bpy.data.objects.remove(obj,do_unlink=True)
            bpy.data.meshes.remove(mesh)
        bpy.data.collections.remove(temp)
        for obj in previous_selected:
            if obj.name in bpy.context.scene.objects: obj.select_set(True)


if globals().get('STAGE') == 'structure': structure()
elif globals().get('STAGE') == 'glazing': glazing()
elif globals().get('STAGE') == 'save': save_export()

