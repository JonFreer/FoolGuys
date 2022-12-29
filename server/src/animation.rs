use gltf::{
    accessor::Iter,
    animation::{
        util::{Rotations},
        Interpolation as GltfInterpolation,
    },

    iter::Animations as GltfAnimations,
};

use nalgebra::{Quaternion, Vector3};

#[derive(Debug)]
pub struct Animations {
    animations: Vec<Animation>,
    playback_state: PlaybackState,
}

impl Animations {
    pub fn new(animations: GltfAnimations, name: String, buffers: &Vec<gltf::buffer::Data>) -> Self {

        let animations_vec:Vec<Animation> = animations
        .filter(|a| a.channels().next().unwrap().target().node().name().unwrap() == name)
        .map(|a| Animation::new(&a,buffers)).collect();

        let total_time = animations_vec.get(0).map_or(0.0, |a| a.total_time);

        Self {
            animations:animations_vec,
            playback_state: PlaybackState {
                current: 0,
                time: 0.0,
                total_time,
                paused: false,
                playback_mode: PlaybackMode::Loop,
            },
        }
    }

    pub fn update(&mut self, delta_time: f32) -> NodesKeyFrame {
        if self.playback_state.paused {
            return NodesKeyFrame(None,None,None);
        }

        match self.animations.get_mut(self.playback_state.current) {
            Some(animation) => {
                self.playback_state.advance(delta_time);
                animation.animate(self.playback_state.time)
            }
            _ => NodesKeyFrame(None,None,None),
        }
    }

    pub fn get_playback_state(&self) -> &PlaybackState {
        &self.playback_state
    }

    pub fn set_current(&mut self, index: usize) {
        if index < self.animations.len() {
            if let Some(animation) = self.animations.get(index) {
                self.playback_state.set_current(index, animation);
            }
        }
    }

    pub fn set_playback_mode(&mut self, playback_mode: PlaybackMode) {
        self.playback_state.playback_mode = playback_mode;
    }

    pub fn toggle(&mut self) {
        self.playback_state.paused = !self.playback_state.paused;
    }

    pub fn stop(&mut self) {
        self.playback_state.paused = true;
        self.reset();
    }

    pub fn reset(&mut self) {
        self.playback_state.time = 0.0;
    }

    pub fn start(&mut self){
        self.reset();
        self.playback_state.paused = false;
    }

    pub fn animations(&self) -> &[Animation] {
        &self.animations
    }
}

#[derive(Debug, Copy, Clone)]
pub struct PlaybackState {
    pub current: usize,
    pub time: f32,
    pub total_time: f32,
    pub paused: bool,
    pub playback_mode: PlaybackMode,
}

impl PlaybackState {
    fn advance(&mut self, delta_time: f32) {
        self.time = match self.playback_mode {
            PlaybackMode::Loop => (self.time + delta_time) % self.total_time,
            PlaybackMode::Once => f32::min(self.time + delta_time, self.total_time),
        };

        if  self.time == self.total_time{
            self.paused = true;
        }
    }

    fn set_current(&mut self, index: usize, animation: &Animation) {
        if self.current != index {
            self.time = 0.0;
            self.total_time = animation.total_time;
            self.current = index;
        }
    }
}

#[derive(Debug)]
pub struct Animation {
    total_time: f32,
    translation: Option<AnimationTrack<Vector3<f32>>>,
    scale: Option<AnimationTrack<Vector3<f32>>>,
    rotation: Option<AnimationTrack<Quaternion<f32>>>,
}

#[derive(Debug, Copy, Clone)]
pub struct NodesKeyFrame(
    pub Option<Vector3<f32>>,
    pub Option<Quaternion<f32>>,
   pub Option<Vector3<f32>>,
);


