const { Schema, model } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongoosePaginatedData } = require("../utils");

// chat schema
const chatSchema = new Schema({
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], required: true },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    groupAdmin: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true, versionKey: false });

// mongoose pagination plugin
chatSchema.plugin(mongoosePaginate);
chatSchema.plugin(aggregatePaginate);

const ChatModel = model('Chat', chatSchema);

// create new chat
const createChat = (obj) => ChatModel.create(obj);

// find chat by query
const findChat = (query) => ChatModel.findOne(query);

// get all chats
const getAllChats = async ({ query, page, limit, populate }) => {
    const { data, pagination } = await getMongoosePaginatedData({
        model: ChatModel,
        query,
        page,
        limit,
        populate
    });

    return { chats: data, pagination };
};

// update chat by query
const updateChat = (query, update) => ChatModel.findOneAndUpdate(query, update, { new: true });

module.exports = {
    createChat,
    findChat,
    getAllChats,
    updateChat
}
