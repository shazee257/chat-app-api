const { findChat, createChat } = require('../models/chatSchema');
const { generateResponse, parseBody } = require('../utils');
const { STATUS_CODES } = require('../utils/constants');
const asyncHandler = require("express-async-handler");

// create or fetch one to one chat
const accessChat = asyncHandler(async (req, res, next) => {
    const { user } = parseBody(req.body);
    const query = {
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: user } } },
            { users: { $elemMatch: { $eq: req.user.id } } }
        ]
    };

    try {
        const isChat = await findChat(query).populate('users', '-password');
        if (isChat) {
            generateResponse(isChat, 'Chat found', res);
            return;
        }

        // create new chat  
        const newChat = await createChat({
            chatName: 'sender',
            isGroupChat: false,
            users: [user, req.user.id],
        });

        const finalChat = await findChat({ _id: newChat._id }).populate('users', '-password');
        generateResponse(finalChat, 'Chat created', res);
    } catch (error) {
        next(error);
    }
});

module.exports = {
    accessChat
}