impl Animation {
    pub fn new(animation: &gltf::animation::Animation, buffers: &Vec<gltf::buffer::Data>) -> Self {
        let mut rotation_track = None;
        let mut scale_track = None;
        let mut translation_track = None;
        let mut total_time = 0.0;

        for c in animation.channels() {
            println!("{:?}", c.target().node().name());
            println!("{:?}", c.target().property());

            // let property = c.target().property();
            let reader = c.reader(|buffer| Some(&buffers[buffer.index()]));
            let read_ouputs = reader.read_outputs().unwrap();

            match read_ouputs {
                gltf::animation::util::ReadOutputs::Translations(data) => {
                    let track = AnimationTrack::<Vector3<f32>>::new(
                        reader.read_inputs().unwrap(),
                        data,
                        map_interpolation(c.sampler().interpolation()),
                    );
                    total_time = track.get_max_time().max(total_time);
                    translation_track = Some(track);
                }
                gltf::animation::util::ReadOutputs::Rotations(data) => {

                    let track = AnimationTrack::<Quaternion<f32>>::new(
                        reader.read_inputs().unwrap(),
                        data,
                        map_interpolation(c.sampler().interpolation()),
                    );

                    total_time = track.get_max_time().max(total_time);
                    rotation_track = Some(track);
                }
                gltf::animation::util::ReadOutputs::Scales(data) => {

                    let track = AnimationTrack::<Vector3<f32>>::new(
                        reader.read_inputs().unwrap(),
                        data,
                        map_interpolation(c.sampler().interpolation()),
                    );

                    total_time = track.get_max_time().max(total_time);
                    scale_track = Some(track);
                }
                _ => {}
            };

            
        }

        

        Self {
            total_time :total_time,
            translation: translation_track,
            scale: scale_track,
            rotation: rotation_track,
        }
    }

 
    pub fn animate(&mut self, time: f32) -> NodesKeyFrame {
         self.sample(time)
        // translations.iter().for_each(|(node_index, translation)| {
        //     nodes.nodes_mut()[*node_index].set_translation(*translation);
        // });
        // rotations.iter().for_each(|(node_index, rotation)| {
        //     nodes.nodes_mut()[*node_index].set_rotation(*rotation);
        // });
        // scale.iter().for_each(|(node_index, scale)| {
        //     nodes.nodes_mut()[*node_index].set_scale(*scale);
        // });

        // !translations.is_empty() || !rotations.is_empty() || !scale.is_empty()
        
    }

    fn sample(&self, t: f32) -> NodesKeyFrame {

        let translation = match &self.translation{
            Some(val) => val.sample(t),
            None => None
        };

        let rotation = match &self.rotation{
            Some(val) => val.sample(t),
            None => None
        };

        let scale = match &self.scale{
            Some(val) => val.sample(t),
            None => None
        };

        NodesKeyFrame(
            translation,
            rotation,
            scale
        )
    }
}

#[derive(Copy, Clone, Debug)]
enum Interpolation {
    Linear,
    Step,
    CubicSpline,
}

#[derive(Debug, Copy, Clone)]
pub enum PlaybackMode {
    Loop,
    Once,
}

#[derive(Debug)]
struct AnimationTrack<T> {
    interpolation: Interpolation,
    times: Vec<f32>,
    values: Vec<T>,
}

impl<T: Interpolate> AnimationTrack<T>{
    fn sample(&self, t: f32) -> Option<T> {
        let index = {
            let mut index = None;
            for i in 0..(self.times.len() - 1) {
                let previous = self.times[i];
                let next = self.times[i + 1];
                if t >= previous && t < next {
                    index = Some(i);
                    break;
                }
            }
            index
        };

        index.map(|i| {
            let previous_time = self.times[i];
            let next_time = self.times[i + 1];
            let delta = next_time - previous_time;
            let from_start = t - previous_time;
            let factor = from_start / delta;

            match self.interpolation {
                Interpolation::Step => self.values[i],
                Interpolation::Linear => {
                    let previous_value = self.values[i];
                    let next_value = self.values[i + 1];

                    previous_value.linear(next_value, factor)
                }
                Interpolation::CubicSpline => {
                    let previous_values = [
                        self.values[i * 3],
                        self.values[i * 3 + 1],
                        self.values[i * 3 + 2],
                    ];
                    let next_values = [
                        self.values[i * 3 + 3],
                        self.values[i * 3 + 4],
                        self.values[i * 3 + 5],
                    ];
                    Interpolate::cubic_spline(
                        previous_values,
                        previous_time,
                        next_values,
                        next_time,
                        factor,
                    )
                }
            }
        })
    }

    
}

