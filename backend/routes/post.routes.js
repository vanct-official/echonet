import express from "express";
import {
  getPosts,
  getMyPosts,
  createPost,
  toggleLike,
  getLikes,
  addComment,
  updatePost,
  deletePost, 
  getDraftPosts,
  publishPost,
  repostPost,
  getUserPosts,
  reportPost,
  getPostReports,
  getAllPostsForAdmin
} from "../controllers/post.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js"; // middleware JWT
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// 🟢 Route đặc biệt phải đặt trước /:id hoặc /
router.get("/me", protect, getMyPosts);
router.get("/drafts", protect, getDraftPosts);
router.get("/admin/all", protect, adminOnly, getPosts);

// 🔵 Các route còn lại
router.get("/", protect, getPosts);
router.get("/user/:id", protect, getUserPosts);

router.post("/", protect, upload.array("images", 5), createPost);
router.put("/:id/like", protect, toggleLike);
router.get("/:id/likes", getLikes);
router.post("/:id/comment", protect, addComment);
router.put("/:id", protect, upload.array("media", 10), updatePost);
router.put("/:id/publish", protect, publishPost);
router.delete("/:id", protect, deletePost);
router.post("/:id/repost", protect, repostPost);
router.post("/:id/report", protect, reportPost);
router.get("/:id/reports", protect, getPostReports);
router.get("/admin/all", protect, adminOnly, getAllPostsForAdmin);


export default router;

