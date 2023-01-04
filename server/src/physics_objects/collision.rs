use gltf::{Node, mesh::util::indices};
use nalgebra::{Vector3, Quaternion, UnitQuaternion};
use rapier3d::prelude::{ColliderBuilder, Collider, Point};

pub fn new_collider(node: &Node, buffers: &Vec<gltf::buffer::Data>) -> Option<Collider>{
    
    let extras:Option<gltf::json::Value> = match node.extras().as_ref(){
        Some(e) => Some(gltf::json::deserialize::from_str(e.get()).unwrap()),
        None => None
    };

    let collider = match extras{
        Some (e) => {
            match e["physics"].as_str(){
                Some("hull") => Some(new_hull_collider(node,buffers)),
                Some("box") => Some(new_box_collider(node)),
                Some("trimesh") => Some(new_trimesh_collider(node,buffers)),
                _ => {println!("None collider {:?}",e); None}
            }
        },
        None => None
        
    };

    collider

}

fn new_box_collider(node: &Node) -> Collider {
    println!("New box");
    let pos = node.transform().decomposed().0;
    let scale = node.transform().decomposed().2;

    let mut collider =
        ColliderBuilder::cuboid(scale[0] / 2.0, scale[1] / 2.0, scale[2] / 2.0).build();
        
    collider.set_translation(Vector3::new(pos[0], pos[1], pos[2]));
    
    collider

}

fn new_hull_collider(node: &Node,buffers: &Vec<gltf::buffer::Data>) -> Collider {

    let scale = node.transform().decomposed().2;
    
    let primitive = node.mesh().unwrap().primitives().next().unwrap();
    let reader = primitive.reader(|buffer| Some(&buffers[buffer.index()]));

    let p_vec = reader
        .read_positions()
        .unwrap()
        .map(|p| {
            Point::new(p[0] * scale[0], p[1] * scale[1], p[2] * scale[2])
        })
        .collect::<Vec<_>>();

    let pos = node.transform().decomposed().0;
    let rot = node.transform().decomposed().1;

    let mut collider =
        ColliderBuilder::convex_hull(&p_vec).unwrap().build();
        
    let rotation = UnitQuaternion::from_quaternion(Quaternion::new(
        rot[3], rot[0], rot[1], rot[2],
    ));
    // collider.set_mass(0.0);

    collider.set_rotation(rotation);
    
    collider.set_translation(Vector3::new(pos[0], pos[1], pos[2]));

    collider

}


fn new_trimesh_collider(node: &Node,buffers: &Vec<gltf::buffer::Data>) -> Collider {
    println!("trimesh");
    let scale = node.transform().decomposed().2;
    
    let primitive = node.mesh().unwrap().primitives().next().unwrap();
    let reader = primitive.reader(|buffer| Some(&buffers[buffer.index()]));

    let p_vec = reader
        .read_positions()
        .unwrap()
        .map(|p| {
            Point::new(p[0] * scale[0], p[1] * scale[1], p[2] * scale[2])
        })
        .collect::<Vec<_>>();

    let indicies = reader.read_indices().unwrap().into_u32().collect::<Vec<_>>();
    let mut indices_out = Vec::new();
    println!("Indicies {}",indicies.len());
    let mut i = 0;
    while i < indicies.len() {
        // ...
        indices_out.push([indicies[i],indicies[i+1],indicies[i+2]]);
        i += 3;
    }


    // .map(|p| [p[0],p[1],p[2]]).collect::<Vec<_>>();

    let pos = node.transform().decomposed().0;
    let rot = node.transform().decomposed().1;

    let mut collider =
        ColliderBuilder::trimesh(p_vec,indices_out).build();
        
    let rotation = UnitQuaternion::from_quaternion(Quaternion::new(
        rot[3], rot[0], rot[1], rot[2],
    ));
    // collider.set_mass(0.0);

    collider.set_rotation(rotation);
    
    collider.set_translation(Vector3::new(pos[0], pos[1], pos[2]));

    collider

}