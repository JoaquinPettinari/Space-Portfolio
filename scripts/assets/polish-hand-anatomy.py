"""Author continuous glove skin and sewn reinforcements, preserving the hand rigs.

Run once against the current master. For an intentional iteration, open the
named pre-pass backup. No animations, transforms or materials are replaced.
"""
from pathlib import Path
from math import sin, cos, pi, exp, radians
import shutil
import json
import sys
import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

out = Path(bpy.data.filepath).parent
assert out.name == 'astronaut-hands'
scene = bpy.context.scene
assert not scene.get('anatomy_v3'), 'Open the pre-pass backup for an intentional rework'
backup = out / 'astronaut-hands-before-anatomy.blend'
if not backup.exists():
    shutil.copy2(bpy.data.filepath, backup)

def make_mesh(name, vertices, faces, material):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    bm = bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh); bm.free(); mesh.update()
    for polygon in mesh.polygons: polygon.use_smooth = True
    return mesh

def set_weights(obj, weights, rig):
    obj.vertex_groups.clear()
    groups = {b.name: obj.vertex_groups.new(name=b.name) for b in rig.data.bones}
    for index, values in enumerate(weights):
        total = sum(values.values())
        for name, value in values.items():
            if value > 0: groups[name].add([index], value / total, 'REPLACE')
    obj.parent = rig
    obj.modifiers.clear()
    armature = obj.modifiers.new('Reusable glove articulation', 'ARMATURE')
    armature.object = rig
    armature.use_deform_preserve_volume = True

def pose_snapshot(rig):
    result = {}
    for mode in ['neutral', 'tablet_hold', 'card_pinch', 'radio_press']:
        rig.animation_data.action = bpy.data.actions[mode + '.' + rig.name[-1]]
        for frame in [1, 15, 30]:
            scene.frame_set(frame + 1); scene.frame_set(frame)
            bpy.context.view_layer.update()
            result[f'{mode}/{frame}'] = {b.name: list(b.rotation_euler) for b in rig.pose.bones}
    rig.animation_data.action = None
    return result

