let socket = null;

exports.socketIO = (s) => {
    socket = s;
}

// send message (support chat)
exports.sendMessageIO = (chat, message) => {
    socket?.emit(`support-${chat}`, message);
}

// close chat
exports.closeTicketIO = (chat, chatObj) => {
    socket?.emit(`close-ticket-${chat}`, chatObj);
}