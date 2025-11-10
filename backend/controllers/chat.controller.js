// controllers/chat.controller.js

import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises"; // ✅ BẮT BUỘC: Để xóa file tạm sau khi upload (Khắc phục lỗi 500)

// Gửi tin nhắn text hoặc media
export const sendMessage = async (req, res) => {
  try {
    const sender = req.user._id;
    let { conversation, receiverId, text } = req.body;
    let mediaURL = null;
    let messageType = "text";

    // 🔹 Nếu chưa có conversation (tin nhắn đầu tiên)
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
      return res.status(400).json({ message: "Thiếu conversation hoặc receiverId" });
    }

    // 🔹 Upload media nếu có
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat_media",
        resource_type: "auto",
      });
      mediaURL = result.secure_url;
      await fs.unlink(req.file.path);

      const mime = req.file.mimetype;
      if (mime.startsWith("image/")) messageType = "image";
      else if (mime.startsWith("video/")) messageType = "video";
      else messageType = "file";
    }

    // 🔹 Tạo message
    const newMessage = await Message.create({
      conversation,
      sender,
      content: text || null,
      mediaURL,
      type: messageType,
      readBy: [sender],
    });

    // 🔹 Cập nhật latestMessage
    await Conversation.findByIdAndUpdate(conversation, {
      latestMessage: newMessage._id,
    });

    const populated = await newMessage.populate("sender", "username avatar");

    // 🔹 Emit realtime đến room
    req.io?.to(conversation.toString()).emit("receiveMessage", populated);

    res.status(201).json({
      message: populated,
      conversationId: conversation,
    });
  } catch (error) {
    console.error("❌ Lỗi gửi tin nhắn:", error);
    res.status(500).json({ message: error.message });
  }
};

// Đánh dấu tin nhắn đã đọc (Khắc phục lỗi 404 cho route /read)
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const result = await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json({
      message: "Tin nhắn đã được đánh dấu là đã đọc",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Lỗi đánh dấu tin nhắn đã đọc:", error);
    res.status(500).json({
      message: "Không thể đánh dấu tin nhắn đã đọc",
      error: error.message,
    });
  }
};

// ... (Các hàm getMessages, getConversations giữ nguyên)
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username avatar")
      .populate("conversation", "_id participants")
      .sort({ createdAt: -1 });
    console.log("Lấy tin nhắn cho convId:", conversationId);

    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lấy tin nhắn" });
  }
};

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
