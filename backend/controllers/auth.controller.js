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
    const {
      firstname,
      lastname,
      username,
      email,
      phone,
      password,
      dob,
      gender,
    } = req.body;

    // Kiểm tra trùng email/username
    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ message: "Username đã tồn tại" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email đã tồn tại" });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ message: "Số điện thoại này đã tồn tại" });

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
      purpose: "register",
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

    const temp = await OtpTemp.findOne({ email, otp, purpose: "register" });
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
        user: {
          _id: user._id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
        token: generateToken(user._id),
      });
    } else if(user.isActive == false) { // Check if account is disabled
      res.status(401).json({ message: "Tài khoản của bạn đã bị đình chỉ, hãy liên hệ admin qua email: vanctquantrivien@gmail.com. Trân trọng!" });
    } else { // Invalid credentials
      res.status(401).json({ message: "Invalid email or password" });
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Yêu cầu đặt lại mật khẩu (Gửi OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy tài khoản với email này" });

    // Tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Xóa OTP cũ nếu có
    await OtpTemp.deleteMany({ email, purpose: "forgot-password" });

    // Lưu OTP mới
    await OtpTemp.create({
      email,
      otp,
      purpose: "forgot-password",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // hết hạn sau 10 phút
    });

    // Gửi email OTP
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Mã OTP đặt lại mật khẩu",
      text: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 10 phút.`,
    });

    res.json({ message: "OTP đã được gửi tới email của bạn" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Đặt lại mật khẩu (khi nhập OTP hợp lệ)
// @desc    Xác thực OTP để đặt lại mật khẩu
// @route   POST /api/auth/verify-reset-otp
// @access  Public
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OtpTemp.findOne({ email, otp, purpose: "forgot-password" });

    if (!record)
      return res.status(400).json({ message: "OTP không hợp lệ" });

    if (record.expiresAt < new Date()) {
      await record.deleteOne();
      return res.status(400).json({ message: "OTP đã hết hạn" });
    }

    res.json({ message: "Xác thực OTP thành công", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Đặt lại mật khẩu mới
// @route   POST /api/auth/reset-password
// @access  Public
// @desc    Đặt lại mật khẩu sau khi nhập OTP hợp lệ
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1️⃣ Kiểm tra OTP
    const temp = await OtpTemp.findOne({
      email,
      otp,
      purpose: "forgot-password",
    });
    if (!temp) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    if (temp.expiresAt < new Date()) {
      await temp.deleteOne();
      return res.status(400).json({ message: "OTP đã hết hạn" });
    }

    // 2️⃣ Tìm user thật
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // 3️⃣ Cập nhật mật khẩu mới (middleware sẽ tự hash)
    user.passwordHash = newPassword;
    await user.save();

    // 4️⃣ Xóa OTP tạm
    await temp.deleteOne();

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


