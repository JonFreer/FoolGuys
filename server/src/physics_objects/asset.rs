use nalgebra::{Isometry3, Quaternion, Translation3, UnitQuaternion, Vector3};
use rapier3d::prelude::{Collider, ColliderBuilder, Compound, Isometry, Translation};

use super::collision;

pub struct AssetBase {
    collider: Collider,
}

impl AssetBase {
    pub fn new(path: String) -> Self {
        let (gltf, buffers, _) = gltf::import(path).unwrap();

        let mut shapes = Vec::new();

        for scene in gltf.scenes() {
            for node in scene.nodes() {
                if let Some(_) = node.mesh() {
                    // let collider_option =

                    if let Some(shape) = collision::new_shape(&node, &buffers) {
                        let pos = node.transform().decomposed().0;
                        let position = Translation3::new(pos[0], pos[1], pos[2]);

                        let rot = node.transform().decomposed().1;
                        let rotation = UnitQuaternion::from_quaternion(Quaternion::new(
                            rot[3], rot[0], rot[1], rot[2],
                        ));

                        shapes.push((Isometry3::from_parts(position, rotation), shape));
                    }
                }
            }
        }

        let compound = ColliderBuilder::compound(shapes).build();

        Self { collider: compound }
    }

    pub fn get_collider(& self, scale: Vector3<f32>) -> Collider {

        println!("getting collider");
        if scale.x== 1.0 && scale.y == 1.0 && scale.z == 1.0 {
            println!("got collider");
            return self.collider.clone();
        }

        let shape = self.collider.shared_shape().as_compound().unwrap();

        let shapes = shape.shapes();

        let mut shapes_new = Vec::new();
        for shape in shapes {
            shapes_new.push((
                Isometry3::from_parts(
                    shape.0.translation ,//* Translation::from(scale),
                    shape.0.rotation,
                ),
                collision::resize_shared_shape(&shape.1, scale).unwrap(),
            ));

        }

        println!("got collider");
        ColliderBuilder::compound(shapes_new).build()

    }
}
