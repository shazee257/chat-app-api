import { Schema, model } from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { getMongoosePaginatedData } from "../utils/helper.js";

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
export const createChat = (obj) => ChatModel.create(obj);

// find chat by query
export const findChat = (query) => ChatModel.findOne(query);

// get all chats
export const getAllChats = async ({ query, page, limit, populate }) => {
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
export const updateChat = (query, update) => ChatModel.findOneAndUpdate(query, update, { new: true });