impl AnimationTrack<Vector3<f32>> {
    pub fn new(
        times_iter: Iter<f32>,
        track_iter: Iter<[f32; 3]>,
        interpolation: Interpolation,
    ) -> Self {
        let times_vec = times_iter.collect();
        let track_vec = track_iter.map(Vector3::from).collect();

        Self {
            interpolation,
            times: times_vec,
            values: track_vec,
        }
    }


    pub fn get_max_time(&self) -> f32 {
        self.times.last().copied().unwrap_or(0.0)
    }
    
}

impl AnimationTrack<Quaternion<f32>> {
    pub fn new(times_iter: Iter<f32>, track_iter: Rotations, interpolation: Interpolation) -> Self {
        let times_vec = times_iter.collect();

        let track_vec = track_iter
            .into_f32()
            .map(|r| Quaternion::new(r[3], r[0], r[1], r[2]))
            .collect::<Vec<_>>();

        Self {
            interpolation,
            times: times_vec,
            values: track_vec,
        }
    }

    pub fn get_max_time(&self) -> f32 {
        self.times.last().copied().unwrap_or(0.0)
    }
}

fn map_interpolation(gltf_interpolation: GltfInterpolation) -> Interpolation {
    match gltf_interpolation {
        GltfInterpolation::Linear => Interpolation::Linear,
        GltfInterpolation::Step => Interpolation::Step,
        GltfInterpolation::CubicSpline => Interpolation::CubicSpline,
    }
}


trait Interpolate: Copy {
    fn linear(self, other: Self, amount: f32) -> Self;

    fn cubic_spline(
        source: [Self; 3],
        source_time: f32,
        target: [Self; 3],
        target_time: f32,
        current_time: f32,
    ) -> Self;
}

impl Interpolate for Vector3<f32> {
    fn linear(self, other: Self, amount: f32) -> Self {
        self.lerp(&other, amount)
        // self.lerp
    }

    fn cubic_spline(
        source: [Self; 3],
        source_time: f32,
        target: [Self; 3],
        target_time: f32,
        amount: f32,
    ) -> Self {
        let t = amount;
        let p0 = source[1];
        let m0 = (target_time - source_time) * source[2];
        let p1 = target[1];
        let m1 = (target_time - source_time) * target[0];

        (2.0 * t * t * t - 3.0 * t * t + 1.0) * p0
            + (t * t * t - 2.0 * t * t + t) * m0
            + (-2.0 * t * t * t + 3.0 * t * t) * p1
            + (t * t * t - t * t) * m1
    }
}

impl Interpolate for Quaternion<f32> {
    fn linear(self, other: Self, amount: f32) -> Self {
        // slerp(self, other, amount)
        self.lerp(&other,amount)
    }

    fn cubic_spline(
        source: [Self; 3],
        source_time: f32,
        target: [Self; 3],
        target_time: f32,
        amount: f32,
    ) -> Self {
        let t = amount;
        let p0 = source[1];
        let m0 = (target_time - source_time) * source[2];
        let p1 = target[1];
        let m1 = (target_time - source_time) * target[0];

        let result = (2.0 * t * t * t - 3.0 * t * t + 1.0) * p0
            + (t * t * t - 2.0 * t * t + t) * m0
            + (-2.0 * t * t * t + 3.0 * t * t) * p1
            + (t * t * t - t * t) * m1;

        result.normalize()
    }
}