reports = []
for side, sign in [('Left', 1), ('Right', -1)]:
    suffix = side[0]
    collection = bpy.data.collections['HAND / ' + side]
    scene.collection.children.link(collection)
    rig = bpy.data.objects['HAND_RIG.' + suffix]
    default_pose = {b.name: b.rotation_euler.copy() for b in rig.pose.bones}
    before_poses = pose_snapshot(rig)
    for bone in rig.pose.bones: bone.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()
    original = bpy.data.objects['HAND_SURFACE.' + suffix]
    assert len(original.data.vertices) == 2242
    original_mesh = original.data
    original_groups = {g.index: g.name for g in original.vertex_groups}
    # Sleeve and cuff keep their authored folds/material assignment. The glove
    # is rebuilt separately so voxel union cannot eat the pressure-suit detail.
    sleeve_ids = list(range(168, 912))
    sleeve_map = {old: new for new, old in enumerate(sleeve_ids)}
    sleeve_vertices = [original_mesh.vertices[i].co.copy() for i in sleeve_ids]
    sleeve_polygons = [p for p in original_mesh.polygons if all(i in sleeve_map for i in p.vertices)]
    sleeve_faces = [tuple(sleeve_map[i] for i in p.vertices) for p in sleeve_polygons]
    sleeve_mesh = bpy.data.meshes.new('Pressure sleeve preserved.' + suffix)
    sleeve_mesh.from_pydata(sleeve_vertices, [], sleeve_faces)
    for material in original_mesh.materials: sleeve_mesh.materials.append(material)
    for polygon, old in zip(sleeve_mesh.polygons, sleeve_polygons):
        polygon.material_index = old.material_index; polygon.use_smooth = True
    sleeve_obj = bpy.data.objects.new('HAND_SLEEVE.' + suffix, sleeve_mesh)
    collection.objects.link(sleeve_obj)
    set_weights(sleeve_obj, [{original_groups[g.group]: g.weight for g in original_mesh.vertices[i].groups} for i in sleeve_ids], rig)
    sub = sleeve_obj.modifiers.new('Pressure fabric softness', 'SUBSURF'); sub.levels = 1; sub.render_levels = 1

    vertices, faces, weights = [], [], []
    def loft(rings, sides=24):
        start = len(vertices)
        for center, u, v, rx, ry, ws in rings:
            for j in range(sides):
                a = 2*pi*j/sides
                vertices.append(center + u*(rx*cos(a)) + v*(ry*sin(a)))
                weights.append(ws.copy())
        for i in range(len(rings)-1):
            for j in range(sides): faces.append((start+i*sides+j,start+i*sides+(j+1)%sides,start+(i+1)*sides+(j+1)%sides,start+(i+1)*sides+j))
        faces.extend([tuple(start+j for j in reversed(range(sides))),tuple(start+(len(rings)-1)*sides+j for j in range(sides))])

    palm_profile = [(-.010,.025,.016),(.003,.027,.017),(.022,.033,.021),(.045,.037,.022),(.067,.035,.021),(.082,.031,.018),(.092,.023,.013)]
    loft([(Vector((0,0,z)),Vector((1,0,0)),Vector((0,1,0)),rx,ry,{'wrist':1}) for z,rx,ry in palm_profile],32)
    paths = {}
    def finger_weights(name, distance, limits):
        if distance < .008:
            t = max(0,min(1,distance/.008))
            return {'wrist':1-t, name+'.1':t}
        for joint in [1,2]:
            if abs(distance-limits[joint]) < .008:
                t = (distance-limits[joint]+.008)/.016
                return {f'{name}.{joint}':1-t,f'{name}.{joint+1}':t}
        segment = next((i for i in range(3) if distance <= limits[i+1]),2)
        return {f'{name}.{segment+1}':1}

    # More than two millimetres separate adjacent shafts before union. Wider
    # cylinders can weld above the webbing and tear when fingers curl apart.
    for name, radius in [('index',.0078),('middle',.0080),('ring',.0075),('pinky',.0067),('thumb',.0112)]:
        bones = [rig.data.bones[f'{name}.{i+1}'] for i in range(3)]
        ps = [b.head_local.copy() for b in bones] + [bones[-1].tail_local.copy()]
        lens = [(ps[i+1]-ps[i]).length for i in range(3)]
        limits=[0,lens[0],lens[0]+lens[1],sum(lens)]
        paths[name]=(ps,lens,limits)
        rings=[]
        for i in range(35):
            t=i/34;d=limits[-1]*t
            segment=next((k for k in range(3) if d<=limits[k+1]),2)
            f=(d-limits[segment])/lens[segment]
            # Smooth the bent thumb centreline with cubic Hermite tangents.
            tangent0=(ps[segment+1]-ps[max(0,segment-1)]).normalized()
            tangent1=(ps[min(3,segment+2)]-ps[segment]).normalized()
            a,b=ps[segment],ps[segment+1]
            center=(2*f**3-3*f**2+1)*a+(f**3-2*f*f+f)*lens[segment]*tangent0+(-2*f**3+3*f*f)*b+(f**3-f*f)*lens[segment]*tangent1
            tangent=tangent0.lerp(tangent1,f).normalized()
            u=Vector((1,0,0))
            if name=='thumb':u=Vector((0,1,0)).cross(tangent).normalized()
            v=tangent.cross(u).normalized()
            taper=1-.19*t
            bulge=.07*exp(-((d-limits[1])/.006)**2)+.06*exp(-((d-limits[2])/.005)**2)
            tip=1 if t<.9 else max(.12, (1-((t-.90)/.105)**2)**.5)
            rings.append((center,u,v,radius*(taper+bulge)*tip,radius*.94*(taper+bulge)*tip,finger_weights(name,d,limits)))
        loft(rings,24)

    def ellipsoid(center, radii, ws):
        rings=[]
        for i in range(17):
            a=pi*(.008+.984*i/16)
            rings.append((Vector(center)+Vector((0,0,radii[2]*cos(a))),Vector((1,0,0)),Vector((0,1,0)),radii[0]*sin(a),radii[1]*sin(a),ws))
        loft(rings,24)
    # Thenar mound connects the thumb's proximal phalanx into the palm. A small
    # web gives the index/thumb cleft a sewn glove transition without closing it.
    ellipsoid((sign*.029,-.005,.038),(.020,.018,.028),{'wrist':.72,'thumb.1':.28})
    ellipsoid((sign*.034,-.006,.065),(.013,.013,.019),{'wrist':.45,'thumb.1':.35,'index.1':.20})
    for x,z,name in [(.027,.086,'index'),(.009,.089,'middle'),(-.010,.086,'ring'),(-.028,.079,'pinky')]:
        ellipsoid((sign*x,0,z),(.011,.012,.014),{'wrist':.7,name+'.1':.3})

    glove_mesh=make_mesh('Continuous pressure glove.'+suffix,vertices,faces,bpy.data.materials['HAND / Graphite woven glove'])
    original.data=glove_mesh;original.modifiers.clear();original.vertex_groups.clear()
    bpy.ops.object.select_all(action='DESELECT');original.select_set(True);bpy.context.view_layer.objects.active=original
    remesh=original.modifiers.new('Continuous sewn glove volume','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.0013;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=original.modifiers.new('Soft glove transitions','SMOOTH');smooth.factor=.55;smooth.iterations=3
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    decimate=original.modifiers.new('Authoring topology budget','DECIMATE');decimate.ratio=.62
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    high={v.index for v in original.data.vertices if v.co.z>.110}
    adjacency={i:[] for i in high}
    for edge in original.data.edges:
        a,b=edge.vertices
        if a in high and b in high:adjacency[a].append(b);adjacency[b].append(a)
    unseen=set(high);high_components=0
    while unseen:
        high_components+=1;pending=[unseen.pop()]
        while pending:
            for i in adjacency[pending.pop()]:
                if i in unseen:unseen.remove(i);pending.append(i)
    assert high_components==4, f'Finger shafts must stay separate above the webbing: {high_components}'
    def anatomical_weights(p):
        candidates=[]
        for name,(ps,lens,limits) in paths.items():
            if name=='thumb':
                if p.x*sign<.021 or p.z<.021:continue
            elif p.z<ps[0].z-.008:continue
            nearest=None
            for i in range(3):
                axis=ps[i+1]-ps[i]
                t=max(0,min(1,(p-ps[i]).dot(axis)/axis.length_squared))
                point=ps[i]+axis*t
                distance=(p-point).length
                if nearest is None or distance<nearest[0]:nearest=(distance,limits[i]+lens[i]*t)
            candidates.append((nearest[0],name,nearest[1],limits))
        if not candidates:return {'wrist':1}
        distance,name,d,limits=min(candidates,key=lambda c:c[0])
        if distance>.020:return {'wrist':1}
        # A coherent centreline field prevents one finger's inside surface
        # acquiring weights from its neighbour after a voxel union.
        if d<.014:
            t=max(0,min(1,d/.014));t=t*t*(3-2*t)
            return {'wrist':1-t,name+'.1':t}
        for joint in [1,2]:
            halfwidth=min(.011,(limits[joint+1]-limits[joint])*.45)
            if abs(d-limits[joint])<halfwidth:
                t=(d-limits[joint]+halfwidth)/(2*halfwidth);t=t*t*(3-2*t)
                return {f'{name}.{joint}':1-t,f'{name}.{joint+1}':t}
        part=next((i for i in range(3) if d<=limits[i+1]),2)
        return {f'{name}.{part+1}':1}
    transferred=[]
    for vertex in original.data.vertices:
        transferred.append(anatomical_weights(vertex.co))
    # The joined webbing must have a continuous weight field. Centreline
    # selection alone has a hard boundary between adjacent finger labels.
    neighbours=[[] for _ in original.data.vertices]
    for edge in original.data.edges:
        a,b=edge.vertices
        distance=max((original.data.vertices[a].co-original.data.vertices[b].co).length,.0001)
        neighbours[a].append((b,1/distance));neighbours[b].append((a,1/distance))
    blend_ids=[v.index for v in original.data.vertices if v.co.z<.108 and not any(name.endswith(('.2','.3')) and value>.1 for name,value in transferred[v.index].items())]
    for _ in range(24):
        updated=list(transferred)
        for index in blend_ids:
            nearby=neighbours[index]
            if not nearby:continue
            total=sum(weight for _,weight in nearby)
            average={}
            for neighbour,weight in nearby:
                for name,value in transferred[neighbour].items():average[name]=average.get(name,0)+value*weight/total
            alpha=.42*max(0,min(1,(.108-original.data.vertices[index].co.z)/.008))
            names=transferred[index].keys()|average.keys()
            updated[index]={name:transferred[index].get(name,0)*(1-alpha)+average.get(name,0)*alpha for name in names}
        transferred=updated
    transferred=[dict(sorted(values.items(),key=lambda item:item[1],reverse=True)[:4]) for values in transferred]
    set_weights(original,transferred,rig)
    for polygon in original.data.polygons:polygon.use_smooth=True
    # Read-only rest surface used to adhere padded panels and thread to fabric.
    rest_bvh=BVHTree.FromPolygons([v.co.copy() for v in original.data.vertices],[list(p.vertices) for p in original.data.polygons],all_triangles=False)
    original.data.calc_loop_triangles()
    triangles=[tuple(t.vertices) for t in original.data.loop_triangles]
    attachment_bvh=BVHTree.FromPolygons([v.co.copy() for v in original.data.vertices],triangles,all_triangles=True)
    final_weights=[{original.vertex_groups[g.group].name:g.weight for g in v.groups} for v in original.data.vertices]
    def surface_attachment(point,offset=.00035):
        position,normal,face,_=attachment_bvh.find_nearest(point)
        ids=triangles[face]
        a,b,c=(original.data.vertices[i].co for i in ids)
        v0=b-a;v1=c-a;v2=position-a
        d00=v0.dot(v0);d01=v0.dot(v1);d11=v1.dot(v1);d20=v2.dot(v0);d21=v2.dot(v1)
        denominator=d00*d11-d01*d01
        if abs(denominator)<1e-20:bary=[1,0,0]
        else:
            y=(d11*d20-d01*d21)/denominator;z=(d00*d21-d01*d20)/denominator
            bary=[max(0,1-y-z),max(0,y),max(0,z)]
        values={}
        for index,factor in zip(ids,bary):
            for name,value in final_weights[index].items():values[name]=values.get(name,0)+value*factor
        values=dict(sorted(values.items(),key=lambda item:item[1],reverse=True)[:4])
        return position+normal*offset,values
    def dorsal_y(x,z):
        hit=rest_bvh.ray_cast(Vector((x,-.2,z)),Vector((0,1,0)),.4)[0]
        return hit.y if hit else -.019

    # Tailored dorsal patch: lower profile, fitted to the actual back of hand.
    patch=bpy.data.objects['Dorsal metacarpal pad.'+suffix]
    border=[(-.021,.023),(.017,.023),(.027,.039),(.025,.061),(.015,.076),(-.017,.076),(-.027,.059),(-.027,.039)]
    border=[Vector((x*sign,0,z)) for x,z in border]
    center=Vector((0,0,.048));pv=[];pf=[]
    for scale,offset in [(0.01,.0018),(.40,.0018),(.80,.0014),(1,.00045),(.99,-.0004)]:
        for point in border:
            p=center.lerp(point,scale);p.y=dorsal_y(p.x,p.z)-offset;pv.append(p)
    for r in range(4):
        for j in range(8):pf.append((r*8+j,r*8+(j+1)%8,(r+1)*8+(j+1)%8,(r+1)*8+j))
    pf.extend([tuple(reversed(range(8))),tuple(range(32,40))])
    patch.data=make_mesh('Tailored dorsal reinforcement.'+suffix,pv,pf,bpy.data.materials['HAND / Reinforced finger pads'])
    set_weights(patch,[surface_attachment(p)[1] for p in pv],rig)
    sub=patch.modifiers.new('Tailored panel rounding','SUBSURF');sub.levels=2;sub.render_levels=2

    # Replace rigid oval fingertip islands with shallow longitudinal cloth pads.
    pad_seam_paths=[]
    for name in ['index','middle','ring','pinky','thumb']:
        for segment in range(3):
            obj=bpy.data.objects[f'Grip pad {name}{segment}.{suffix}']
            bone=rig.data.bones[f'{name}.{segment+1}'];axis=(bone.tail_local-bone.head_local).normalized()
            normal=Vector((0,-1,0));normal=(normal-axis*normal.dot(axis)).normalized()
            cross=axis.cross(normal).normalized()
            midpoint=bone.head_local.lerp(bone.tail_local,.53)
            # Ray along the dorsal normal gives an embedded surface on tilted thumb.
            hit=rest_bvh.ray_cast(midpoint+normal*.05,-normal,.10)[0]
            midpoint=(hit if hit else midpoint+normal*.007)+normal*.00035
            padv=[];padf=[];padw=[]
            length=bone.length*(.79 if name=='thumb' else .70)
            width=.014 if name=='thumb' else .010 if name=='pinky' else .012
            for i in range(13):
                theta=pi*(.01+.98*i/12);profile=sin(theta)**.6
                for j in range(20):
                    a=2*pi*j/20
                    p=midpoint+axis*cos(theta)*length*.5+cross*cos(a)*width*.5*profile
                    point,ws=surface_attachment(p,.00015+.00065*(sin(a)+1)*.5)
                    padv.append(point);padw.append(ws)
            for i in range(12):
                for j in range(20):padf.append((i*20+j,i*20+(j+1)%20,(i+1)*20+(j+1)%20,(i+1)*20+j))
            padf.extend([tuple(reversed(range(20))),tuple(range(240,260))])
            obj.data=make_mesh(obj.name+' sewn reinforcement',padv,padf,bpy.data.materials['HAND / Reinforced finger pads'])
            set_weights(obj,padw,rig)
            sub=obj.modifiers.new('Soft cloth pad','SUBSURF');sub.levels=1;sub.render_levels=1
            # Border thread follows the soft panel rather than sitting as a
            # separate ring above it. All pads share the batched seam mesh.
            perimeter=[]
            for j in range(96):
                a=2*pi*j/96
                p=midpoint+axis*cos(a)*length*.43+cross*sin(a)*width*.40+normal*.00072
                p=surface_attachment(p,.00082)[0]
                perimeter.append(p)
            pad_seam_paths.append((perimeter,None))

    # Remove only the superseded authoring seam objects, never duplicate them.
    for obj in list(collection.objects):
        if obj.name.startswith(('Backhand seam','Dorsal double stitching','Sleeve stitched seam')):
            bpy.data.objects.remove(obj,do_unlink=True)
    sv=[];sf=[];sw=[]
    def segment(a,b,radius,ws):
        axis=(b-a).normalized();u=axis.cross(Vector((0,1,0))).normalized();v=axis.cross(u).normalized();start=len(sv)
        for p in [a,b]:
            point_weights=surface_attachment(p)[1] if ws is None else ws
            for j in range(6):sv.append(p+radius*(u*cos(2*pi*j/6)+v*sin(2*pi*j/6)));sw.append(point_weights.copy())
        for j in range(6):sf.append((start+j,start+(j+1)%6,start+6+(j+1)%6,start+6+j))
        sf.extend([tuple(start+j for j in reversed(range(6))),tuple(start+6+j for j in range(6))])
    for points,ws in pad_seam_paths:
        # Two sampled edges of every four make fine, regular stitch dashes.
        for i in range(0,len(points),4):
            segment(points[i],points[(i+2)%len(points)],.00011,ws)
    # Fine lockstitches around the inset panel, following the actual surface.
    contour=[center.lerp(p,.91) for p in border]
    for a,b in zip(contour,contour[1:]+contour[:1]):
        count=max(1,int((b-a).length/.0021))
        for i in range(count):
            p=a.lerp(b,(i+.12)/count);q=a.lerp(b,(i+.67)/count)
            p.y=dorsal_y(p.x,p.z)-.0019;q.y=dorsal_y(q.x,q.z)-.0019
            segment(p,q,.00016,None)
    # Paired sleeve seams are individual thread dashes sitting on its fold profile.
    for x in [-.025,.025]:
        for i in range(58):
            points=[]
            for z in [-.194+i*.0027,-.194+i*.0027+.0013]:
                t=max(0,min(1,(z+.225)/.196));r=.048-t*.014+.0025*sin(t*pi*12)**2
                cx=sign*.004*sin(t*pi);cy=.005*sin(t*pi)
                xx=x*sign;yy=cy-r*.82*max(0,1-((xx-cx)/r)**2)**.5-.00025
                points.append(Vector((xx,yy,z)))
            segment(*points,.00016,{'forearm':1})
    seam_mesh=make_mesh('Sewn glove and suit seams.'+suffix,sv,sf,bpy.data.materials['HAND / Seam thread'])
    seams=bpy.data.objects.new('HAND_STITCHING.'+suffix,seam_mesh);collection.objects.link(seams);set_weights(seams,sw,rig)

    # Solve the tablet curl in its natural flexion direction. The old pose
    # constrained only fingertip depth, leaving fingers visibly straight.
    # PIP/DIP flexion brings the pads back toward the rear panel without
    # bending the proximal phalanx through the front face of the tablet.
    rig.animation_data.action=bpy.data.actions['tablet_hold.'+suffix]
    scene.frame_set(16);scene.frame_set(15)
    grasp={}
    for name in ['index','middle','ring','pinky']:
        lengths=paths[name][1]
        best=None
        for mcp in range(0,9,2):
            for pip in range(108,119,2):
                for dip in range(76,91,2):
                    angles=[radians(mcp),radians(mcp+pip),radians(mcp+pip+dip)]
                    y=sum(length*sin(angle) for length,angle in zip(lengths,angles))
                    z=sum(length*cos(angle) for length,angle in zip(lengths,angles))
                    cost=((y-.0155)/.008)**2+((z-.006)/.015)**2+.04*((pip-112)/10)**2+.02*((dip-82)/10)**2
                    if best is None or cost<best[0]:best=(cost,[mcp,pip,dip],y,z)
        for i,angle in enumerate(best[1]):rig.pose.bones[f'{name}.{i+1}'].rotation_euler.x=-radians(angle)
        grasp[name]={'anglesDegrees':best[1],'tipDepthLocal':best[2],'tipHeightAboveRoot':best[3]}
    for bone in rig.pose.bones:
        for frame in [1,15,30]:bone.keyframe_insert(data_path='rotation_euler',frame=frame,group=bone.name)
    scene.frame_set(16);scene.frame_set(15);bpy.context.view_layer.update()
    default_pose={bone.name:bone.rotation_euler.copy() for bone in rig.pose.bones}
    rig.animation_data.action=None
    assert len(rig.data.bones)==17
    after_poses=pose_snapshot(rig)
    assert {k:v for k,v in after_poses.items() if not k.startswith('tablet_hold/')}=={k:v for k,v in before_poses.items() if not k.startswith('tablet_hold/')},'A non-tablet pose changed'
    for bone_name,rotation in default_pose.items():rig.pose.bones[bone_name].rotation_euler=rotation
    bpy.context.view_layer.update()
    mesh_count=0;vertex_count=0
    for obj in collection.objects:
        if obj.type=='MESH':
            mesh_count+=1;vertex_count+=len(obj.data.vertices)
            assert all(abs(sum(g.weight for g in v.groups)-1)<1e-5 for v in obj.data.vertices),obj.name
    bm=bmesh.new();bm.from_mesh(original.data)
    boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.free()
    assert boundary==0 and nonmanifold==0
    reports.append({'hand':side,'bones':17,'skinVertices':len(original.data.vertices),'totalBaseVertices':vertex_count,'meshObjects':mesh_count,'allMeshWeightsNormalized':True,'closedGloveSurface':True,'separateFingerShaftsAboveWebbing':high_components,'neutralCardRadioPosesUnchanged':True,'tabletGrasp':grasp})
    scene.collection.children.unlink(collection)

scene['anatomy_v3']=True
scene.camera.location=(.04,-.8,.12)
scene.camera.rotation_euler=(Vector((0,0,-.025))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(out/'astronaut-hands.blend'))
(out/'anatomy-validation.json').write_text(json.dumps(reports,indent=2)+'\n')
if '--no-render' not in sys.argv:
    scene.cycles.samples=32
    scene.render.filepath=str(out/'hands-anatomy-front.png');bpy.ops.render.render(write_still=True)
    scene.camera.location=(.42,-.60,.18)
    scene.camera.rotation_euler=(Vector((0,0,-.025))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/'hands-anatomy-side.png');bpy.ops.render.render(write_still=True)
print('ANATOMY_SOURCE_READY',reports,flush=True)
