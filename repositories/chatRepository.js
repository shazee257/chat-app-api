const { ChatModel } = require("../models/chatModel"); // Assuming the model is imported here
const { default: mongoose, Mongoose, Schema } = require("mongoose");
const { deleteFilter } = require("../utils/constants");
const { findUser, getAllUsers, findUsers } = require("../models/userModel");
const { sendNotification } = require("../utils");

class ChatRepository {
  constructor(io) {
    this.io = io;
  }
 
  async getChats(userId, page = 1, pageSize = 20, chatSupport = false,chatId=null) {
    try {
      const skip = (page - 1) * pageSize;
      const currentUserId = new mongoose.Types.ObjectId(userId);
      const chatSupportPip = { isChatSupport: (chatSupport == 'true' || chatSupport == true) }
      if(chatId) chatSupportPip._id  =new  mongoose.Types.ObjectId(chatId);
      const result = await ChatModel.aggregate([
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
                  { chatType: "group" },
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
                  photo: 1,
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
            chatType: { $first: "$chatType" },
            isTicketClosed: { $first: "$isTicketClosed" },
            isChatSupport: { $first: "$isChatSupport" },
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
            "lastMessage.photo": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.photo"] },
                "Unknown User",
              ],
            },
          },
        },
        {
          $group: {
            _id: "$_id", // Unique identifier for the chat
            chatType: { $first: "$chatType" },
            isTicketClosed: { $first: "$isTicketClosed" },
            isChatSupport: { $first: "$isChatSupport" },
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
            chatType: 1,
            groupName: 1,
            isTicketClosed: 1,
            isChatSupport: 1,
            // messages: 1,
            lastMessage: 1,
            participants: 1,
            totalCount: 1,
            unReadCount: 1,
          },
        },
      ]);
      if (this.io) this.io.emit(`getChats/${userId}`, result);
      return result;
    } catch (error) {
      // Handle error
      console.error("Error retrieving user chats:", error);
      throw error;
    }
  }

  // Get chat messages with pagination (50 per page)
  async getChatMessages(chatId, userId, pageNumber, pageSize = 20) {
    // Step 1: Convert the page number to skip value
    const skip = (pageNumber - 1) * parseInt(pageSize);

    const result = await ChatModel.aggregate([
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
          "messages.firstName": "$sender.firstName",
          "messages.lastName": "$sender.lastName",
          "messages.image": "$sender.image",
        },
      },
      {
        $group: {
          _id: "$_id",
          messages: { $push: "$messages" },
          // totalCount: { $sum: 1 }, // Calculate the total count of messages in the chat
          // unReadCount: { $sum: "$unReadCount" }, // Calculate the total count of unread messages in the chat
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
      this.io.emit(`getChatMessages/${userId}`, {
        messages,
        totalCount,
        unReadCount,
      });
    return { messages, totalCount, unReadCount };
  }

  async createMessage(chatId, senderId, messageBody, urls = null, name = null) {
    try {
      const chat = await ChatModel.findById(chatId).select("-messages");

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
      if(chat.participants.some((e)=>e.isBlocked)) {
        if(this.io) this.io.emit(`newMessage/${chatId}/${senderId}`,'cannot send message due to block')
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
      // console.log(newMessage);
      const lastMessage = {
        body: newMessage.body,
      };
      const updatedChat = await ChatModel.updateOne(
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
          if(!participant.isMuted)
            userIds.push(participant.userId)
          // console.log(`newMessage/${chatId}/${participant.userId}`)
          if (this.io) {
            this.io.emit(
              `newMessage/${chatId}/${participant.userId}`,
              { ...newMessage, name, firstName: name }
            );
            // this.io.emit(
            //   `getChats/${participant.userId}`, await this.getChats(participant.userId)
            // );
            await this.getChats(participant.userId)
          }
        }
      });
      console.log(userIds)    
      this.sendNotificationMsg({
        userIds,
        title: name,
        body: messageBody,
        chatId,
      },chat);
      return updatedChat;
    } catch (error) {
      // Handle error
      console.error("Error creating message:", error);
      throw error;
    }
  }
  // Mark all messages as read for a user
  async readAllMessages(chatId, userId) {
    try {
      // const filter = {
      //   _id: chatId,
      //   "messages.receivedBy.userId": userId,
      //   "messages.receivedBy.status": { $ne: "seen" },
      //   "messages.receivedBy.deleted": { $ne: true },
      // };
      const filter = {
        _id: chatId,
        messages: {
          $elemMatch: {
            "receivedBy.userId": userId,
            "receivedBy.status": { $ne: "seen" },
            "receivedBy.deleted": { $ne: true },
          },
        },
      };
      const update = {
        $set: { "messages.$[msgElem].receivedBy.$[recElem].status": "seen" },
      };

      const options = {
        arrayFilters: [
          { "msgElem.receivedBy.userId": userId },
          { "recElem.userId": userId },
        ],
      };

      const result = await ChatModel.updateMany(filter, update, options);
      console.log("Update result:", result);
      if (this.io)
        this.io.emit(`readMessages/${chatId}/${userId}`, {
          message:
            result.modifiedCount > 0
              ? "messages read"
              : "operation unsuccessful",
          result,
        });
      return result;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  // Delete a message for a user
  async deleteAllMessage(chatId, userId) {
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
      const result = await ChatModel.updateMany(filter, update, options);
      console.log(result)
      if (this.io)
        this.io.emit(`deleteMessages/${chatId}/${userId}`, {
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
  async deleteSelectedMessage(chatId, userId, msgIds) {
    try {
      const filter = {
        _id: chatId,
        $or: [
          {
            "messages.receivedBy.userId": userId,
            "messages.receivedBy.deleted": { $ne: true },
            "messages.receivedBy._id": { $in: msgIds },
          },
          {
            "messages.sentBy": userId,
            "messages.deleted": { $ne: true },
            "messages._id": { $in: msgIds },
          },
        ],
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
      const result = await ChatModel.updateMany(filter, update, options);
      if (this.io)
        this.io.emit(`deleteSelectedMessages/${chatId}/${userId}`, {
          // message:
          //   result.modifiedCount > 0
          //     ? "selected messages deleted"
          //     : "operation unsuccessful",
          result,
        });
      return result;
    } catch (error) {
      console.error("Error deleting messages:", error);
      throw error;
    }
  }
  // Add participants to a chat
  async addParticipants(chatId, userId, participantIds) {
    try {
      console.log({ chatId, participantIds });
      const filter = { _id: chatId };
      const participantsToAdd = await findUsers({ _id: participantIds });
      let username = '';
      participantsToAdd.map((e) => username += `${e.firstName ?? ''} ${e.lastName ?? ''}, `);
  
      const update = {
        $addToSet: { participants: { $each: participantIds.map(userId => ({ userId,status:'active' })) } },
      };
  
      let result = await ChatModel.findOneAndUpdate(filter, update)
        .select("-messages")
        .populate({
          path: "participants.userId",
          select: "username firstName lastName _id photo",
        });
  
      const msg = {
        _id: new mongoose.Types.ObjectId(),
        body: `${username}joined the group`,
        addedUsers: participantIds,
        groupName: result.groupName,
        sentBy: null,
        receivedBy: result.participants.map((e) => ({
          'userId': e.userId,
          'status': 'seen'
        }))
      };
  
      await result.update({
        $push: {
          messages: msg
        }
      });
  
      await result.save();
  
      if (this.io) {
        result.participants.forEach(async (participant) => {
          if (participant.status == "active") {
            console.log(participant.userId._id.toString());
            this.io.emit(
              `newMessage/${chatId}/${participant.userId._id.toString()}`,
              msg
            );
            // this.io.emit(
            //   `getChats/${participant.userId._id}`, await this.getChats(participant.userId)
            // );
            await this.getChats(participant.userId)
          }
        });
  
        this.io.emit(`addParticipants/${chatId}`, {
          message: "added participants",
          result,
        });
      }
  
      return result;
    } catch (error) {
      console.error("Error adding participants:", error);
      throw error;
    }
  }

  // Remove participants from a chat
  async removeParticipants(chatId, /*userId,*/ participantIds) {
    try {
      console.log({ chatId, participantIds });
      const filter = { _id: chatId /*admins: userId*/ };
      const u = await findUsers({ _id: participantIds });
      let username = '';
      u.map((e) => username += `${e.firstName ?? ''} ${e.lastName ?? ''}, `);
      // console.log(username)
      const update = {
        $pull: { participants: { userId: { $in: participantIds } } },
      };
      let result = await ChatModel.findOneAndUpdate(filter, update)
        .select("-messages")
        .populate({
          path: "participants.userId",
          select: "username firstName lastName _id  photo",
        });
      // console.log(result)
      const msg = {
        _id: new mongoose.Types.ObjectId(),
        body: `${username}leave the group`,
        removedUsers: participantIds,
        groupName: result.groupName,
        sentBy: null,
        receivedBy: result.participants.map((e) => ({
          'userId': e.userId,
          'status': 'seen'
        }))
      };
      await result.update({
        $push: {
          messages: msg
        }
      })
      const userIds = [];
      // console.log(result)
      await result.save()
      if (participantIds.includes(result.createdBy.toString()))
        result = await ChatModel.findOneAndUpdate(filter, { createdBy: result.participants[0].userId._id }).populate({
          path: "participants.userId",
          select: "username firstName lastName _id  photo status",
        });
      // console.log(result.participants);
      if (this.io) {
        result.participants.forEach(async (participant) => {
          if (participant.status == "active") {
            // console.log(participant.userId._id.toString())
            if(participantIds[0] !== participant.userId._id && !participant.isMuted) userIds.push(participant.userId._id)
            // console.log(`newMessage/${chatId}/${participant.userId}`)
            // if (this.io) {
            this.io.emit(
              `newMessage/${chatId}/${participant.userId._id.toString()}`,
              msg
            );
            // this.io.emit(
            //   `getChats/${participant.userId._id}`, await this.getChats(participant.userId)
            // );
            await this.getChats(participant.userId)
            // }
          }
        });
        this.io.emit(`removeParticipants/${chatId}`, {
          message:
            result == null
              ? "you are not allowed to remove participants"
              : "removed participants",
          result,
        });
      }
        this.sendNotificationMsg({
          userIds,
          title: result.groupName,
          body: `${username}leave the group`,
          chatId,
        },result);
      
      return result;
    } catch (error) {
      console.error("Error removing participants:", error);
      throw error;
    }
  }

  // Add admins to a group chat
  async addAdmins(chatId, userId, adminIds) {
    try {
      const filter = {
        _id: chatId,
        chatType: "group",
        admins: userId,
      };
      const update = {
        $addToSet: { admins: { $each: adminIds } },
      };

      const result = await ChatModel.findOneAndUpdate(filter, update, {
        new: true,
      }).select("-messages");
      if (this.io)
        this.io.emit(`addAdmins/${chatId}`, {
          message:
            result === null
              ? "you are not allowed to add admins"
              : "admin added",
          result,
        });
      return result;
    } catch (error) {
      console.error("Error adding admins:", error);
      throw error;
    }
  }

  // Remove admins from a group chat
  async removeAdmins(chatId, userId, adminIds) {
    try {
      const filter = {
        _id: chatId,
        admins: userId,
        chatType: "group",
        createdBy: { $nin: adminIds },
      };
      const update = {
        $pull: { admins: { $in: adminIds } },
      };

      const result = await ChatModel.findOneAndUpdate(filter, update).select(
        "-messages"
      );
      const admins = result?.admins.filter(
        (value) => !adminIds.includes(value.toString())
      );
      if (this.io)
        this.io.emit(`removeAdmins/${chatId}`, {
          message:
            result === null
              ? "you are not allowed to remove admins"
              : "removed admins",
          result: { ...result, admins },
        });
      return result;
    } catch (error) {
      console.error("Error removing admins:", error);
      throw error;
    }
  }
  async createChatSupport(userId, topic = 'new topic') {
    const check = await ChatModel.findOne({ isChatSupport: true, isTicketClosed: false, createdBy: userId }).select('-messages -participants')
    if (check && this.io) {
      this.io.emit(`createChatSupport/${userId}`, { message: 'you already have an open tickets. Please close those tickets to create new one' })
      return check
    }
    const u = await findUsers({ role: 'admin', isActive: true })
    // console.log(u)
    let data = await ChatModel.create({
      groupName: topic,
      chatType: 'group',
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
    data = await ChatModel.aggregate(
      findUserpipeline({ _id: data._id })
    );
    if (this.io)
      data[0].participants.forEach((e) => {
        // if(e!=userId)
        this.io.emit(`createChatSupport/${e.userId}`, {
          message: "chat support created",
          data: data[0],
        });
      });
    return data[0];
  }

  async closeChatSupport(chatId, userId) {
    const data = await ChatModel.findOneAndUpdate({ _id: chatId, isChatSupport: true }, { isTicketClosed: true }).select('-messages')
    if (this.io) {
      data.participants.forEach((e) => {
        // if(e!=userId)
        this.io.emit(`closeChatSupportTicket/${e.userId}`, {
          message: "ticket closed",
          data: data,
        });
      });
    }
  }
  async createChat(userId, participantIds, chatType, groupName, groupImageUrl) {
    try{
      let match = { 'participants.userId': { $all: participantIds }, ...deleteFilter }
    let check = null;
    if (chatType == 'one-to-one') {
      match.chatType = 'one-to-one';
      check = await ChatModel.findOne(
        match
      )
    }
    if (check) {
      check = await ChatModel.aggregate(
        findUserpipeline({ _id: check._id })
      );
      if (this.io)
        participantIds.forEach((e) => {
          this.io.emit(`createChat/${e}`, {
            message: "chat already exits",
            data: check[0],
          });
        });
      return check[0]
    };
    const data = await ChatModel.create({
      groupName,
      chatType,
      groupImageUrl,
      participants: participantIds.map((e) => ({
        userId: e,
        status: "active",
      })),
      createdBy: chatType == "one-to-one" ? null : userId,
      admins: chatType == "one-to-one" ? [] : [userId],
    });
    const d = await ChatModel.aggregate(
      findUserpipeline({ _id: data._id })
    );
    if (this.io)
      participantIds.forEach((e) => {
        // if(e!=userId)
        this.io.emit(`createChat/${e}`, {
          message: "chat created",
          data: d[0],
        });
      });
      if(chatType==='group'){
      this.sendNotificationMsg({
        userIds:participantIds.filter(item => item !== userId),
        title: groupName,
        body: 'You are added to a group',
       chatId: d[0]._id,
      },d[0])
    }  
    return d[0];
    }catch(e){
      console.log(e)
      return e
    }
  }

  async getChatMedia(chatId, userId) {
    // Assuming you have the chatId or any other identifier for the desired chat
    // const chatId = 'your_chat_id_here';

    const mediaFiles = await ChatModel.aggregate([
      // Match the desired chat using its ID or any other criteria
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chatId)
        }
      },
      // Unwind the messages array to create separate documents for each message
      {
        $unwind: "$messages"
      },
      // Match only the messages with non-empty mediaUrls
      {
        $match: {
          "messages.mediaUrls": { $exists: true, $ne: null },
          $or: [
            {
              "messages.sentBy": new mongoose.Types.ObjectId(userId),
              "messages.deleted": { $ne: true },
            },
            {
              "messages.receivedBy.userId": new mongoose.Types.ObjectId(userId),
              "messages.receivedBy.deleted": { $ne: true },
            },
          ],
        }
      },
      // Group the mediaUrls from all matching messages into a single array
      {
        $group: {
          _id: null,
          messages: {
            $push: {
              messageId: "$messages._id",
              mediaUrls: "$messages.mediaUrls"
            }
          }
        }
      },
      // Project the result to show messageId instead of _id
      {
        $project: {
          _id: 0,
          mediaUrls: {
            $reduce: {
              input: "$messages.mediaUrls",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          },
          messages: {
            $map: {
              input: "$messages",
              as: "msg",
              in: {
                messageId: "$$msg.messageId",
                mediaUrls: "$$msg.mediaUrls"
              }
            }
          }
        }
      }
    ]);
    return mediaFiles;
  }

  async updateChat(chatId, groupName = null, image = null) {
    let data = {};
    if (groupName)
      data.groupName = groupName;
    if (image)
      data.groupImageUrl = image;
    let m = await ChatModel.updateOne(
      { _id: chatId, chatType: 'group' },
      { ...data },
    );
    m = null;
    m = (await ChatModel.aggregate(
      [{ $match: { _id: new mongoose.Types.ObjectId(chatId) } }, ...findUserpipeline({})]
    ))[0];
    // console.log(m)
    this.io.emit(`updateChat/${chatId}`, m)
    m.participants.forEach(async (e) => {
      if (e.status == 'active')
      // this.io.emit(`getChats/${e.userId.toString()}`, await this.getChats(e.userId))
      await this.getChats(e.userId)
    })
    return m;
  }
  async updateAllChat() {
    return await ChatModel.updateMany({}, { isChatSupport: false, isTicketClosed: false })
  }
  async updateMuteStatus(data){
    const chat =await ChatModel.findOne({_id:data.chatId,'participants.userId':data.userId}).select('participants')
    chat.participants.forEach((e)=>{
      if(e.userId.toString()==data.userId)
        {e.isMuted = data.isMuted
          return;
        }
    })
    return await chat.save()
  }
  async updateBlockStatus(data){
    const chat =await ChatModel.findOne({_id:data.chatId,'participants.userId':data.userId}).select('participants')
    chat.participants.forEach((e)=>{
      if(e.userId.toString()==data.userId)
        {e.isBlocked = data.isBlocked
          return;
        }
    })
    if(this.io)
    this.io.emit(`updateBlockStatus/${data.userId}`,'user block status updated')
    return await chat.save()
  }
  async sendNotificationMsg(data,chat={}){
    const users = await findUsers({_id:data.userIds}).select('fcmToken _id')
    console.log(users)
    users.forEach((e)=>{
      sendNotification({title : data.title,body:data.body,fcmToken : e.fcmToken,data:{chatId:data.chatId,userId:e._id}})
    })
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
module.exports = ChatRepository;
