## Install

- Install the Blender Development Extension for VS Code
- Open the Command Pallet (cmd+shift+p) and type "Blender: Build and Start" 
- Select your Blender path
- If changes are made run the "Blender: Reload Addon" command

The addon should appear on the Blender Tool Bar

## Functionality 

### Export 
**Export Scene:** Exports the current scene into two states (Client and Server). The server state holds all the collision objects. The client state holds any meshes that need to be directly rendered and references to assets that need to be imported and then rendered.

**Export Assets:** This command is to be run in the asset.blend file. It automatically exports all the assets to the correct folders. For the client it exports the mesh in a DRACO compressed format. For the server it exports the collision meshes uncompressed.

### Physics

- **Ball:**  Sets the physics tag to ball 
- **Hull:**  Sets the physics tag to hull 
- **Capsule:** Sets the physics tag to capsule. Note: Use the asset for capsule, which contains the tags radius and half height.

**Properties From Mod:**  This is to be used on capsules when the propeties (half height and radius) have been changed. This will copy the properties from the gemoetry modifer to the custom properties ready to be exported into .glb.

### Joints

**Set Joint:** adds the joint and joint_main tags. The joint tag should hold a string that links two joints. The joint_main tag should be set to either a 0 or a 1 to represent if this point is a pivot.


## Ragdolls

Ragdolls are represented as collision objects linked by joints. For the character ragdoll these collison objects are capsules (remember to run "Properties From Mod" if the collider sizes are changed). 

**Scale is not supported for ragdoll colliders.**

Collision objects are linked with joints. In Blender these are represented as empties which are parented to the collision obejct. Each empty should have two tags: the joint tag and the joint_main tag. The joint tag should be a unique string for that joint which is paired with another empty. The joint_main tag should be either 0 or 1 and represent if this joint is the pivot of the bone. The location of this joint is where the bone will be placed in the client.

