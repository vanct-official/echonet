import express from "express";
import {
  getUserConversations,
  createConversation,
} from "../controllers/conversation.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // middleware JWT

const router = express.Router();

router.get("/", protect, getUserConversations);
router.post("/", protect, createConversation);

export default router;
