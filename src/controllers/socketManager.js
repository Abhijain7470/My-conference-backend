import { Server as SocketIOServer } from "socket.io";


let connections = {}
let messages = {}
let timeOnline = {}

export const connectToSocket = (httpServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Basic connection handlers to help debugging and provide a central place
    // to add socket-level event listeners later.
    io.on('connection', (socket) => {

        console.log("something connected")

        socket.on('join-call', (path) => {

            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id);

            timeOnline[socket.id] = new Date();

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit('user-joined', socket.id, connections[path]);

            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; a++) {
                    io.to(socket.id).emit('chat-message', messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender']);
                }
            }

        });

        socket.on('signal', (told, message) => {
            io.to(told).emit('signal', socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFoundd], [roomKey, roomValue]) => {
                    if (!isFoundd && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFoundd];

                }, ["", false]);

            if(found === true){
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({'sender': sender, 'data': data, 'socket-id-sender': socket.id});
                console.log("message", KeyboardEvent, ":", sender, data)

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit('chat-message', data, sender, socket.id);
                })
            }

        });

        socket.on('disconnect', () => {

            var diffTime = Math.abs(timeOnline[socket.id] - new Date());

            var Key

            for(const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

                for (let a = 0; a < v.length; a++) {
                    if(v[a] === socket.id){
                        Key = k;
                        
                        for (let a =0; a < connections[Key].length; a++) {
                           io.to(connections[Key][a]).emit('user-left', socket.id)
                             
                        }

                        var index = connections[Key].indexOf(socket.id);

                        connections[Key].splice(index, 1);

                        if(connections[Key].length === 0){
                            delete connections[Key];
                        }
                    
                    }
                }
            }


        });
    });

    return io;
};