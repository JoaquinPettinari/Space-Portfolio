"""Read-only review of card/radio contact from current authoring derivative."""
from pathlib import Path
import bpy,json,sys
from mathutils import Vector

folder=Path(__file__).resolve().parent
candidate='--candidate' in sys.argv
bpy.ops.wm.open_mainfile(filepath=str(folder/('hand-gestures-contact-candidate.blend' if candidate else 'hand-gestures.blend')))
out=folder/'card-radio-review'
if candidate:out=out/'candidate'
out.mkdir(exist_ok=True,parents=True)
report={}
for scene_name,kind in [('02 Credential present','card'),('03 Radio press','radio')]:
    scene=bpy.data.scenes[scene_name];bpy.context.window.scene=scene
    scene.render.engine='BLENDER_WORKBENCH'
    scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL'
    scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True
    scene.render.resolution_x=900;scene.render.resolution_y=650;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.frame_set(59);bpy.context.view_layer.update()
    rig=next(o for o in scene.objects if o.type=='ARMATURE')
    report[kind]={'bones':{b.name:list(b.rotation_euler) for b in rig.pose.bones}}
    if kind=='card':
        card=scene.objects['FIXTURE / Crew credential'];center=card.matrix_world.translation.copy()
        normal=card.matrix_world.to_3x3()@Vector((0,1,0));axis=card.matrix_world.to_3x3()@Vector((1,0,0))
        target=center+Vector((0,0,-.045))
        views=[('front',target-normal*.40+axis*.10+Vector((0,0,.02)),target),('profile',target+axis*.40-normal*.10,target)]
    else:
        views=[('front',Vector((.22,-.40,.23)),Vector((0,-.10,-.035))),('profile',Vector((.40,-.12,.055)),Vector((0,-.10,-.035)))]
    for label,position,target in views:
        scene.camera.location=position;scene.camera.rotation_euler=(target-position).to_track_quat('-Z','Y').to_euler();scene.camera.data.lens=45
        scene.render.filepath=str(out/(kind+'-'+label+'-contact.png'));bpy.ops.render.render(write_still=True)
    scene.frame_set(31);scene.render.filepath=str(out/(kind+'-profile-approach.png'));bpy.ops.render.render(write_still=True)
(out/'pose-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('CARD_RADIO_REVIEW_READY_NO_SOURCE_WRITES')
