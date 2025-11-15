import express from "express";
import {
  getNotifications,
  getMyNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/me", getMyNotifications);
router.get("/:userId", getNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markAsRead);
router.patch("/mark-all-read", markAllAsRead);
router.delete("/:id", deleteNotification);

export default router;
