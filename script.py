# paste this into Blender's Scripting editor and press Run Script (Blender GUI, not headless)
import bpy, os, traceback

# ====== EDIT PATHS ======
INPUT_PATH = r"C:\Users\asamy\Desktop\Projects\Personal\Frontend\VR\showcase\public\models\character.glb"
OUTPUT_PATH = r"C:\Users\asamy\Desktop\Projects\Personal\Frontend\VR\showcase\public\models\character_mixamo_fixed.fbx"
# ========================

def find_view3d_area_region():
    candidate_windows = []
    if bpy.context.window is not None:
        candidate_windows.append(bpy.context.window)
    try:
        for w in bpy.context.window_manager.windows:
            if w not in candidate_windows:
                candidate_windows.append(w)
    except Exception:
        pass

    for window in candidate_windows:
        try:
            screen = window.screen
        except Exception:
            continue
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                for region in area.regions:
                    if region.type == 'WINDOW':
                        return window, screen, area, region
    return None, None, None, None

def print_scene_info():
    print("\n--- Collections / Objects ---")
    for coll in bpy.data.collections:
        members = ", ".join(o.name for o in coll.objects)
        print(f"COLL: {coll.name} -> [{members}]")
    for o in bpy.data.objects:
        verts = len(o.data.vertices) if getattr(o, 'data', None) and getattr(o.data, 'vertices', None) is not None else '-'
        print(f"OBJ: {o.name:40} type={o.type:6} users={len(o.users_collection)} verts={verts}")
    print("------------------------------\n")

def main():
    try:
        print("Input path:", INPUT_PATH)
        if not os.path.exists(INPUT_PATH):
            raise FileNotFoundError("Input GLB not found: " + INPUT_PATH)

        bpy.ops.wm.read_factory_settings(use_empty=True)
        print("Reset to factory settings (empty scene).")

        window, screen, area, region = find_view3d_area_region()
        if not (window and screen and area and region):
            print("Could not find a VIEW_3D area/region. Make sure you run this in Blender GUI (Scripting workspace) where a 3D View is open.")
            try:
                print("Available windows/screens:")
                for w in bpy.context.window_manager.windows:
                    print(" - window:", w, "screen:", getattr(w, 'screen', None))
            except Exception:
                pass
            return
        print(f"Using window={window}, screen={screen}, area={area}, region={region}")

        print("Importing GLB with temp_override context (Blender 4.x)...")
        # Use temp_override to provide full context for GLTF importer
        # Don't set active_object - let the importer handle it
        with bpy.context.temp_override(
            window=window,
            screen=screen,
            area=area,
            region=region,
            scene=bpy.context.scene,
            view_layer=bpy.context.view_layer
        ):
            bpy.ops.import_scene.gltf(filepath=INPUT_PATH, loglevel=20)
        print("Import attempt finished.")

        print_scene_info()

        # Get all objects including armature for export
        all_objs = [o for o in bpy.data.objects if o.type in ('MESH', 'ARMATURE')]
        mesh_objs = [o for o in all_objs if o.type == 'MESH' and len(o.data.vertices) > 0]
        print(f"Found {len(mesh_objs)} non-empty mesh object(s) and {len([o for o in all_objs if o.type == 'ARMATURE'])} armature(s).")
        if not mesh_objs:
            print("❌ No meshes imported. Try File → Import → glTF 2.0 from the menu to check the GLB.")
            return

        # Deselect all first
        bpy.ops.object.select_all(action='DESELECT')

        # Apply transforms to meshes
        for o in mesh_objs:
            bpy.context.view_layer.objects.active = o
            o.select_set(True)
            try:
                bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
                o.select_set(False)
            except Exception as e:
                print("Warning applying transforms for", o.name, e)

        # Rotate and bake rotation for meshes with proper context
        print("Rotating meshes 90° around X axis...")
        for o in mesh_objs:
            bpy.context.view_layer.objects.active = o
            o.select_set(True)
            try:
                with bpy.context.temp_override(
                    window=window,
                    screen=screen,
                    area=area,
                    region=region,
                    active_object=o,
                    selected_objects=[o]
                ):
                    bpy.ops.transform.rotate(value=1.5708, orient_axis='X')
                    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
                o.select_set(False)
            except Exception as e:
                print("Warning rotating/baking for", o.name, e)

        # Select all objects (meshes + armature) for export
        bpy.ops.object.select_all(action='DESELECT')
        for o in all_objs:
            o.select_set(True)
        
        out_dir = os.path.dirname(OUTPUT_PATH)
        if out_dir and not os.path.exists(out_dir):
            os.makedirs(out_dir, exist_ok=True)

        print(f"Exporting {len(all_objs)} objects to FBX...")
        with bpy.context.temp_override(
            window=window,
            screen=screen,
            area=area,
            region=region,
            selected_objects=all_objs
        ):
            bpy.ops.export_scene.fbx(
                filepath=OUTPUT_PATH,
                use_selection=True,
                add_leaf_bones=False,
                bake_space_transform=True,
                apply_unit_scale=True,
                apply_scale_options='FBX_SCALE_ALL',
                use_mesh_modifiers=True
            )

        if os.path.exists(OUTPUT_PATH):
            print("✅ Exported FBX:", OUTPUT_PATH, "size:", os.path.getsize(OUTPUT_PATH))
        else:
            print("❌ Export command finished but output file not found at:", OUTPUT_PATH)

    except Exception:
        print("Exception during script:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
