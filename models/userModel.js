const { Schema, model } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongoosePaginatedData } = require("../utils");
const { ROLES } = require("../utils/constants");

// user schema
const userSchema = new Schema({
    name: { type: String },
    email: { type: String, lowercase: true },
    profileImage: { type: String, default: null },
    password: { type: String, default: null, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
}, { timestamps: true, versionKey: false });

userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);

const UserModel = model('User', userSchema);

// create new user
const createUser = (obj) => UserModel.create(obj);

// find user by query
const findUser = (query) => UserModel.findOne(query);

// get all users
const getAllUsers = async ({ query, page, limit }) => {
    const { data, pagination } = await getMongoosePaginatedData({
        model: UserModel,
        query,
        page,
        limit,
    });

    return { users: data, pagination };
};

module.exports = {
    createUser,
    findUser,
    getAllUsers
}