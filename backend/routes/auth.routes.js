import express from "express";
import { registerRequest, confirmRegister, loginUser, forgotPassword, verifyResetOtp, resetPassword } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerRequest); // gửi OTP
router.post("/confirm", confirmRegister); // xác nhận OTP
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

export default router;
