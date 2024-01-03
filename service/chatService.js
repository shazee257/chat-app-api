const { validation } = require("../middlewares/validationMiddleware");
const ChatRepository = require("../repositories/chatRepository");
const { uploadToS3 } = require("../utils/s3Upload");
const { chatValidation } = require("../validation/chatValidation");
const { socketIO } = require('./supportService');

let clients = {};

module.exports = (io) => {
  console.log("listening chats");
  io.on("connection", async (socket) => {
    console.log("new client connected");
    const chatRepository = new ChatRepository(io);
    socket.on("request", async (data) => {
      console.log("request function executed");
      console.log(clients);
      clients[data.userId] = socket.id;
      await chatRepository.getChats(data.userId, data.page ?? 0, 20, data.chatSupport ?? false);
    });
    socket.on("getChatMessages", async (data) => {
      console.log("request function executed");
      console.log(clients);
      clients[data.userId] = socket.id;
      await chatRepository.getChatMessages(
        data.chatId,
        data.userId,
        data.page ?? 0
      );
    });

    socket.on("sendMessage", async (data) => {
      try {
        // console.log(await validation(chatValidation, true)({ body: data }))
        const validator = await validation(chatValidation, true)({ body: data })
        if (validator) {
          console.log(data)
          await chatRepository.createMessage(
            data.chatId,
            data.userId,
            data.messageBody, data.mediaUrls, data.name
          );
        } else throw validator;
      } catch (error) {
        console.error("Error while sending chat:", error);
        socket
          .emit(`error/${data.userId}`, "validation error while sending chat");
      }
    });
    socket.on('deleteMessages', async (data) => {
      console.log('deleteMessages executed')
      await chatRepository.deleteAllMessage(data.chatId, data.userId)
    });

    socket.on('deleteSelectedMessages', async (data) => {
      console.log('deleteSelectedMessages executed')
      await chatRepository.deleteSelectedMessage(data.chatId, data.userId)
    });

    socket.on('readMessages', async (data) => {
      await chatRepository.readAllMessages(data.chatId, data.userId)
    });

    socket.on('updateBlockStatus', async (data) => {
      await chatRepository.updateBlockStatus(data)
    });

    // socket.on('addParticipants', async (data) => {
    //   await chatRepository.addParticipants(data.chatId, data.userId, data.participantIds)
    // })
    // socket.on('removeParticipants', async (data) => {
    //   await chatRepository.removeParticipants(data.chatId,/*data.userId,*/data.participantIds)
    // })
    // socket.on('addAdmins', async (data) => {
    //   await chatRepository.addAdmins(data.chatId, data.userId, data.adminIds)
    // })
    // socket.on('removeAdmins', async (data) => {
    //   await chatRepository.removeAdmins(data.chatId, data.userId, data.adminIds)
    // })

    socket.on('createChat', async (data) => {
      await chatRepository.createChat(data.userId, data.participantIds, data.chatType, data.groupName)
    });

    socket.on('updateChat', async (data) => {
      let images;
      if (data.groupImage) {
        images = await uploadToS3([data.groupImage], true)
      }
      await chatRepository.updateChat(data.chatId, data.groupName, data.groupImage ? images[0] : null)
    });

    socket.on('closeChatSupportTicket', async (data) => {
      await chatRepository.closeChatSupport(data.chatId, data.userId)
    });

    socket.on('createChatSupport', async (data) => {
      let images;
      if (data.groupImage) {
        images = await uploadToS3([data.groupImage], true)
      }
      await chatRepository.createChatSupport(data.userId, data.topic)
    });

    socket.on('declineCall', (data) => {
      io.emit(`declineCall/${data.chatId}`, data)
    });

    require('./chatSupportService')(socket);
    socketIO(socket);

    socket.on("disconnect", () => {
      // delete clients[socket.id];
      // console.log(clients);
      console.log("A user disconnected.");
    });

  });
};
