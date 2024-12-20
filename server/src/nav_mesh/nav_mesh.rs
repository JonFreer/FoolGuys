
use oxidized_navigation::{NavMeshSettings, OxidizedNavigationMain, tiles::NavMeshTiles};

use crate::{physics::Physics, nav_mesh};

pub struct NavMesh{
    nav_mesh: OxidizedNavigationMain
}

impl NavMesh{

    // pub fn new()->Self{

    //     Self{}

    // }

    pub fn new(physics:  &mut Physics) -> Self{

        let nav_mesh_settings = NavMeshSettings {
            cell_width: 0.25,
            cell_height: 0.1,
            tile_width: 100,
            world_half_extents: 250.0,
            world_bottom_bound: -100.0,
            max_traversable_slope_radians: (40.0_f32 - 0.1).to_radians(),
            walkable_height: 20,
            walkable_radius: 1,
            step_height: 3,
            min_region_area: 100,
            merge_region_area: 500,
            max_contour_simplification_error: 1.1,
            max_edge_length: 80,
            max_tile_generation_tasks: Some(1),
        };

        let mut nav_mesh = OxidizedNavigationMain::new(nav_mesh_settings);
        nav_mesh.update_navmesh_affectors_system(&physics.collider_set);
        nav_mesh.send_tile_rebuild_tasks_system(&physics.collider_set);
        nav_mesh.output();
        // println!("Init NavMesh");
        // for (c_handle,collider) in physics.collider_set.iter(){
        //     println!("Collider hange {:?}",c_handle);
            
        //     println!("collider.translation() {:?}",collider.);
        // }
        println!("NavMesh Done");

        Self{
            nav_mesh
        }
    }

    pub fn get_state(& self) -> Option<NavMeshTiles>{
        self.nav_mesh.output()
    }
}