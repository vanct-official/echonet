import express from "express";
import { registerRequest, confirmRegister, loginUser } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerRequest); // gửi OTP
router.post("/confirm", confirmRegister); // xác nhận OTP
router.post("/login", loginUser);

export default router;
