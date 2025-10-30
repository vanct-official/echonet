import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();
router.use(protect);

router.post("/message", upload.single("media"), sendMessage);
router.get("/messages/:conversationId", getMessages);
router.get("/conversations", getConversations);

export default router;
