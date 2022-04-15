import express from 'express'
import path from 'path'
import http from 'http'
import { Server, Socket } from 'socket.io'
import * as THREE from 'three'
import Physics from './physics'
import Game from './game'
const port: number = 3000

class App {
    private server: http.Server
    private port: number
    public physics: Physics
    private io: Server
    // private clients: {[id:string]:Client} = {
// }

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))

        this.server = new http.Server(app)

        this.io = new Server(this.server)

        new Game(this.io)

    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()