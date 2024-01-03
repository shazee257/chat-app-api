const { chatSupportModel } = require('../models/chatSupportModel')
const { default: mongoose, Mongoose, Schema } = require("mongoose");
const { sendNotification } = require("../utils");
const { deleteFilter } = require("../utils/constants");
const { findUser, getAllUsers, findUsers, findOne } = require("../models/userModel");

class ChatSupportRepository {
    constructor(io) {
        this.io = io;
    }

    async getSupportChats(userId, page = 1, pageSize = 20, chatSupport = false, chatId = null) {
        try {
            const validatedPage = Math.max(1, page);
            const validatedPageSize = Math.max(1, pageSize);
            const skip = (validatedPage - 1) * validatedPageSize;
            // const skip = (page - 1) * pageSize;
            const currentUserId = new mongoose.Types.ObjectId(userId);
            //const chatSupportPip = { isChatSupport: (chatSupport == 'true' || chatSupport == true) }
            const chatSupportPip = {}
            if (chatId) chatSupportPip._id = new mongoose.Types.ObjectId(chatId);
            const result = await chatSupportModel.aggregate([
                {
                    $match: {
                        ...chatSupportPip,
                        $or: [
                            {
                                $and: [
                                    { "participants.userId": currentUserId },
                                    { "participants.status": "active" },
                                    { chatType: "one-to-one" },
                                ],
                            },
                            {
                                $and: [
                                    {
                                        $or: [
                                            { "participants.userId": currentUserId },
                                            { "messages.receivedBy.userId": currentUserId },
                                            { "messages.sentBy": currentUserId },
                                        ],
                                    },
                                    { chatType: "one-to-one" },
                                ],
                            },
                        ],
                    },
                },
                { $sort: { lastUpdatedAt: -1 } },
                { $skip: skip },
                { $limit: parseInt(pageSize) },
                {
                    $lookup: {
                        from: "users",
                        let: { participantIds: "$participants.userId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id", "$$participantIds"],
                                    },
                                },
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    email: 1,
                                    profileImage: 1,

                                },
                            },
                        ],
                        as: "participantsData",
                    },
                },
                {
                    $unwind: { path: "$messages", preserveNullAndEmptyArrays: true },
                },
                {
                    $group: {
                        _id: "$_id", // Unique identifier for the chat
                        chat_Id: {$first: "$chat_Id"},
                        chatType: { $first: "$chatType" },
                        isTicketClosed: { $first: "$isTicketClosed" },
                        isChatSupport: { $first: "$isChatSupport" },
                        ticketStatus: { $first: "$ticketStatus" },

                        groupName: { $first: "$groupName" },
                        participantUsernames: { $first: "$participantUsernames" },
                        totalMessages: { $first: "$totalMessages" },
                        messages: { $push: "$messages" }, // Push the messages into an array again
                        lastMessage: { $last: "$messages" }, // Get the last message as before
                        participants: { $first: "$participantsData" },
                        totalCount: { $first: "$totalCount" },
                        unReadCount: { $first: "$unReadCount" },
                    },
                },
                {
                    $addFields: {
                        messages: {
                            // $slice: [
                            //   {
                            $filter: {
                                input: "$messages",
                                cond: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ["$$this.sentBy", currentUserId] },
                                                { $ne: ["$$this.deleted", true] },
                                            ],
                                        },
                                        {
                                            $and: [
                                                { $ne: ["$$this.sentBy", currentUserId] },
                                                {
                                                    $in: [currentUserId, "$$this.receivedBy.userId"],
                                                },
                                                {
                                                    $not: {
                                                        $in: [true, "$$this.receivedBy.deleted"],
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        participants: {
                            $map: {
                                input: "$participants",
                                as: "participant",
                                in: {
                                    $mergeObjects: [
                                        "$$participant",
                                        {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$participantsData",
                                                        cond: {
                                                            $eq: ["$$this._id", "$$participant.userId"],
                                                        },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        lastMessage: { $last: "$messages" },
                        totalCount: { $size: "$messages" },
                        unReadCount: {
                            $size: {
                                $filter: {
                                    input: "$messages",
                                    cond: {
                                        $and: [
                                            { $ne: ["$$this.sentBy", currentUserId] },
                                            { $in: [currentUserId, "$$this.receivedBy.userId"] },
                                            {
                                                $not: {
                                                    $in: ["seen", "$$this.receivedBy.status"],
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        messages: { $reverseArray: { $slice: ["$messages", -40] } },
                    },
                },
                {
                    $match: {
                        $or: [
                            { chatType: "group" },
                            { $and: [{ chatType: "one-to-one", messages: { $ne: [] } }] },
                        ],
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "lastMessage.sentBy",
                        foreignField: "_id",
                        as: "sender",
                    },
                },
                { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } }, // Unwind the sender array
                {
                    $addFields: {
                        "lastMessage.firstName": {
                            $cond: [
                                { $ne: ["$sender", null] },
                                { $concat: ["$sender.firstName"] },
                                "Unknown User",
                            ],
                        },
                        "lastMessage.lastName": {
                            $cond: [
                                { $ne: ["$sender", null] },
                                { $concat: ["$sender.lastName"] },
                                "Unknown User",
                            ],
                        },
                        "lastMessage.coverImage": {
                            $cond: [
                                { $ne: ["$sender", null] },
                                { $concat: ["$sender.coverImage"] },
                                "Unknown User",
                            ],
                        },
                        "lastMessage.profileImage": {
                            $cond: [
                                { $ne: ["$sender", null] },
                                { $concat: ["$sender.profileImage"] },
                                "Unknown User",
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: "$_id", // Unique identifier for the chat
                        chat_Id: {$first: "$chat_Id"},
                        chatType: { $first: "$chatType" },
                        isTicketClosed: { $first: "$isTicketClosed" },
                        isChatSupport: { $first: "$isChatSupport" },
                        ticketStatus: { $first: "$ticketStatus" },
                        groupName: { $first: "$groupName" },
                        participantUsernames: { $first: "$participantUsernames" },
                        totalMessages: { $first: "$totalMessages" },
                        messages: { $first: "$messages" },
                        lastMessage: { $first: "$lastMessage" },
                        participants: { $first: "$participants" },
                        totalCount: { $first: "$totalCount" },
                        unReadCount: { $first: "$unReadCount" },
                    },
                },
                {
                    $sort: {
                        "lastMessage.createdAt": -1,
                    },
                },
                {
                    $project: {
                        chat_Id: 1,
                        chatType: 1,
                        groupName: 1,
                        isTicketClosed: 1,
                        isChatSupport: 1,
                        ticketStatus: 1,
                        // messages: 1,
                        lastMessage: 1,
                        participants: 1,
                        totalCount: 1,
                        unReadCount: 1,
                    },
                },
            ]);
            console.log(JSON.stringify(result, null, 2));
            if (this.io) this.io.emit(`getSupportChats/${userId}`, result);
            return result;
        } catch (error) {
            // Handle error
            console.error("Error retrieving user chats:", error);
            throw error;
        }
    }

    async getChatSupportMessages(chatId, userId, pageNumber, pageSize = 20) {
        // Step 1: Convert the page number to skip value
        // const skip = (pageNumber - 1) * parseInt(pageSize);
        const validatedPageNumber = Math.max(1, pageNumber); // Ensure pageNumber is at least 1
        const validatedPageSize = Math.max(1, parseInt(pageSize) || 20);// Ensure pageSize is at least 1
        const skip = (validatedPageNumber - 1) * validatedPageSize;

        const result = await chatSupportModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(chatId) } }, // Match the chat ID
            { $unwind: "$messages" }, // Unwind the messages array
            { $sort: { "messages.createdAt": -1 } }, // Sort messages by latest createdAt date
            { $skip: skip }, // Skip the specified number of messages
            { $limit: parseInt(pageSize) }, // Limit the number of messages per page
            {
                $match: {
                    $or: [
                        {
                            "messages.sentBy": { $ne: null },
                            "messages.sentBy": new mongoose.Types.ObjectId(userId),
                            "messages.deleted": { $ne: true },
                        },
                        {
                            // "messages.receivedBy.userId": { $ne: null },
                            "messages.receivedBy": {
                                $elemMatch: {
                                    userId: { $ne: null },
                                    userId: new mongoose.Types.ObjectId(userId),
                                    deleted: { $ne: true },
                                },
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "messages.sentBy",
                    foreignField: "_id",
                    as: "sender",
                },
            },
            { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } }, // Unwind the sender array
            {
                $addFields: {
                    "messages.senderId": "$sender._id",
                    "messages.firstName": {
                        $ifNull: ["$sender.firstName", "Support Agent"]
                    },
                    "messages.lastName": {
                        $ifNull: ["$sender.lastName", ""]
                    },
                    "messages.image": "$sender.image",
                },
            },
            {
                $group: {
                    _id: "$_id",
                    messages: { $push: "$messages" },
                    totalCount: { $sum: 1 }, // Count all messages
                    unReadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ["$messages.sentBy", null] },
                                        { $eq: ["$messages.sentBy", new mongoose.Types.ObjectId(userId)] },
                                        { $ne: ["$messages.deleted", true] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);


        // Step 3: Extract the messages, total count, and unread count from the result
        const messages = result.length > 0 ? result[0].messages : [];
        const totalCount = result.length > 0 ? result[0].totalCount : 0;
        const unReadCount = result.length > 0 ? result[0].unReadCount : 0;

        console.log("Messages:", messages);
        console.log("Total Count:", totalCount);
        console.log("Unread Count:", unReadCount);
        if (this.io)
            this.io.emit(`getChatSupportMessages/${userId}`, {
                messages,
                totalCount,
                unReadCount,
            });
        return { messages, totalCount, unReadCount };
    }

    async createSupportMessage(chatId, senderId, messageBody, urls = null, name = null) {
        try {
            const chat = await chatSupportModel.findById(chatId).select("-messages");
            if (!chat) {
                // Handle error: Chat not found
                throw new Error("Chat not found");
            }

            const id = new mongoose.Types.ObjectId();
            let newMessage = {
                _id: id,
                body: messageBody,
                mediaUrls: urls,
                sentBy: senderId,
                receivedBy: [],
                deleted: false,
                // Add other message properties if needed
            };
            if (chat.participants.some((e) => e.isBlocked)) {
                if (this.io) this.io.emit(`createSupportMessage/${chatId}/${senderId}`, 'cannot send message due to block')
                return 'cannot send message due to block'
            }

            chat.participants.forEach((participant) => {
                if (participant.status == "active" && participant.userId != senderId) {
                    newMessage.receivedBy.push({
                        userId: new mongoose.Types.ObjectId(participant.userId),
                        status: "sent",
                        deleted: false,
                    });
                }
            });
            // chat.messages.push(newMessage);
            //  console.log(newMessage);
            const lastMessage = {
                body: newMessage.body,
            };
            const updatedChat = await chatSupportModel.updateOne(
                { _id: chatId },
                {
                    $push: { messages: newMessage },
                    lastMessage,
                    lastUpdatedAt: new Date(),
                },
                { new: true }
            );
            const userIds = [];
            chat.participants.forEach(async (participant) => {
                if (participant.status == "active" && participant.userId != senderId) {
                    if (!participant.isMuted)
                        userIds.push(participant.userId)
                    // console.log(`newMessage/${chatId}/${participant.userId}`)
                    if (this.io) {
                        this.io.emit(
                            `createSupportMessage/${chatId}/${participant.userId}`,
                            { ...newMessage, name, firstName: name }
                        );

                        await this.getSupportChats(participant.userId)
                    }
                }

            });
            console.log(userIds)

            // this.sendNotificationMsg({
            //     userIds,
            //     title: name,
            //     body: messageBody,
            //     chatId,
            // }, chat);
            // return updatedChat;
        } catch (error) {
            // Handle error
            console.error("Error creating message:", error);
            throw error;
        }
    }

    async deleteAllSupportMessages(chatId, userId) {
        try {
            const filter = {
                _id: chatId,
                // $or: [
                //   {
                //     "messages.receivedBy.userId": userId,
                //     "messages.receivedBy.deleted": { $ne: true },
                //   },
                //   {
                //     "messages.sentBy": userId,
                //     "messages.deleted": { $ne: true },
                //   },
                // ],
            };

            const update = {
                $set: {
                    "messages.$[msgElem].receivedBy.$[recElem].deleted": true,
                    "messages.$[msgElem2].deleted": true,
                },
            };

            const options = {
                arrayFilters: [
                    { "msgElem.receivedBy.userId": userId },
                    { "recElem.userId": userId },
                    { "msgElem2.sentBy": userId },
                ],
            };
            const result = await chatSupportModel.updateMany(filter, update, options);
            console.log(result)
            if (this.io)
                this.io.emit(`deleteAllSupportMessages/${chatId}/${userId}`, {
                    message:
                        result.modifiedCount > 0
                            ? "messages deleted"
                            : "operation unsuccessful",
                    result,
                });
            return result;
        } catch (error) {
            console.error("Error deleting messages:", error);
            throw error;
        }
    }

    async sendNotificationMsg(data, chat = {}) {
        const userIds = data.userIds;
        const users = await findUsers({ _id: userIds }).select('fcmToken _id');
        console.log(users);
        users.forEach((e) => {
            sendNotification({ title: data.title, body: data.body, fcmToken: e.fcmToken, data: { chatId: data.chatId, userId: e._id } })
        });
    }


    async createChatForSupport(userId, topic = 'new topic') {
        const chatId = generateChatId();
        const check = await chatSupportModel.findOne({ isChatSupport: true, isTicketClosed: false, createdBy: userId }).select('-messages -participants')
        if (check && this.io) {
            this.io.emit(`createChatForSupport/${userId}`, { message: 'you already have an open tickets. Please close those tickets to create new one' })
            return check
        }
        const u = await findUsers({ role: 'admin', isActive: true })
        // console.log(u)
        let data = await chatSupportModel.create({
            chat_Id: chatId,
            groupName: topic,
            chatType: 'one-to-one',
            isChatSupport: true,
            // groupImageUrl,
            participants: [{
                userId: userId,
                status: "active",
            }, ...u.map((e) => ({ userId: e._id, status: 'active' }))],
            createdBy: userId,
            messages: [
                {
                    "body": "welcome to chat support.",
                    "sentBy": u[0]._id,
                    "receivedBy": [
                        {
                            userId,
                        }, //...u.map((e) => ({ userId: e._id }))
                    ],
                    "deleted": false,
                },
            ]
            // admins: chatType == "one-to-one" ? [] : [userId],
        });
        data = await chatSupportModel.aggregate(
            findUserpipeline({ _id: data._id })
        );
        if (this.io)
            data[0].participants.forEach((e) => {
                // if(e!=userId)
                this.io.emit(`createChatForSupport/${e.userId}`, {
                    message: "chat support created",
                    data: data[0],
                });
            });
        return data[0];
    }


    async closeChatSupport(chatId, userId) {
        const data = await chatSupportModel.findOneAndUpdate(
            { _id: chatId, isChatSupport: true },
            { isTicketClosed: true, ticketStatus: "Closed" },
            { new: true }
        ).select('-messages')
        if (this.io) {
            data.participants.forEach((e) => {
                // if(e!=userId)
                this.io.emit(`closeChatSupport/${e.userId}`, {
                    message: "ticket closed",
                    data: data,
                });
            });
        }
    }

}
function findUserpipeline(match) {
    return [
        { $match: match },
        {
            $lookup: {
                from: "users",
                let: { participantIds: "$participants.userId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$_id", "$$participantIds"]
                            }
                        }
                    },
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            photo: 1,
                            profileImage: 1,
                        }
                    }
                ],
                as: "participantsData"
            }
        },
        {
            $addFields: {
                participants: {
                    $map: {
                        input: "$participants",
                        as: "participant",
                        in: {
                            $mergeObjects: [
                                "$$participant",
                                {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$participantsData",
                                                cond: { $eq: ["$$this._id", "$$participant.userId"] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            ]
                        }
                    }
                },
            }
        },
        {
            $group: {
                _id: '$_id',
                chat_Id: { $first: '$chat_Id' },
                chatType: { $first: '$chatType' },
                groupName: { $first: '$groupName' },
                groupImageUrl: { $first: '$groupImageUrl' },
                // groupName: 1,
                participants: { $first: '$participants' },
                // Add other fields you want to include
            }
        },
        {
            $project: {
                // id: '$_id',
                chat_Id: 1,
                chatType: 1,
                groupName: 1,
                groupImageUrl: 1,
                // participantUsernames: 1,
                // totalMessages: 1,
                // messages: { $reverseArray: { $slice: ["$messages", -40] } },
                // lastMessage: { $last: "$messages" },
                participants: 1,
                // totalCount: 1,
                // unReadCount: 1,
            },
        },
    ]
}


const generateChatId = () => {
    const currentDate = new Date();
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    const milliseconds = currentDate.getMilliseconds().toString().padStart(3, '0');
    return `FIT${hours}${minutes}${seconds}${milliseconds}`;
};



module.exports = ChatSupportRepository;