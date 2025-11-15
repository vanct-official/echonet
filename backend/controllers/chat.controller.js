import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises";
import streamifier from "streamifier";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const sender = req.user._id;
    let { conversation, receiverId, text } = req.body;
    let mediaURL = null;
    let messageType = "text";

    // Check if there's content to send
    if (!text?.trim() && !req.file) {
      return res
        .status(400)
        .json({ message: "Không có nội dung tin nhắn hoặc file đính kèm." });
    }

    // If no conversation ID is provided, find or create a conversation
    if (!conversation && receiverId) {
      let existingConv = await Conversation.findOne({
        participants: { $all: [sender, receiverId] },
      });

      if (!existingConv) {
        existingConv = await Conversation.create({
          participants: [sender, receiverId],
        });
        console.log("🆕 Tạo mới conversation:", existingConv._id);
      }
      conversation = existingConv._id;
    }

    if (!conversation && !receiverId) {
      return res
        .status(400)
        .json({ message: "Thiếu conversation hoặc receiverId." });
    }

    // Upload media to Cloudinary if file is present
    if (req.file) {
      console.log("📤 Uploading file:", req.file.originalname);

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "chat_media",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      mediaURL = uploadResult.secure_url;

      const mime = req.file.mimetype;
      if (mime.startsWith("image/")) messageType = "image";
      else if (mime.startsWith("video/")) messageType = "video";
      else messageType = "file";

      console.log("✅ Uploaded:", mediaURL);
    }

    // Save the message
    const newMessage = await Message.create({
      conversation,
      sender,
      content: text?.trim() || (mediaURL ? `Đã gửi ${messageType}` : null),
      mediaURL,
      type: messageType,
      readBy: [sender],
    });

    // Update latestMessage in Conversation
    await Conversation.findByIdAndUpdate(conversation, {
      latestMessage: newMessage._id,
    });

    // Populate sender info
    const populated = await Message.findById(newMessage._id).populate(
      "sender",
      "username avatar"
    );

    // Emit the new message via Socket.io
    req.io?.to(conversation.toString()).emit("receiveMessage", populated);

    // Respond with the new message
    res.status(201).json(populated);
  } catch (error) {
    console.error("❌ Lỗi gửi tin nhắn:", error);
    res.status(500).json({
      message: error.message || "Lỗi máy chủ nội bộ khi gửi tin nhắn",
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username avatar")
      .populate("conversation", "_id participants")
      .sort({ createdAt: 1 });
    console.log("Lấy tin nhắn cho convId:", conversationId);

    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lấy tin nhắn" });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn." });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa tin nhắn này." });
    }

    message.isDeleted = true;
    message.content = "Tin nhắn đã được xóa";
    message.mediaURL = null;
    await message.save();

    const conversation = await Conversation.findById(message.conversation);
    if (
      conversation &&
      conversation.latestMessage &&
      conversation.latestMessage.toString() === messageId
    ) {
      const newLatestMessage = await Message.findOne({
        conversation: message.conversation,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(1);

      conversation.latestMessage = newLatestMessage
        ? newLatestMessage._id
        : messageId; // giữ nguyên nếu không còn message nào
      await conversation.save();
    }

    req.io?.to(message.conversation.toString()).emit("messageDeleted", {
      messageId,
      conversationId: message.conversation,
      content: "Tin nhắn đã được xóa",
    });

    res.status(200).json({
      message: "Tin nhắn đã được cập nhật trạng thái xóa.",
      messageId,
    });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái xóa:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const updateResult = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    res.status(200).json({ modifiedCount: updateResult.modifiedCount });
  } catch (error) {
    console.error("Lỗi đánh dấu đã đọc:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// Get conversations for the logged-in user
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username avatar" },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lấy conversation" });
  }
};

// Get messages sent by the logged-in user
export const getMyMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({ sender: userId })
      .populate("sender", "username avatar")
      .populate({
        path: "conversation",
        select: "_id participants",
        populate: { path: "participants", select: "username avatar" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Lỗi khi lấy tin nhắn của chính người dùng:", error);
    res.status(500).json({ message: "Không thể lấy tin nhắn của bạn" });
  }
};

// Update a message
export const updateMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { newContent } = req.body;

    if (typeof newContent !== "string") {
      return res
        .status(400)
        .json({ message: "Nội dung phải là chuỗi văn bản." });
    }

    const text = newContent.trim();

    if (!text) {
      return res.status(400).json({ message: "Nội dung mới không hợp lệ." });
    }

    if (!text) {
      return res.status(400).json({ message: "Nội dung mới không hợp lệ." });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn." });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không thể sửa tin nhắn của người khác." });
    }

    message.content = text;
    await message.save();

    req.io?.to(message.conversation.toString()).emit("updateMessage", {
      _id: messageId,
      content: message.content,
    });

    res
      .status(200)
      .json({ message: "Đã cập nhật tin nhắn.", updatedMessage: message });
  } catch (error) {
    console.error("❌ Lỗi update tin nhắn:", error);
    res.status(500).json({ message: error.message || "Lỗi máy chủ nội bộ" });
  }
};
