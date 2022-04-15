"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const game_1 = __importDefault(require("./game"));
const port = 3000;
class App {
    constructor(port) {
        this.clients = {};
        this.port = port;
        const app = (0, express_1.default)();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        this.server = new http_1.default.Server(app);
        this.io = new socket_io_1.Server(this.server);
        new game_1.default(this.io);
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
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}
new App(port).Start();
