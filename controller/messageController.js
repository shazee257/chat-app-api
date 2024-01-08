const { updateChat } = require('../models/chatSchema');
const { createMessage, findMessage } = require('../models/messageSchema');
const { generateResponse, parseBody } = require('../utils');
const { STATUS_CODES } = require('../utils/constants');
const asyncHandler = require("express-async-handler");

// send message
const sendMessage = asyncHandler(async (req, res, next) => {
    const { content, chatId } = parseBody(req.body);

    if (!content || !chatId) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please provide content and chatId'
    });

    try {
        const newMessage = await createMessage({ sender: req.user.id, content, chat: chatId });
        const message = await findMessage({ _id: newMessage._id })
            .populate('sender', '-password')
            .populate('chat');

        // update last message
        await updateChat({ _id: chatId }, { $set: { lastMessage: newMessage._id } });

        generateResponse(message, 'Message sent', res);
    } catch (error) {
        next(error);
    }
});

// fetch all messages for a chat
const fetchAllMessages = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;

    try {

        //

    } catch (error) {
        next(error);
    }
});

module.exports = {
    sendMessage,
    fetchAllMessages
}