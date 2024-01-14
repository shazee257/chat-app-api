import { generateResponse, parseBody } from '../utils/helper.js';
import { createMessage, findMessage, getAllMessages } from '../models/index.js';
import asyncHandler from 'express-async-handler';
import { STATUS_CODES } from '../utils/constants.js';

// send message
export const sendMessage = asyncHandler(async (req, res, next) => {
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
export const fetchAllMessages = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const query = { chat: chatId };
    const populate = [
        { path: 'sender', select: 'name email profileImage' },
        { path: 'chat' }
    ];

    try {
        const messagesData = await getAllMessages({ query, page, limit, populate });
        if (messagesData?.messages?.length === 0) {
            generateResponse(null, 'No messages found', res);
            return;
        }

        generateResponse(messagesData, 'Messages fetched', res);
    } catch (error) {
        next(error);
    }
});