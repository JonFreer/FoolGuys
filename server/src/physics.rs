
use nalgebra::{Vector3, Vector2, Vector1, Quaternion, Unit};

use rapier3d::{
    control::{CharacterCollision, EffectiveCharacterMovement, KinematicCharacterController},
    crossbeam::{self, channel::Receiver},
    parry::query::Ray,
    prelude::{
        BroadPhase, CCDSolver, ChannelEventCollector, Collider, ColliderHandle, ColliderSet,
        CollisionEvent, ImpulseJointSet, IntegrationParameters,
        IslandManager, MultibodyJointSet, NarrowPhase, PhysicsPipeline, Point, QueryFilter,
        QueryPipeline, Real, RigidBody, RigidBodyHandle, RigidBodySet, Vector, Isometry,
    },
};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub struct Physics {
    pub rigid_body_set: RigidBodySet,
    pub collider_set: ColliderSet,
    pub island_manager: IslandManager,
    integration_parameters: IntegrationParameters,
    physics_pipeline: PhysicsPipeline,
    broad_phase: BroadPhase,
    narrow_phase: NarrowPhase,
    pub impulse_joint_set: ImpulseJointSet,
    multibody_joint_set: MultibodyJointSet,
    ccd_solver: CCDSolver,
    physics_hooks: (),
    query_pipeline: QueryPipeline,
    gravity: Vector3<f32>,
    event_handler: ChannelEventCollector,
    collision_recv: Receiver<CollisionEvent>,
    pub collision_vec: Vec<CollisionEvent>,
    // pub debug_render_pipeline: DebugRenderPipeline,
    // pub debug_state: DebugState,
}

impl Physics {
    pub fn new() -> Self {
        let gravity = Vector3::new(0.0, -9.81, 0.0);

        let rigid_body_set = RigidBodySet::new();
        let collider_set = ColliderSet::new();

        let integration_parameters = IntegrationParameters::default();
        let physics_pipeline = PhysicsPipeline::new();

        let broad_phase = BroadPhase::new();
        let narrow_phase = NarrowPhase::new();
        let impulse_joint_set = ImpulseJointSet::new();
        let multibody_joint_set = MultibodyJointSet::new();
        let ccd_solver = CCDSolver::new();
        let physics_hooks = ();
        let query_pipeline = QueryPipeline::new();
        let island_manager = IslandManager::new();

        let (collision_send, collision_recv) = crossbeam::channel::unbounded();
        let (contact_force_send, _contact_force_recv) = crossbeam::channel::unbounded();

        let event_handler = ChannelEventCollector::new(collision_send, contact_force_send);

        // let debug_render_style = DebugRenderStyle::default();

        Self {
            rigid_body_set,
            collider_set,
            island_manager,
            integration_parameters,
            physics_pipeline,
            broad_phase,
            narrow_phase,
            impulse_joint_set,
            multibody_joint_set,
            ccd_solver,
            physics_hooks,
            query_pipeline,
            gravity,
            event_handler,
            collision_recv,
            collision_vec: Vec::new(),
            // debug_render_pipeline: DebugRenderPipeline::new(
            //     debug_render_style,
            //     DebugRenderMode::COLLIDER_SHAPES,
            // ),
            // debug_state: DebugState {},
        }
    }

    pub fn remove_from_rigid_body_set(&mut self, rigid_bogy_handle: RigidBodyHandle) {
        self.rigid_body_set.remove(
            rigid_bogy_handle,
            &mut self.island_manager,
            &mut self.collider_set,
            &mut self.impulse_joint_set,
            &mut self.multibody_joint_set,
            true,
        );
    }

    pub fn update(&mut self) {
        self.physics_pipeline.step(
            &self.gravity,
            &self.integration_parameters,
            &mut self.island_manager,
            &mut self.broad_phase,
            &mut self.narrow_phase,
            &mut self.rigid_body_set,
            &mut self.collider_set,
            &mut self.impulse_joint_set,
            &mut self.multibody_joint_set,
            &mut self.ccd_solver,
            Some(&mut self.query_pipeline),
            &self.physics_hooks,
            &self.event_handler
        );

        self.query_pipeline.update(
            &self.rigid_body_set,
            &self.collider_set,
        );

        let mut collision_vec = Vec::new();

        while let Ok(collision_event) = self.collision_recv.try_recv() {
            // if let Some(collision_event) = collision_event{
            collision_vec.push(collision_event);
            // }
        }
    }

