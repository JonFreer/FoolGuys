use gltf::{
    accessor::Iter,
    animation::{
        util::{Rotations, Scales, Translations},
        Interpolation as GltfInterpolation, Property, Reader,
    },
    iter::Buffers,
    Animation as GltfAnimation,
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

        let animations_vec = animations
        .filter(|a| a.channels().next().unwrap().target().node().name().unwrap() == name)
        .map(|a| Animation::new(&a,buffers)).collect();


        Self {
            animations:animations_vec,
            playback_state: PlaybackState {
                current: 0,
                time: 0.0,
                // total_time,
                paused: false,
                playback_mode: PlaybackMode::Loop,
            },
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct PlaybackState {
    pub current: usize,
    pub time: f32,
    // pub total_time: f32,
    pub paused: bool,
    pub playback_mode: PlaybackMode,
}

#[derive(Debug)]
pub struct Animation {
    translation: Option<AnimationTrack<Vector3<f32>>>,
    scale: Option<AnimationTrack<Vector3<f32>>>,
    rotation: Option<AnimationTrack<Quaternion<f32>>>,
}

impl Animation {
    pub fn new(animation: &gltf::animation::Animation, buffers: &Vec<gltf::buffer::Data>) -> Self {
        let mut rotation_track = None;
        let mut scale_track = None;
        let mut translation_track = None;

        for c in animation.channels() {
            println!("{:?}", c.target().node().name());
            println!("{:?}", c.target().property());

            let property = c.target().property();
            let reader = c.reader(|buffer| Some(&buffers[buffer.index()]));
            let readOutputs = reader.read_outputs().unwrap();
            // c.
            let track = match readOutputs {
                gltf::animation::util::ReadOutputs::Translations(data) => {
                    translation_track = Some(AnimationTrack::<Vector3<f32>>::new(
                        reader.read_inputs().unwrap(),
                        data,
                        map_interpolation(c.sampler().interpolation()),
                    ));
                }
                gltf::animation::util::ReadOutputs::Rotations(data) => {
                    rotation_track = Some(AnimationTrack::<Quaternion<f32>>::new(
                        reader.read_inputs().unwrap(),
                        data,
                        map_interpolation(c.sampler().interpolation()),
                    ));
                }
                gltf::animation::util::ReadOutputs::Scales(data) => {
                    scale_track = Some(AnimationTrack::<Vector3<f32>>::new(
                        reader.read_inputs().unwrap(),
                        data,
                        map_interpolation(c.sampler().interpolation()),
                    ));
                }
                _ => {}
            };
        }

        Self {
            translation: translation_track,
            scale: scale_track,
            rotation: rotation_track,
        }
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
    interoplation: Interpolation,
    times: Vec<f32>,
    track: Vec<T>,
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
            interoplation: interpolation,
            times: times_vec,
            track: track_vec,
        }
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
            interoplation: interpolation,
            times: times_vec,
            track: track_vec,
        }
    }
}

fn map_interpolation(gltf_interpolation: GltfInterpolation) -> Interpolation {
    match gltf_interpolation {
        GltfInterpolation::Linear => Interpolation::Linear,
        GltfInterpolation::Step => Interpolation::Step,
        GltfInterpolation::CubicSpline => Interpolation::CubicSpline,
    }
}
