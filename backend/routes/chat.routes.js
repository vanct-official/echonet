// routes/chat.routes.js

import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead, // ✅ IMPORT HÀM MỚI
  getMyMessages,
deleteMessage,
updateMessage,  // 🆕 IMPORT HÀM MỚI
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();
router.use(protect);

router.post("/message", upload.single("file"), sendMessage);

// 🆕 Route cập nhật tin nhắn
router.put("/messages/:messageId", protect, updateMessage); // Cập nhật trạng thái đã đọc cho tin nhắn cụ thể

// 🆕 Route xóa tin nhắn
router.delete("/messages/:messageId",protect, deleteMessage);

// 🆕 Route mới để lấy tin nhắn của chính người dùng
router.get("/messages/mine", getMyMessages);
router.get("/messages/:conversationId", getMessages);
router.get("/conversations", getConversations);

// ✅ ROUTE MỚI: Đánh dấu tin nhắn đã đọc (Khắc phục lỗi 404)
router.post("/messages/:conversationId/read", markMessagesAsRead);


export default router;