import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMyProfile,
  getUserProfile,
  followUser,
  unfollowUser,
  searchUsers,
  getAllUsers,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", searchUsers);
router.get("/me", protect, getMyProfile);
router.get("/all", getAllUsers)
router.get("/:idOrUsername", protect, getUserProfile);
router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);


export default router;
