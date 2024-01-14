import { Schema, model } from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { getMongoosePaginatedData } from "../../utils/helper.js";

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
export const createMessage = (obj) => MessageModel.create(obj);

// find message by query
export const findMessage = (query) => MessageModel.findOne(query);

// get all messages
export const getAllMessages = async ({ query, page, limit, populate }) => {
    const { data, pagination } = await getMongoosePaginatedData({
        model: MessageModel,
        query,
        page,
        limit,
        populate
    });

    return { messages: data, pagination };
};