import User from "../models/user.model.js";
import OtpTemp from "../models/OtpTemp.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerRequest = async (req, res) => {
  try {
    const { firstname, lastname, username, email, phone, password, dob, gender } =
      req.body;

    // Kiểm tra trùng email/username
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email đã tồn tại" });

    // Tạo OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chữ số
    const passwordHash = await bcrypt.hash(password, 10);

    // Lưu tạm
    const temp = await OtpTemp.create({
      email,
      username,
      firstname,
      lastname,
      dob,
      phone,
      gender,
      password,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
    });

    // Gửi email OTP
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "OTP xác nhận đăng ký",
      text: `Mã OTP của bạn là: ${otp}`,
    });

    res.json({ message: "OTP đã được gửi tới email của bạn" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Xác thực Đăng ký
export const confirmRegister = async (req, res) => {
  try {
    const { email, otp, firstname, lastname, phone, dob, gender } = req.body;

    const temp = await OtpTemp.findOne({ email, otp });
    if (!temp) return res.status(400).json({ message: "OTP không hợp lệ" });
    if (temp.expiresAt < new Date()) {
      await temp.deleteOne();
      return res.status(400).json({ message: "OTP đã hết hạn" });
    }

    // Tạo user chính thức
    const user = await User.create({
      username: temp.username,
      email: temp.email,
      phone: temp.phone, // nếu lưu trong temp
      passwordHash: temp.password, // đã hash ở bước registerRequest
      firstname: temp.firstname,
      lastname: temp.lastname,
      dob: temp.dob,
      gender: temp.gender,
    });

    await temp.deleteOne(); // xóa tạm

    res.status(201).json({ message: "Đăng ký thành công", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
