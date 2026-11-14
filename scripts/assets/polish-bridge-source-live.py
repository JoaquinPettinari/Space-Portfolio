"""Final material, silhouette and editable-scene organization pass. No export."""
from pathlib import Path
import bpy, numpy as np
ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'docs/assets/bridge';scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.materials.get('BRIDGE Deck finish')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
original={o:(o.matrix_world.copy(),dict(o.items()),len(o.data.vertices) if o.type=='MESH' else None) for o in scene.objects}
texture_folder=folder/'textures-final';texture_folder.mkdir(exist_ok=True)

def surface(name,source,roughness,metallic):
    mat=bpy.data.materials[source].copy();mat.name=name
    node=next(n for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and '-orm' in n.image.name)
    w,h=node.image.size
    assert (w,h)==(512,512)
    yy,xx=np.mgrid[0:h,0:w]/512
    # Broad, low-contrast wiping marks affect reflections, never painted scratches.
    variation=.018*np.sin(xx*2*np.pi*3)*np.sin(yy*2*np.pi*2)+.009*np.cos(yy*2*np.pi*13)
    rgba=np.ones((h,w,4),dtype=np.float32)
    rgba[:,:,1]=np.clip(roughness+variation,0,1);rgba[:,:,2]=metallic
    image=bpy.data.images.new(name+' ORM',width=w,height=h,alpha=True)
    image.colorspace_settings.name='Non-Color';image.pixels.foreach_set(rgba.ravel());image.update()
    image.filepath_raw=str(texture_folder/(name.replace('BRIDGE ','').replace(' ','-').lower()+'-orm.png'))
    image.file_format='PNG';image.save();image.pack();node.image=image
    return mat

deck=surface('BRIDGE Deck finish','BRIDGE V15 Graphite',.40,.52)
counter=surface('BRIDGE Counter finish','BRIDGE V15 Ivory',.47,.18)
counts={'deck':0,'counter':0,'silhouette':0}
for o in scene.objects:
    if o.type!='MESH':continue
    if o.name.startswith('Removable deck'):
        for slot in o.material_slots:
            if slot.material.name=='BRIDGE V15 Graphite':slot.material=deck;counts['deck']+=1
    if o.name.startswith('Perimeter countertop'):
        for slot in o.material_slots:
            if slot.material.name=='BRIDGE V15 Ivory':slot.material=counter;counts['counter']+=1
    # More rounded upholstery/counter edges; no added subdivision on flat panels.
    cushion=o.name.startswith('Command seat ') and any(k in o.name for k in ('cushion','arm pad'))
    prominent=o.name.startswith(('Perimeter countertop','Tactical upper bezel','Niche equipment case'))
    if cushion or prominent:
        for mod in o.modifiers:
            if mod.type=='BEVEL':mod.segments=4 if cushion else 3;counts['silhouette']+=1
assert counts['counter']==7 and counts['deck']==78

# Organize existing objects without parenting, moving or joining them. This leaves
# the original hit-target metadata available for eventual interaction batching.
root=bpy.data.collections.new('BRIDGE / EDITABLE');scene.collection.children.link(root)
names=['01 Hull and entry','02 Deck and grilles','03 Ceiling and frames','04 Consoles',
       '05 Computers','06 Tactical table','07 Seats','08 Niche dressing','09 Preview lights - DO NOT EXPORT']
groups={name:bpy.data.collections.new(name) for name in names}
for group in groups.values():root.children.link(group)
old_collections=list(scene.collection.children)
for obj in list(scene.objects):
    name=obj.name
    if obj.type=='LIGHT':key=names[8]
    elif name.startswith('Command seat '):key=names[6]
    elif obj.get('interaction')=='tactical' or name.startswith('Tactical '):key=names[5]
    elif name.startswith('Monitor '):key=names[4]
    elif name.startswith(('Niche equipment','Case ','Niche planter','Planter ')):key=names[7]
    elif name.startswith(('Perimeter ','Console ','Counter ','Cabinet ','Instrument ')) or obj.get('interaction') in ('computer','communications','personal','arcade'):key=names[3]
    elif name.startswith(('Removable deck','Recessed grille','Inset amber','Deck ')):key=names[1]
    elif name.startswith(('Ceiling ','Practical ','Canopy ','Window ','Panoramic ','Roof ')):key=names[2]
    else:key=names[0]
    groups[key].objects.link(obj)
    for collection in list(obj.users_collection):
        if collection!=groups[key]:collection.objects.unlink(obj)
for collection in old_collections:
    if collection!=root and not collection.objects and not collection.children:
        bpy.data.collections.remove(collection)
bpy.context.view_layer.update()
for obj,(transform,metadata,vertex_count) in original.items():
    assert obj.matrix_world==transform and dict(obj.items())==metadata
    if obj.type=='MESH':assert len(obj.data.vertices)==vertex_count
assert sum(o.type=='LIGHT' for o in scene.objects)==4
assert len(bpy.data.scenes)==1
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Polish complete',counts,'Two packed 512px roughness/metallic maps; nine editable categories; all anchors and hit metadata preserved.')
