// import cookie from "cookie";
// import { findUser } from "../models";
// import jwt from "jsonwebtoken";

// initialize socket.io
const initializeSocketIO = (io) => {
    return io.on("connection", async (socket) => {
        console.log('connected');

        try {
            // console.log('socket?.handshake?.headers >> ', socket?.handshake?.headers);
            // const token = socket.handshake.headers['access-token'];
            // console.log('token >> ', token);
            // socket.user = { name: 'Guest' }; // mount te user object to the socket
            // console.log('socket.user >> ', socket.user);
            const user = socket?.handshake?.headers['user-id'];
            console.log('first user >> ', user);

            socket.on(`message-65956f2219ac48d7555ddf54`, (data) => {
                console.log('data >> ', data);
                socket.broadcast.emit(`message-65956f2219ac48d7555ddf54`, data);
            });




            // We are creating a room with user id so that if user is joined but does not have any active chat going on.
            // still we want to emit some socket events to the user.
            // so that the client can catch the event and show the notifications.
            //   socket.join(user._id.toString());
            //   socket.emit(ChatEventEnum.CONNECTED_EVENT); // emit the connected event so that client is aware
            // console.log("User connected 🗼. userId: ", user._id.toString());

            // Common events that needs to be mounted on the initialization
            //   mountJoinChatEvent(socket);
            //   mountParticipantTypingEvent(socket);
            //   mountParticipantStoppedTypingEvent(socket);

            socket.on("disconnect", () => {
                console.log("user has disconnected 🚫. userId: ");// + socket.user?._id);
                // if (socket.user?._id) {
                //     socket.leave(socket.user._id);
                // }
            });
        } catch (error) {
            console.log('error >> ', error);
            //   socket.emit(
            //     ChatEventEnum.SOCKET_ERROR_EVENT,
            //     error?.message || "Something went wrong while connecting to the socket."
            //   );
        }
    });
};

// const emitSocketEvent = (req, roomId, event, payload) => {
//     req.app.get("io").in(roomId).emit(event, payload);
// };

export {
    initializeSocketIO,
    //  emitSocketEvent 
};
