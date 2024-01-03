const { Schema, model } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongoosePaginatedData } = require("../utils");

// message schema
const messageSchema = new Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },
}, { timestamps: true, versionKey: false });

// mongoose pagination plugin
messageSchema.plugin(mongoosePaginate);
messageSchema.plugin(aggregatePaginate);

const MessageModel = model('Message', messageSchema);