    pub fn update_characet_controller(
        &mut self,
        collider_handle: ColliderHandle,
        rigid_body_handle: RigidBodyHandle,
        collisions: &mut Vec<CharacterCollision>,
    ) -> EffectiveCharacterMovement {
        let pos = Vector3::new(0.0, 0.0, 0.0);

        let character_controller = KinematicCharacterController::default();

        let collider = self.get_collider(collider_handle).clone();

        character_controller.move_shape(
            self.integration_parameters.dt, // The timestep length (can be set to SimulationSettings::dt).
            &self.rigid_body_set,           // The RigidBodySet.
            &self.collider_set,             // The ColliderSet.
            &mut self.query_pipeline,       // The QueryPipeline.
            collider.shape(),               // The character’s shape.
            &collider.position(),           // The character’s initial position.
            pos.cast::<Real>(),
            QueryFilter::default().exclude_rigid_body(rigid_body_handle),
            |c| collisions.push(c), // We don’t care about events in this example.
        )
    }

    pub fn get_collider(&self, collider_handle: ColliderHandle) -> &Collider {
        &self.collider_set[collider_handle]
    }

    pub fn get_rigid_body(&mut self, rigid_body_handle: RigidBodyHandle) -> &mut RigidBody {
        &mut self.rigid_body_set[rigid_body_handle]
    }

    pub fn get_time_step(&self) -> f32 {
        self.integration_parameters.dt
    }

    pub fn get_translation(&self, rigid_body_handle: RigidBodyHandle) -> Vector3<f32> {
        self.rigid_body_set[rigid_body_handle].translation().clone()
    }

    pub fn get_linvel(&self, rigid_body_handle: RigidBodyHandle) -> Vector3<f32> {
        self.rigid_body_set[rigid_body_handle].linvel().clone()
    }

    pub fn get_rotation(&self, rigid_body_handle: RigidBodyHandle) -> Unit<Quaternion<f32>> {
        self.rigid_body_set[rigid_body_handle].rotation().clone()
    }

    pub fn cast_ray(
        &mut self,
        ray: &Ray,
        max_toi: f32,
        solid: bool,
        filter: QueryFilter,
    ) -> Option<(ColliderHandle, Real)> {
        self.query_pipeline.cast_ray(
            &self.rigid_body_set,
            &self.collider_set,
            &ray,
            max_toi,
            solid,
            filter,
        )
    }

    pub fn get_state(&mut self) -> PhysicsState {
        PhysicsState {
            bodies: self.rigid_body_set.clone(),
            colliders: self.collider_set.clone(),
            joints: self.impulse_joint_set.clone(),
        }
    }

    pub fn get_state_update(&mut self) -> PhysicsStateUpdate {
        PhysicsStateUpdate {
            bodies: self.rigid_body_set.clone(),
        }
    }

    // pub fn debug_render(&mut self) {
    //     self.debug_render_pipeline.render(
    //         &mut self.debug_state,
    //         &mut self.rigid_body_set,
    //         &mut self.collider_set,
    //         &mut self.impulse_joint_set,
    //         &mut self.multibody_joint_set,
    //         &self.narrow_phase,
    //     );
    // }
}

// pub struct DebugState {}

// impl DebugRenderBackend for DebugState {
//     fn draw_line(
//         &mut self,
//         object: DebugRenderObject<'_>,
//         a: Point<Real>,
//         b: Point<Real>,
//         color: [f32; 4],
//     ) {
//     }

//     fn draw_polyline(
//         &mut self,
//         object: DebugRenderObject<'_>,
//         vertices: &[Point<Real>],
//         indices: &[[u32; 2]],
//         transform: &Isometry<Real>,
//         scale: &Vector<Real>,
//         color: [f32; 4],
//     ) {
//     }

//     fn draw_line_strip(
//         &mut self,
//         object: DebugRenderObject<'_>,
//         vertices: &[Point<Real>],
//         transform: &Isometry<Real>,
//         scale: &Vector<Real>,
//         color: [f32; 4],
//         closed: bool,
//     ) {
//     }
// }


#[ts(export)]
#[derive(Serialize, Deserialize,TS)] 
#[derive(Clone)]
pub struct PhysicsState {
    #[ts(type = "any")] pub bodies:   RigidBodySet,
    #[ts(type = "any")] pub colliders: ColliderSet,
    #[ts(type = "any")] pub joints: ImpulseJointSet,
}

#[ts(export)]
#[derive(Serialize, Deserialize, Clone,TS)]
pub struct PhysicsStateUpdate {
    #[ts(type = "any")] pub bodies: RigidBodySet,
}
