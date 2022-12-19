import * as CANNON from 'cannon-es'
import Game from './game'

export default class Physics{
    public world = new CANNON.World()
    public bodies: { [id: string]: CANNON.Body } = {}

    public groundMaterial: CANNON.Material
    public slipperyMaterial: CANNON.Material
    private game: Game
    // public jewelBody: CANNON.Body = new CANNON.Body()

    constructor(game:Game,io: any) {
        this.game = game
        this.world.gravity.set(0, -9.82, 0)
        this.groundMaterial = new CANNON.Material('groundMaterial')
        this.groundMaterial.friction = 0.15
        this.groundMaterial.restitution = 0.25
        this.slipperyMaterial = new CANNON.Material('slipperyMaterial')
        this.slipperyMaterial.friction = 0.15
        this.slipperyMaterial.restitution = 0.25
        const groundShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5))
        const groundBody = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
        })
        groundBody.addShape(groundShape)
        groundBody.position.x = 0
        groundBody.position.y = -1
        groundBody.position.z = 0
        this.world.addBody(groundBody)

    }

    public createPlayer(id: string): number {
        const sphereShape = new CANNON.Box(new CANNON.Vec3(0.5,0.5, 0.5))
        const sphereBody = new CANNON.Body({
            mass: 1,
            material: this.slipperyMaterial,
        angularDamping: .9 })
        sphereBody.addShape(sphereShape)
        sphereBody.addEventListener('collide', (e: any) => {
            // console.log("collide",e.contact.ni.dot(new CANNON.Vec3(0, 1, 0)))
            
            if (e.contact.ni.dot(new CANNON.Vec3(0, 1, 0)) < -0.5 || e.contact.ni.dot(new CANNON.Vec3(0, 1, 0))>0.99) {
                // console.log("collide")
                this.game.players[id].canJump = true
            }
        })
        sphereBody.position.x = Math.random() * 10 - 5
        sphereBody.position.y = 3
        sphereBody.position.z = Math.random() * 10 - 5
        this.world.addBody(sphereBody)

        this.bodies[id] = sphereBody
        return sphereBody.id
    }


}