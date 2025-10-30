import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../config/cloudinary.js"; // config Cloudinary

// Gửi tin nhắn text hoặc media
export const sendMessage = async (req, res) => {
  try {
    const { conversation, sender, content, type } = req.body;
    let mediaURL = null;

    // Upload file lên Cloudinary nếu có
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat_media",
        resource_type: "auto",
      });
      mediaURL = result.secure_url;
    }

    if (!conversation || !sender || (!content && !mediaURL)) {
      return res.status(400).json({ message: "Thiếu dữ liệu gửi tin nhắn" });
    }

    const newMessage = await Message.create({
      conversation,
      sender,
      content: content || null,
      mediaURL,
      type: mediaURL ? "image" : type || "text",
      readBy: [sender],
    });

    await Conversation.findByIdAndUpdate(conversation, {
      latestMessage: newMessage._id,
    });

    const populated = await newMessage.populate("sender", "username avatar");
    res.status(201).json(populated);
  } catch (error) {
    console.error("❌ Lỗi gửi tin nhắn:", error);
    res
      .status(500)
      .json({ message: "Không thể gửi tin nhắn", error: error.message });
  }
};

// Lấy tin nhắn theo conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lấy tin nhắn" });
  }
};

// Lấy danh sách conversation của user
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
