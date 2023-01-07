# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTIBILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.
import bpy
import os

bl_info = {
    "name" : "Game Engine Exporter",
    "author" : "JonFreer",
    "description" : "",
    "blender" : (3, 2, 0),
    "version" : (0, 0, 1),
    "location" : "",
    "warning" : "",
    "category" : "Generic"
}

from . import auto_load

# auto_load.init()

class SetPhysicsHull(bpy.types.Operator):
    """My Object Moving Script"""      # Use this as a tooltip for menu items and buttons.
    bl_idname = "game_export.physics_hull"        # Unique identifier for buttons and menu items to reference.
    bl_label = "Set Physics Hull"         # Display name in the interface.
    bl_options = {'REGISTER', 'UNDO'}  # Enable undo for the operator.

    def execute(self,context):
        for obj in bpy.context.selected_objects:
            obj["physics"]= "hull"
            obj.display_type = "WIRE"
        
        return {'FINISHED'}   


class ExportScene(bpy.types.Operator):
    """My Object Moving Script"""      # Use this as a tooltip for menu items and buttons.
    bl_idname = "game_export.export"        # Unique identifier for buttons and menu items to reference.
    bl_label = "Export Scene"         # Display name in the interface.
    bl_options = {'REGISTER', 'UNDO'}  # Enable undo for the operator.

    def execute(self, context):        # execute() is called when running the operator.
        PATH = os.path.dirname(os.path.dirname(bpy.path.abspath("//")))
        # The original script
        scene = context.scene

        temp_collection = bpy.data.collections.new("Temp")
        collision_collection = bpy.data.collections.new("Collisions")
        client_collection = bpy.data.collections.new("Client")

        scene.collection.children.link(collision_collection)
        scene.collection.children.link(temp_collection)
        scene.collection.children.link(client_collection)

        objs = []
        land = None

        for obj in scene.objects:

            if (obj.is_instancer):
                print(obj.instance_collection.name)
                obj["asset"] = obj.instance_collection.name
                objs.append(obj.copy())

            if (obj.name == 'land'):
                land = obj

            print(obj.name)
        
        for obj in objs:
            temp_collection.objects.link(obj)


        bpy.ops.object.select_all(action='DESELECT')

        for obj in temp_collection.all_objects:
            obj.select_set(True)

        bpy.ops.object.duplicates_make_real()

        objs = [obj for obj in temp_collection.all_objects]
        for obj in objs:
            if ("Collision" in obj.name):
                temp_collection.objects.unlink(obj)
                collision_collection.objects.link(obj)
            if (obj.type=="EMPTY"):
                temp_collection.objects.unlink(obj)
                client_collection.objects.link(obj)

        collision_collection.objects.link(land.copy())
        client_collection.objects.link(land.copy())


        for obj in collision_collection.all_objects:
            obj.select_set(True)


        if "Spawn Points" in bpy.data.collections:
            for obj in bpy.data.collections["Spawn Points"].all_objects:
                obj["spawn_point"] = True
                obj.select_set(True)
                print("SPAWN POINT")
            print("SPAWN POINT")

        bpy.ops.export_scene.gltf(
            filepath=os.path.join( PATH , "Blender/collision.glb"), 
            use_selection = True,
            export_extras = True
        )

        bpy.ops.object.select_all(action='DESELECT')

        for obj in client_collection.all_objects:
            obj.select_set(True)

        print("PATHHHHH!")
        print(PATH)
        print(os.path.join(  PATH , "client/dist/assets/world.glb"))
        bpy.ops.export_scene.gltf(
                filepath=os.path.join(PATH , "client/dist/client/assets/world.glb"), 
                use_selection = True,
                export_extras = True
            )

  

        remove_collection(collision_collection)
        remove_collection(client_collection)
        remove_collection(temp_collection)


        return {'FINISHED'}            # Lets Blender know the operator finished successfully.


def remove_collection(collection):
    for obj in collection.all_objects:
        bpy.data.objects.remove(obj)
    bpy.data.collections.remove(collection)


class TOPBAR_MT_test(bpy.types.Menu):
    bl_idname = "TOPBAR_MT_test"
    bl_label = "Game Export"

    def draw(self, context):
        layout = self.layout
        # self.layout.menu
        # layout.operator("object.select_all", text="Select/Deselect All").action = 'TOGGLE'
        # layout.operator("object.select_all", text="Inverse").action = 'INVERT'
        layout.operator("game_export.export", text="Export Scene")
        layout.operator("game_export.physics_hull", text="Physics: Hull")
    def menu_draw(self, context):
        self.layout.menu("TOPBAR_MT_test")


def register():
    # auto_load.register()SetPhysicsHull
    bpy.utils.register_class(SetPhysicsHull)
    bpy.utils.register_class(ExportScene)
    bpy.utils.register_class(TOPBAR_MT_test)
    bpy.types.TOPBAR_MT_editor_menus.append(TOPBAR_MT_test.menu_draw)

def unregister():
    bpy.utils.unregister_class(SetPhysicsHull)
    bpy.utils.unregister_class(ExportScene)
    bpy.utils.unregister_class(TOPBAR_MT_test)
    bpy.types.TOPBAR_MT_editor_menus.remove(TOPBAR_MT_test.menu_draw)
    print("blahh")
    # auto_load.unregister()
