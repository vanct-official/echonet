// routes/chat.routes.js

import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead, // ✅ IMPORT HÀM MỚI
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();
router.use(protect);

router.post("/message", upload.single("file"), sendMessage);
router.get("/messages/:conversationId", getMessages);
router.get("/conversations", getConversations);

// ✅ ROUTE MỚI: Đánh dấu tin nhắn đã đọc (Khắc phục lỗi 404)
router.post("/messages/:conversationId/read", markMessagesAsRead);

export default router;