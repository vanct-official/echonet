import express from "express";
import {
  getPosts,
  getMyPosts,
  createPost,
  toggleLike,
  addComment,
  updatePost,
  deletePost, 
  getDraftPosts,
  publishPost,
  repostPost,
  getUserPosts,
} from "../controllers/post.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js"; // middleware JWT
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Lấy tất cả post (public)
router.get("/", getPosts);

// Lấy tất cả bài đăng của tôi
router.get("/me", protect, getMyPosts);

// Lấy bài đăng của người dùng khác
router.get("/user/:id", protect, getUserPosts);

// Tạo post mới (phải login)
router.post("/", protect, upload.array("images", 5), createPost);

// Like/unlike post
router.put("/:id/like", protect, toggleLike);

// Comment
router.post("/:id/comment", protect, addComment);

// Cập nhật bài viết
router.put("/:id", protect, upload.array("media", 10), updatePost);

//Lấy danh sách bài nháp của tôi
router.get("/drafts", protect, getDraftPosts);

//Đăng bài từ nháp
router.put("/:id/publish", protect, publishPost);

// Xoá bài viết (chỉ chủ bài hoặc admin) - có thể thêm sau
router.delete("/:id", protect, deletePost);

// Repost bài viết
router.post("/:id/repost", protect, repostPost);

// ✅ Route cho admin - có bảo vệ
router.get("/admin/all", protect, adminOnly, getPosts);

// 🟢 Repost (hoặc Quote Repost)
router.post("/:id/repost", repostPost);

export default router;
