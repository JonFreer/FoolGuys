import express from 'express'
import path from 'path'
import http from 'http'
import { Server } from 'socket.io'


const port: number = 3000

class App {
    private server: http.Server
    private port: number

    private io: Server

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))

        this.server = new http.Server(app)

        this.io = new Server(this.server)



    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()