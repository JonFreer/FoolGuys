import { Camera, Frustum, Vector3 } from "three"

declare module 'three-csm'{
    export default class CSM  {
        data:any
        camera:Camera
        parent:any
        cascades:number
        maxFar:number
        mode:any
        shadowMapSize:number
        shadowBias:number
        lightDirection:Vector3
        lightIntensity:number
        lightNear:number
        lightFar:number
        lightMargin:number
        customSplitsCallback:any
        fade :boolean
        mainFrustum :any
        frustums:any[]
        breaks:any[]
        lights:any[]
        shaders:any
        constructor( data:any ) 
        public update(camera:any):void
    }

}



