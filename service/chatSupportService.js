const { validation } = require("../middlewares/validationMiddleware");
const { chatSupportModel } = require("../models/chatSupportModel");
const ChatSupportRepository = require("../repositories/chatSupportRepository");
const { chatSupportValidation } = require("../validation/chatSupportValidation");
let clients = {};

module.exports = (socket) => {
  console.log("Listening chat support");
  //io.on("connection", async (socket) => {
    console.log("New client connected");
    const chatSupportRepository = new ChatSupportRepository(socket);

    socket.on("getSupportChats", async (data) => {
      console.log("request function executed");
      console.log(clients);
      clients[data.userId] = socket.id;
      await chatSupportRepository.getSupportChats(data.userId, data.page ?? 0, 20, data.chatSupport ?? false);
    });

    socket.on("getChatSupportMessages", async (data) => {
      console.log("request function executed");
      console.log(clients);
      clients[data.userId] = socket.id;
      await chatSupportRepository.getChatSupportMessages(
        data.chatId,
        data.userId,
        data.page ?? 0
      );
    });

    socket.on("createSupportMessage", async (data) => {
      try {
        const validator = await validation(chatSupportValidation, true)({ body: data })
        if (validator) {
          console.log("data:", data)
          await chatSupportRepository.createSupportMessage(
            data.chatId,
            data.senderId,
            data.messageBody, data.urls, data.name
          );
        } else throw validator;
      } catch (error) {
        console.error("Error while sending chat:", error);
        socket
          .emit(`error/${data.senderId}`, "validation error while sending chat");
      }
    });

    socket.on('deleteAllSupportMessages', async (data) => {
      console.log('deleteMessages executed')
      await chatSupportRepository.deleteAllSupportMessages(data.chatId, data.userId)
    })

    socket.on('createChatForSupport', async (data) => {
      console.log("Function executed");
      let images;
      if (data.groupImage) {
        images = await uploadToS3([data.groupImage], true)
      }
      await chatSupportRepository.createChatForSupport(data.userId, data.topic)
    })

    socket.on('closeChatSupport', async (data) => {
      await chatSupportRepository.closeChatSupport(data.chatId, data.userId)
    })



    // Other socket.io events and methods specific to chat support can be added here
    // socket.on('event_name', async (data) => {
    //   // Handle the event
    // });

    socket.on("disconnect", () => {
      console.log("A user disconnected.");
    });
  //});
};