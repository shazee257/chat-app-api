const { Schema, model } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongoosePaginatedData } = require("../utils");

// message schema
const messageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: Schema.Types.ObjectId, ref: "Chat" },
    readBy: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
}, { timestamps: true, versionKey: false });

// mongoose pagination plugin
messageSchema.plugin(mongoosePaginate);
messageSchema.plugin(aggregatePaginate);

const MessageModel = model('Message', messageSchema);

// create message
const createMessage = (obj) => MessageModel.create(obj);

// find message by query
const findMessage = (query) => MessageModel.findOne(query);

// get all messages
const getAllMessages = async ({ query, page, limit, populate }) => {
    const { data, pagination } = await getMongoosePaginatedData({
        model: MessageModel,
        query,
        page,
        limit,
        populate
    });

    return { messages: data, pagination };
};

module.exports = {
    createMessage,
    findMessage,
    getAllMessages
}
