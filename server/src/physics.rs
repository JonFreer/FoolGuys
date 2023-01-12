use nalgebra::{vector, Vector3};
use rapier3d::{
    control::{CharacterCollision, EffectiveCharacterMovement, KinematicCharacterController},
    crossbeam::{self, channel::Receiver},
    prelude::{
        BroadPhase, CCDSolver, ChannelEventCollector, Collider, ColliderHandle, ColliderSet,
        CollisionEvent, ImpulseJointSet, IntegrationParameters, IslandManager, MultibodyJointSet,
        NarrowPhase, PhysicsPipeline, QueryFilter, QueryPipeline, Real, RigidBody, RigidBodyHandle,
        RigidBodySet,
    },
};

pub struct Physics {
    pub rigid_body_set: RigidBodySet,
    pub collider_set: ColliderSet,
    pub island_manager: IslandManager,
    integration_parameters: IntegrationParameters,
    physics_pipeline: PhysicsPipeline,
    broad_phase: BroadPhase,
    narrow_phase: NarrowPhase,
    impulse_joint_set: ImpulseJointSet,
    multibody_joint_set: MultibodyJointSet,
    ccd_solver: CCDSolver,
    physics_hooks: (),
    query_pipline: QueryPipeline,
    gravity: Vector3<f32>,
    event_handler: ChannelEventCollector,
    collision_recv: Receiver<CollisionEvent>,
    pub collision_vec: Vec<CollisionEvent>,
}

impl Physics {
    pub fn new() -> Self {
        let gravity = vector![0.0, -9.81, 0.0];

        let mut rigid_body_set = RigidBodySet::new();
        let mut collider_set = ColliderSet::new();

        let integration_parameters = IntegrationParameters::default();
        let mut physics_pipeline = PhysicsPipeline::new();

        let mut broad_phase = BroadPhase::new();
        let mut narrow_phase = NarrowPhase::new();
        let mut impulse_joint_set = ImpulseJointSet::new();
        let mut multibody_joint_set = MultibodyJointSet::new();
        let mut ccd_solver = CCDSolver::new();
        let physics_hooks = ();
        let mut query_pipline = QueryPipeline::new();
        let mut island_manager = IslandManager::new();

        let (collision_send, collision_recv) = crossbeam::channel::unbounded();
        let (contact_force_send, _contact_force_recv) = crossbeam::channel::unbounded();

        let event_handler = ChannelEventCollector::new(collision_send, contact_force_send);

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
            query_pipline,
            gravity,
            event_handler,
            collision_recv,
            collision_vec: Vec::new(),
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
            &self.physics_hooks,
            &self.event_handler,
        );

        self.query_pipline.update(
            &self.island_manager,
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

        let mut character_controller = KinematicCharacterController::default();

        let collider = self.get_collider(collider_handle).clone();

        character_controller.move_shape(
            self.integration_parameters.dt, // The timestep length (can be set to SimulationSettings::dt).
            &self.rigid_body_set,           // The RigidBodySet.
            &self.collider_set,             // The ColliderSet.
            &mut self.query_pipline,        // The QueryPipeline.
            collider.shape(),               // The character’s shape.
            &collider.position(),           // The character’s initial position.
            pos.cast::<Real>(),
            QueryFilter::default().exclude_rigid_body(rigid_body_handle),
            |c| collisions.push(c), // We don’t care about events in this example.
        )
    }

    pub fn get_collider(& self, collider_handle: ColliderHandle) -> &Collider {
        &self.collider_set[collider_handle]
    }

    pub fn get_rigid_body(&mut self, rigid_body_handle: RigidBodyHandle) -> &mut RigidBody {
        &mut self.rigid_body_set[rigid_body_handle]
    }

    pub fn get_time_step(& self) -> f32 {
        self.integration_parameters.dt
    }
}