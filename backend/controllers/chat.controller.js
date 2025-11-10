// controllers/chat.controller.js

import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../config/cloudinary.js"; 
import fs from 'fs/promises'; // ✅ BẮT BUỘC: Để xóa file tạm sau khi upload (Khắc phục lỗi 500)

// Gửi tin nhắn text hoặc media
export const sendMessage = async (req, res) => {
    let mediaURL = null;
    let messageType = "text"; 
    
    try {
        const sender = req.user._id; 
        const { conversation, text } = req.body; 
        
        // 1. Xử lý Upload file nếu tồn tại
        if (req.file) {
            console.log("Đang upload file:", req.file.originalname);
            
            // Upload lên Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "chat_media",
                resource_type: "auto",
            });
            mediaURL = result.secure_url;

            // Xóa file tạm thời ngay sau khi upload thành công
            await fs.unlink(req.file.path); 
            
            // XÁC ĐỊNH TYPE DỰA TRÊN MIME TYPE
            const mimeType = req.file.mimetype;
            if (mimeType.startsWith('image/')) {
                messageType = 'image';
            } else if (mimeType.startsWith('video/')) {
                messageType = 'video';
            } else {
                messageType = 'file'; // Tài liệu khác
            }
        }

        // 2. Kiểm tra dữ liệu
        if (!conversation || (!text && !mediaURL)) {
            return res.status(400).json({ message: "Thiếu ID cuộc trò chuyện hoặc nội dung tin nhắn" });
        }

        // 3. Tạo tin nhắn mới
        const newMessage = await Message.create({
            conversation,
            sender, 
            content: text || null, 
            mediaURL: mediaURL,
            type: messageType,
            readBy: [sender],
        });

        // 4. Cập nhật latestMessage
        await Conversation.findByIdAndUpdate(conversation, {
            latestMessage: newMessage._id,
        });

        // 5. Populate và trả về kết quả
        const populated = await newMessage.populate("sender", "username avatar");
        res.status(201).json(populated);
    } catch (error) {
        // 6. Xử lý lỗi và dọn dẹp file tạm (quan trọng cho lỗi 500)
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (err) {
                console.error("Lỗi khi xóa file tạm:", err);
            }
        }
        console.error("❌ Lỗi gửi tin nhắn:", error);
        res
            .status(500)
            .json({ 
                message: "Không thể gửi tin nhắn. Vui lòng kiểm tra Cloudinary credentials.", 
                error: error.message 
            });
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
            modifiedCount: result.modifiedCount 
        });
    } catch (error) {
        console.error("❌ Lỗi đánh dấu tin nhắn đã đọc:", error);
        res.status(500).json({ message: "Không thể đánh dấu tin nhắn đã đọc", error: error.message });
    }
};

// ... (Các hàm getMessages, getConversations giữ nguyên)
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