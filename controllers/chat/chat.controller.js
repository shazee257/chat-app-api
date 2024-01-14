import { generateResponse, parseBody } from '../../utils/helper.js';
import { findChat, createChat, getAllChats } from '../../models/index.js';
import asyncHandler from 'express-async-handler';
import { STATUS_CODES } from '../../utils/constants.js';

// create or fetch one to one chat
export const accessChat = asyncHandler(async (req, res, next) => {
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

// fetch all chats
export const fetchAllChats = asyncHandler(async (req, res, next) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const query = { users: { $elemMatch: { $eq: req.user.id } } };
    const populate = [
        { path: 'users', select: '-password' },
        { path: 'groupAdmin', select: '-password' },
        {
            path: 'lastMessage', select: '-password',
            populate: { path: 'sender', select: 'name email profileImage' }
        },
    ]

    try {
        const chatsData = await getAllChats({ query, page, limit, populate });
        console.log('first: ', chatsData);
        if (chatsData?.chats.length === 0) {
            generateResponse(null, 'No chats found', res);
            return;
        }

        generateResponse(chatsData, 'Chats found', res);
    } catch (error) {
        next(error);
    }
});

// create group chat
export const createGroupChat = asyncHandler(async (req, res, next) => {
    const { chatName, users } = parseBody(req.body);

    if (users.length < 2) return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: 'More than 2 users are required to create a group chat'
    });

    users.push(req.user.id);

    try {
        const groupChat = await createChat({ chatName, users, isGroupChat: true, groupAdmin: req.user.id });
        const finalChat = await findChat({ _id: groupChat._id })
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        generateResponse(finalChat, 'Group chat created', res);
    } catch (error) {
        next(error);
    }
});

// rename group chat
export const renameGroupChat = asyncHandler(async (req, res, next) => {
    const { chatName, chatId } = parseBody(req.body);

    try {
        const chat = await findChat({ _id: chatId });
        if (!chat) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Chat not found'
        });

        chat.chatName = chatName;
        await chat.save();

        const updatedChat = await findChat({ _id: chat._id })
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        generateResponse(updatedChat, 'Group chat renamed', res);
    } catch (error) {
        next(error);
    }
});

// remove from group
export const removeFromGroup = asyncHandler(async (req, res, next) => {
    const { chatId, userId } = parseBody(req.body);

    try {
        const chat = await findChat({ _id: chatId });
        if (!chat) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Chat not found'
        });

        // check if user is admin
        if (!chat.groupAdmin.equals(req.user.id)) return next({
            statusCode: STATUS_CODES.UNAUTHORIZED,
            message: 'Only group admin can remove members'
        });

        // remove user from group
        chat.users.remove(userId);
        await chat.save();

        const updatedChat = await findChat({ _id: chat._id })
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        generateResponse(updatedChat, 'User removed from group', res);
    } catch (error) {
        next(error);
    }
});

// addUserToGroup
export const addUserToGroup = asyncHandler(async (req, res, next) => {
    const { chatId, userId } = parseBody(req.body);

    try {
        const chat = await findChat({ _id: chatId });
        if (!chat) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Chat not found'
        });

        // check if user is admin
        if (!chat.groupAdmin.equals(req.user.id)) return next({
            statusCode: STATUS_CODES.UNAUTHORIZED,
            message: 'Only group admin can add members'
        });

        // add user to group
        chat.users.push(userId);
        await chat.save();

        const updatedChat = await findChat({ _id: chat._id })
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        generateResponse(updatedChat, 'User added to group', res);
    } catch (error) {
        next(error);
    }
});
