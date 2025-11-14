// controllers/chat.controller.js

import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../config/cloudinary.js"; // Giả định file này export default cloudinary.v2
import fs from "fs/promises"; // Bắt buộc để xóa file tạm
import streamifier from "streamifier";

/* -------------------------------------------------------------------------- */
/* 🟢 GỬI TIN NHẮN (MESSAGE) */
/* -------------------------------------------------------------------------- */

export const sendMessage = async (req, res) => {
  try {
    const sender = req.user._id;
    let { conversation, receiverId, text } = req.body;
    let mediaURL = null;
    let messageType = "text";

    // 1️⃣ Kiểm tra hợp lệ
    if (!text?.trim() && !req.file) {
      return res
        .status(400)
        .json({ message: "Không có nội dung tin nhắn hoặc file đính kèm." });
    }

    // 2️⃣ Nếu chưa có conversation → tạo mới
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

    // 3️⃣ Upload file lên Cloudinary nếu có
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

    // 4️⃣ Lưu message vào DB
    const newMessage = await Message.create({
      conversation,
      sender,
      content: text?.trim() || (mediaURL ? `Đã gửi ${messageType}` : null),
      mediaURL,
      type: messageType,
      readBy: [sender],
    });

    // 5️⃣ Cập nhật latestMessage
    await Conversation.findByIdAndUpdate(conversation, {
      latestMessage: newMessage._id,
    });

    // 6️⃣ Populate và gửi realtime
    const populated = await Message.findById(newMessage._id).populate(
      "sender",
      "username avatar"
    );

    // Gửi đến các client trong cùng conversation (ngoại trừ sender)
    req.io?.to(conversation.toString()).emit("receiveMessage", populated);

    // 7️⃣ Trả về kết quả cho client
    res.status(201).json(populated);
  } catch (error) {
    console.error("❌ Lỗi gửi tin nhắn:", error);
    res
      .status(500)
      .json({
        message: error.message || "Lỗi máy chủ nội bộ khi gửi tin nhắn",
      });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 LẤY TIN NHẮN (GET MESSAGES) */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* 🆕 XÓA TIN NHẮN (DELETE MESSAGE) */
/* -------------------------------------------------------------------------- */

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    // 1. Tìm tin nhắn
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn." });
    }

    // 2. Kiểm tra quyền: Chỉ người gửi mới được xóa
    if (message.sender.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa tin nhắn này." });
    }

    // 3. Xóa tin nhắn
    await Message.deleteOne({ _id: messageId });

    // 4. Cập nhật latestMessage của Conversation (nếu tin nhắn bị xóa là tin nhắn mới nhất)
    const conversation = await Conversation.findById(message.conversation);
    if (
      conversation &&
      conversation.latestMessage &&
      conversation.latestMessage.toString() === messageId
    ) {
      // Tìm tin nhắn mới nhất còn lại trong conversation
      const newLatestMessage = await Message.findOne({
        conversation: message.conversation,
      })
        .sort({ createdAt: -1 })
        .limit(1);

      conversation.latestMessage = newLatestMessage
        ? newLatestMessage._id
        : null;
      await conversation.save();
    }

    // 5. Emit sự kiện Socket thông báo tin nhắn đã bị xóa
    req.io
      ?.to(message.conversation.toString())
      .emit("deleteMessage", messageId);

    res.status(200).json({ message: "Tin nhắn đã được xóa thành công." });
  } catch (error) {
    console.error("❌ Lỗi xóa tin nhắn:", error);
    res.status(500).json({ message: error.message || "Lỗi máy chủ nội bộ" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 ĐÁNH DẤU ĐÃ ĐỌC (MARK AS READ) */
/* -------------------------------------------------------------------------- */

export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    // Chỉ cập nhật trạng thái đọc cho các tin nhắn đã gửi đi không phải bởi người dùng hiện tại
    const updateResult = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId }, // Tin nhắn không phải của mình
        readBy: { $ne: userId }, // Chưa có trong danh sách đã đọc
      },
      {
        $addToSet: { readBy: userId }, // Thêm userId vào mảng readBy
      }
    );

    res.status(200).json({ modifiedCount: updateResult.modifiedCount });
  } catch (error) {
    console.error("Lỗi đánh dấu đã đọc:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// ... (Các hàm getConversations, getMyMessages khác nếu có)

// Lấy danh sách conversation
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

// Lấy tin nhắn của chính người dùng
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

/* -------------------------------------------------------------------------- */
/* 🟡 CẬP NHẬT NỘI DUNG TIN NHẮN (UPDATE MESSAGE) */
/* -------------------------------------------------------------------------- */

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
