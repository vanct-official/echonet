import express from "express";
import { registerRequest, confirmRegister, loginUser, forgotPassword, verifyResetOtp, resetPassword, updateProfile } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/register", registerRequest); // gửi OTP
router.post("/confirm", confirmRegister); // xác nhận OTP
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
router.put("/edit-profile", protect, updateProfile);

export default router;
