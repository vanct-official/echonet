import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../config/cloudinary.js"; // config Cloudinary

// Gửi tin nhắn text hoặc media (ĐÃ SỬA LỖI)
export const sendMessage = async (req, res) => {
  try {
    // 1. ✅ Lấy sender từ req.user (đã được middleware protect xác thực)
    const sender = req.user._id; 
    
    // 2. Lấy conversation, text, và type từ req.body
    // CHÚ Ý: Giả định frontend gửi trường 'text' thay vì 'content'
    const { conversation, text, type } = req.body; 
    let mediaURL = null;

    // Upload file lên Cloudinary nếu có (giữ nguyên logic)
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat_media",
        resource_type: "auto",
      });
      mediaURL = result.secure_url;
    }

    // 3. ✅ Kiểm tra dữ liệu: Phải có ID conversation và phải có nội dung (text) hoặc file (mediaURL)
    if (!conversation || (!text && !mediaURL)) {
      return res.status(400).json({ message: "Thiếu ID cuộc trò chuyện hoặc nội dung tin nhắn" });
    }

    const newMessage = await Message.create({
      conversation,
      sender, // ✅ Dùng sender đã xác thực
      content: text || null, // ✅ Dùng 'text' từ frontend làm 'content'
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
