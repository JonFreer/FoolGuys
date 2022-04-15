import express from 'express'
import path from 'path'
import http from 'http'
import { Server, Socket } from 'socket.io'
import * as THREE from 'three'
import Physics from './physics'
import Game from './game'
const port: number = 3000
type Client={ 
    id:string;
    keyMap:{ [id: string]: boolean };
    p:any;
    r:any;
    bodyId:number;
}
class App {
    private server: http.Server
    private port: number
    public physics: Physics
    private io: Server
    private clients: {[id:string]:Client} = {
}

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))

        this.server = new http.Server(app)

        this.io = new Server(this.server)

        new Game(this.io)
        // this.physics = new Physics(this.io)

        // this.io.on('connection', (socket: Socket) => {
        //     console.log(socket.constructor.name)
        //     this.clients[socket.id] = {
        //         id:socket.id,
        //         keyMap:{},
        //         r:new THREE.Vector3(),
        //         p:new THREE.Vector3(),
        //         bodyId:undefined
        //     }
        //     this.clients[socket.id].bodyId = this.physics.createPlayer(socket.id)
        //     console.log(this.clients)
        //     console.log('a user connected : ' + socket.id)
        //     socket.emit('id', socket.id)

        //     socket.on('disconnect', () => {
        //         console.log('socket disconnected : ' + socket.id)
        //         if (this.clients && this.clients[socket.id]) {
        //             console.log('deleting ' + socket.id)
        //             delete this.clients[socket.id]
        //             this.io.emit('removeClient', socket.id)
        //         }
        //     })

        //     socket.on('update', (message: any) => {
        //         if (this.clients[socket.id]) {
        //             this.clients[socket.id].keyMap = message.keyMap
        //         }
        //     })
        // })

        // setInterval(() => {
        //     this.physics.world.step(0.025)

        //     for (const client_id in this.clients){

                
        //     // this.clients.forEach((client) => {
        //         const client = this.clients[client_id]
        //         // console.log(this.physics.bodies[client_id])
        //         client.p = this.physics.bodies[client_id].position
        //         client.r = this.physics.bodies[client_id].fixedRotation
        //         // if(client?keyMap!=undefined){
        //             if(client.keyMap!=undefined){
        //             // console.log(client.keyMap)
        //             if(client.keyMap['w']){
        //                 client.p.z+=0.1
        //                 // this.physics.bodies[client_id].velocity.x+=1
        //             }
        //             if(client.keyMap['s']){
        //                 client.p.z-=0.1
        //             }
        //             if(client.keyMap['a']){
        //                 client.p.x+=0.1
        //             }
        //             if(client.keyMap['d']){
        //                 client.p.x-=0.1
        //             }
        //         }
              
        //     }
        //     // this.clients[socket.id].p = message.p

        //     this.io.emit('clients', this.clients)
        // }, 25)
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()