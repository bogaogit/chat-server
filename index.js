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

io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    socket.on("room:join", data => {
        const { email, room } = data;
        emailToSocket.set(email, socket.id);
        socketToEmail.set(socket.id, email);

        socket.join(room);
        console.log("user:joined", { email, id: socket.id });
        io.to(room).emit("user:joined", { email, id: socket.id });

        // emits a 'room:joined' event back to the client
        // that just joined the room.
        io.to(socket.id).emit("room:join", data);
    });

    socket.on("user:call", ({ to, offer }) => {
        console.log("incoming:call", { from: socket.id, offer });
        io.to(to).emit("incoming:call", { from: socket.id, offer });
    });

    socket.on("call:accepted", ({ to, ans }) => {
        console.log("call:accepted", { from: socket.id, ans });
        io.to(to).emit("call:accepted", { from: socket.id, ans });
    });


})

server.listen(process.env.PORT, () => console.log(`Server has started.`));
