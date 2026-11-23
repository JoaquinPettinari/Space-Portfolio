"""Structural fairing around the docking tunnel; reusable by the intro builder."""
import bpy
import bmesh
from mathutils import Vector


def integrate_docking_mount(scene):
    name = '03B / Integrated docking foundation'
    if any(c.name == name for c in scene.collection.children):
        raise RuntimeError('Foundation already exists; preserve manual edits.')
    collection = bpy.data.collections.new(name)
    scene.collection.children.link(collection)
    dock = next(c for c in scene.collection.children if c.name.startswith('03 /'))
    steel = next(o.data.materials[0] for o in dock.objects
                 if o.name.startswith('Pressure tunnel / side'))
    dark = next(o.data.materials[0] for o in dock.objects
                if o.name.startswith('Contact gasket'))

    def profile(width, bottom, top, bevel):
        return [(-width+bevel,bottom),(width-bevel,bottom),
                (width,bottom+bevel),(width,top-bevel),
                (width-bevel,top),(-width+bevel,top),
                (-width,top-bevel),(-width,bottom+bevel)]

    def loft(label, stations, inner, bevel=.035):
        vertices, faces = [], []
        for y, width, bottom, top, chamfer in stations:
            vertices.extend((x,y,z) for x,z in profile(width,bottom,top,chamfer))
            vertices.extend((x,y,z) for x,z in inner)
        for j in range(len(stations)-1):
            for ring in (0,8):
                for i in range(8):
                    a=j*16+ring+i; b=j*16+ring+(i+1)%8
                    faces.append((a,b,b+16,a+16))
        for j in (0,len(stations)-1):
            for i in range(8):
                a=j*16+i; b=j*16+(i+1)%8
                faces.append((a,b,b+8,a+8))
        mesh=bpy.data.meshes.new(label)
        mesh.from_pydata(vertices,[],faces)
        mesh.update()
        bm=bmesh.new();bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        bm.to_mesh(mesh);bm.free()
        o=bpy.data.objects.new(label,mesh)
        collection.objects.link(o)
        mesh.materials.append(steel)
        mod=o.modifiers.new('Machined panel edges','BEVEL')
        mod.width,mod.segments=bevel,3
        o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
        return o

    # Broad root overlaps the existing aft armor, while the open bore preserves
    # the vestibule route. It tapers toward the original animated contact ring.
    stations=[(-18.7,2.5,-1.2,3.05,.42),(-20,2.35,-1.35,3.1,.42),
              (-22,1.7,-.65,2.98,.35),(-24,1.35,.08,2.88,.28),
              (-25.5,1.3,.12,2.8,.25)]
    bore=profile(1.02,.35,2.55,.16)
    shell=loft('Dock foundation / tapered pressure housing',stations,bore)
    shell['purpose']='Anchored aft armor around existing vestibule; open central bore'
    for y,width,bottom,top,chamfer in (stations[1],stations[-2],stations[-1]):
        loft('Dock foundation / structural band',
             [(y+.09,width+.075,bottom-.065,top+.065,chamfer),
              (y-.09,width+.075,bottom-.065,top+.065,chamfer)],
             profile(width-.025,bottom+.025,top-.025,chamfer),.018)

    def beam(label,a,b,width,depth,mat):
        a,b=Vector(a),Vector(b)
        bpy.ops.mesh.primitive_cube_add(size=1,location=(a+b)/2)
        o=bpy.context.object;o.name=label
        o.dimensions=(width,depth,(b-a).length)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
        for c in list(o.users_collection):c.objects.unlink(o)
        collection.objects.link(o)
        o.data.materials.append(mat)
        bevel=o.modifiers.new('Rounded structural edge','BEVEL')
        bevel.width,bevel.segments=.035,3
        o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
        return o

    for side in (-1,1):
        beam('Dock foundation / lower load-bearing spine',
             (side*1.75,-19.65,-1.05),(side*1.05,-25.65,.22),.25,.32,steel)
        beam('Dock foundation / collar diagonal support',
             (side*1.25,-24.4,.38),(side*1.35,-26.85,1.45),.16,.18,steel)
        # Recess-like seam strips follow the shoulder rather than floating above it.
        for a,b in zip(stations[:-1],stations[1:]):
            beam('Dock foundation / shoulder seam',
                 (side*(a[1]-.18),a[0],a[3]-.16),
                 (side*(b[1]-.18),b[0],b[3]-.16),.028,.028,dark)
    return collection


if __name__ == '__main__':
    integrate_docking_mount(bpy.context.scene)
