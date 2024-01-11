const socketIO = require('socket.io');

module.exports = (server) => {
    const io = socketIO(server);
    io.on('connection', async (socket) => {
        console.log('connected');

        socket.on("setup", (userData) => {
            socket.join(userData._id);
            console.log('user joined room: ', userData._id);
            socket.emit("connected");
        });

        socket.on("join chat", (room) => {
            socket.join(room);
            console.log("user joined room: ", room);
        });

        socket.on("typing", (room) => {
            console.log('first typing: ', room);
            socket.in(room).emit("typing")
        });

        socket.on("new message", (newMessageReceived) => {
            var chat = newMessageReceived.chat;

            if (!chat.users) return console.log("chat.users not defined");

            chat.users.forEach((user) => {
                if (user._id == newMessageReceived.sender._id) return;

                socket.in(user._id).emit("received", newMessageReceived);
            });
        });

        socket.on('disconnect', async () => {
            console.log("USER DISCONNECTED");
        });
    });
};