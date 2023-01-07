import bpy

class TOPBAR_MT_test(bpy.types.Menu):
    bl_idname = "TOPBAR_MT_test"
    bl_label = "TEST"

    def draw(self, context):
        layout = self.layout

        # la

        # layout.operator("object.select_all", text="Select/Deselect All").action = 'TOGGLE'
        # layout.operator("object.select_all", text="Inverse").action = 'INVERT'
        # layout.operator("object.select_random", text="Random")


