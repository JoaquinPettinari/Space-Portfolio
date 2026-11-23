"""Read-only pose deformation review; never save alternate poses to the master."""
from pathlib import Path
import bpy
import json
import sys
from mathutils import Vector
from mathutils.bvhtree import BVHTree

scene=bpy.context.scene
out=Path(bpy.data.filepath).parent
scene.cycles.samples=24
scene.render.resolution_x=1000
scene.render.resolution_y=950
scene.camera.location=(.40,-.65,.18)
scene.camera.rotation_euler=(Vector((0,0,-.025))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
close='--close' in sys.argv
if close:
    bpy.data.objects['PREVIEW / Left'].hide_render=True
    scene.camera.location=(.21,-.37,.18)
    scene.camera.rotation_euler=(Vector((.10,0,.065))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.camera.data.lens=65
reports=[]
for mode in ['neutral','tablet_hold','card_pinch','radio_press']:
    if '--' in sys.argv and mode not in sys.argv[sys.argv.index('--')+1:]:continue
    row={'pose':mode,'hands':[]}
    for side in ['Left','Right']:
        collection=bpy.data.collections['HAND / '+side]
        scene.collection.children.link(collection)
        rig=bpy.data.objects['HAND_RIG.'+side[0]]
        rig.animation_data.action=bpy.data.actions[mode+'.'+side[0]]
    scene.frame_set(16);scene.frame_set(15);bpy.context.view_layer.update()
    for side in ['Left','Right']:
        rig=bpy.data.objects['HAND_RIG.'+side[0]]
        index=rig.pose.bones['index.3'].tail
        thumb=rig.pose.bones['thumb.3'].tail
        skin=bpy.data.objects['HAND_SURFACE.'+side[0]]
        evaluated=skin.evaluated_get(bpy.context.evaluated_depsgraph_get())
        deformed=evaluated.to_mesh()
        stretches=[]
        for edge in skin.data.edges:
            a,b=edge.vertices
            rest=(skin.data.vertices[a].co-skin.data.vertices[b].co).length
            if rest>.00001:stretches.append((deformed.vertices[a].co-deformed.vertices[b].co).length/rest)
        stretches.sort()
        tip_sets={}
        tip_errors={}
        for name in ['index','thumb']:
            rest_tip=rig.data.bones[name+'.3'].tail_local
            ids=[v.index for v in skin.data.vertices if (v.co-rest_tip).length<.006]
            points=[deformed.vertices[i].co.copy() for i in ids]
            assert points, name+' tip has no surface samples'
            center=sum(points,Vector())/len(points)
            tip_sets[name]=points
            tip_errors[name]={'samples':len(points),'evaluatedCenter':list(center),'centerToBoneTail':(center-rig.pose.bones[name+'.3'].tail).length}
        gap=min((a-b).length for a in tip_sets['index'] for b in tip_sets['thumb'])
        skin_bvh=BVHTree.FromPolygons([v.co.copy() for v in deformed.vertices],[list(p.vertices) for p in deformed.polygons],all_triangles=False)
        pad_distances=[]
        for obj in bpy.data.collections['HAND / '+side].objects:
            if not obj.name.startswith('Grip pad '):continue
            pad=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
            mesh=pad.to_mesh()
            pad_distances.extend(skin_bvh.find_nearest(v.co)[3] for v in mesh.vertices)
            pad.to_mesh_clear()
        pad_distances.sort()
        max_influences=max(len([g for g in v.groups if g.weight>0]) for obj in bpy.data.collections['HAND / '+side].objects if obj.type=='MESH' for v in obj.data.vertices)
        assert max_influences<=4
        row['hands'].append({'side':side,'indexTip':list(index),'thumbTip':list(thumb),'tipDistance':(index-thumb).length,'skinTipSamples':tip_errors,'nearestTipSurfaceVertices':gap,'skinEdgeStretchMax':stretches[-1],'skinEdgeStretchP99':stretches[int(len(stretches)*.99)],'padToSkinDistanceMax':pad_distances[-1],'padToSkinDistanceP99':pad_distances[int(len(pad_distances)*.99)],'maximumVertexInfluencesAllMeshes':max_influences})
        evaluated.to_mesh_clear()
        rotations={b.name:b.rotation_euler.copy() for b in rig.pose.bones}
        rig.animation_data.action=None
        for name,rotation in rotations.items():rig.pose.bones[name].rotation_euler=rotation
        scene.collection.children.unlink(bpy.data.collections['HAND / '+side])
    bpy.context.view_layer.update()
    # Collection-instance evaluation is checked separately: the source rig is
    # deliberately not directly linked into the authoring scene.
    instance_reports=[]
    deps=bpy.context.evaluated_depsgraph_get()
    for inst in deps.object_instances:
        if not inst.is_instance or not inst.object.name.startswith('HAND_SURFACE.'):continue
        suffix=inst.object.name[-1]
        skin=bpy.data.objects['HAND_SURFACE.'+suffix]
        rig=bpy.data.objects['HAND_RIG.'+suffix]
        mesh=inst.object.to_mesh()
        result={'side':suffix}
        for name in ['index','thumb']:
            tail=rig.data.bones[name+'.3'].tail_local
            ids=[v.index for v in skin.data.vertices if (v.co-tail).length<.006]
            center=sum((mesh.vertices[i].co for i in ids),Vector())/len(ids)
            result[name]=list(center)
        inst.object.to_mesh_clear();instance_reports.append(result)
    row['instancedSkinTips']=instance_reports
    scene.render.filepath=str(out/('anatomy-pose-'+mode+('-close' if close else '')+'.png'))
    if '--no-render' not in sys.argv:bpy.ops.render.render(write_still=True)
    reports.append(row)
suffix='-close' if close else '-partial' if len(reports)<4 else ''
(out/('anatomy-pose-review'+suffix+'.json')).write_text(json.dumps(reports,indent=2)+'\n')
print('ANATOMY_POSES_RENDERED')
