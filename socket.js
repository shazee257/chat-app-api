const socketIO = require('socket.io');

module.exports = (server) => {
    const io = socketIO(server);
    io.on('connection', async (socket) => {


        

        socket.on('disconnect', async () => {

        });
    });
};