
use crate::physics::Physics;

pub struct NavMesh{

}

impl NavMesh{

    pub fn new()->Self{

        Self{}

    }

    pub fn init(&mut self, physics:  &mut Physics){

        println!("Init NavMesh");
        for (c_handle,collider) in physics.collider_set.iter(){
            println!("Collider hange {:?}",c_handle);
            
            println!("collider.translation() {:?}",collider.volume());
        }
    }
}