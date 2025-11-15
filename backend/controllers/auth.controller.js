import User from "../models/user.model.js";
import OtpTemp from "../models/OtpTemp.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Register a new user
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

    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ message: "Username đã tồn tại" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email đã tồn tại" });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone)
      return res.status(400).json({ message: "Số điện thoại này đã tồn tại" });

    const today = new Date();
    if( today.getFullYear() - new Date(dob).getFullYear() < 13 ) {
      return res.status(400).json({ message: "Chưa đủ 13 tuổi" });
    }

    if (password.length < 8 || password.length > 20) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải từ 8 đến 20 ký tự" });
    } else if (!/[A-Z]/.test(password)) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải chứa ít nhất một chữ cái viết hoa" });
    } else if (!/[a-z]/.test(password)) {
      return res
        .status(400)
        .json({
          message: "Mật khẩu phải chứa ít nhất một chữ cái viết thường",
        });
    } else if (!/[0-9]/.test(password)) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải chứa ít nhất một chữ số" });
    } else if (!/[!@#$%^&*]/.test(password)) {
      return res
        .status(400)
        .json({
          message: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*)",
        });
    } else {
      console.log("Mật khẩu hợp lệ");
    }

    // Create OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chữ số
    const passwordHash = await bcrypt.hash(password, 10);

    // Save temp data
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

    // Send email OTP
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

// Confirm registration with OTP
export const confirmRegister = async (req, res) => {
  try {
    const { email, otp, firstname, lastname, phone, dob, gender } = req.body;

    const temp = await OtpTemp.findOne({ email, otp, purpose: "register" });
    if (!temp) return res.status(400).json({ message: "OTP không hợp lệ" });
    if (temp.expiresAt < new Date()) {
      await temp.deleteOne();
      return res.status(400).json({ message: "OTP đã hết hạn" });
    }

    // Create user
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

// Login user
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await user.matchPassword(password)) && user.isActive == true) {
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
    } else if (user.isActive == false) {
      // Check if account is disabled
      res
        .status(401)
        .json({
          message:
            "Tài khoản của bạn đã bị đình chỉ, hãy liên hệ admin qua email: vanctquantrivien@gmail.com. Trân trọng!",
        });
    } else {
      // Invalid credentials
      res.status(401).json({ message: "Nhập sai tên đăng nhập và mật khẩu. Vui lòng nhập lại!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Request password reset (send OTP)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản với email này" });

    // Create OTP with 6 digits
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTPs for this email
    await OtpTemp.deleteMany({ email, purpose: "forgot-password" });

    // Save new OTP temp record
    await OtpTemp.create({
      email,
      otp,
      purpose: "forgot-password",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // hết hạn sau 10 phút
    });

    // Send email with OTP
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

// Verify OTP for password reset
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OtpTemp.findOne({
      email,
      otp,
      purpose: "forgot-password",
    });

    if (!record) return res.status(400).json({ message: "OTP không hợp lệ" });

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

// Reset new password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check OTP
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

    // Find user
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Update password
    user.passwordHash = newPassword;
    if( newPassword.length < 8 || newPassword.length > 20) {
      return  res.status(400).json({ message: "Mật khẩu phải từ 8 đến 20 ký tự" });
    } else if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất một chữ cái viết hoa" });
    } else if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất một chữ cái viết thường" });
    } else if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất một chữ số" });
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*)" });
    } else {
      console.log("Mật khẩu hợp lệ");
    }

    await user.save();

    // Delete temp OTP record
    await temp.deleteOne();

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let { firstname, lastname, phone, dob, gender, bio } = req.body;
    if (typeof gender === "string") gender = gender === "true";

    // Update fields
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (phone) user.phone = phone;
    if (dob) user.dob = dob;
    if (bio) user.bio = bio;
    if (gender !== undefined) user.gender = gender;

    // If there is a file (avatar) to upload
    if (req.file) {
      console.log("REQ FILE:", req.file);

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "avatars",
            width: 400,
            height: 400,
            crop: "fill",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      user.avatar = uploadResult.secure_url;
      console.log("✅ Uploaded avatar:", uploadResult.secure_url);
    }

    await user.save();

    res.json({
      message: "Cập nhật hồ sơ thành công",
      user,
    });
  } catch (error) {
    console.error("❌ updateProfile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }
    user.passwordHash = newPassword;
    if( newPassword.length < 8 || newPassword.length > 20) {
      return  res.status(400).json({ message: "Mật khẩu phải từ 8 đến 20 ký tự" });
    } else if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất một chữ cái viết hoa" });
    } else if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất một chữ cái viết thường" });
    } else if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất một chữ số" });
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*)" });
    } else {
      console.log("Mật khẩu hợp lệ");
    }
    await user.save();
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error("❌ changePassword error:", error);
    res.status(500).json({ message: "Server error" });
  }
};