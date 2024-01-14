import { Schema, model } from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { getMongoosePaginatedData } from "../utils/helper.js";
import { ROLES } from "../utils/constants.js";

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
export const createUser = (obj) => UserModel.create(obj);

// find user by query
export const findUser = (query) => UserModel.findOne(query);

// get all users
export const getAllUsers = async ({ query, page, limit }) => {
    const { data, pagination } = await getMongoosePaginatedData({
        model: UserModel,
        query,
        page,
        limit,
    });

    return { users: data, pagination };
};