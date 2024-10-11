const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: true
});

app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World");
});

const emailToSocket = new Map();
const socketToEmail = new Map();
peers = {}

io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id}`);
    peers[socket.id] = socket

    for(let id in peers) {
        if(id === socket.id) continue
        console.log('sending init receive to ' + socket.id)
        peers[id].emit('initReceive', socket.id)
    }

    /**
     * relay a peerconnection signal to a specific socket
     */
    socket.on('signal', data => {
        console.log('sending signal from ' + socket.id + ' to ', data)
        if(!peers[data.socket_id])return
        peers[data.socket_id].emit('signal', {
            socket_id: socket.id,
            signal: data.signal
        })
    })

    /**
     * remove the disconnected peer connection from all other connected clients
     */
    socket.on('disconnect', () => {
        console.log('socket disconnected ' + socket.id)
        socket.broadcast.emit('removePeer', socket.id)
        delete peers[socket.id]
    })

    /**
     * Send message to client to initiate a connection
     * The sender has already setup a peer connection receiver
     */
    socket.on('initSend', init_socket_id => {
        console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
        peers[init_socket_id].emit('initSend', socket.id)
    })
})

server.listen(process.env.PORT, () => console.log(`Server has started.`));
