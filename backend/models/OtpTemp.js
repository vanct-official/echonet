import mongoose from "mongoose";

const otpTempSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    username: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    phone: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: Boolean, required: true },
    password: { type: String, required: true }, // lưu password đã hash
    otp: { type: String, required: true }, // 6 chữ số
    expiresAt: { type: Date, required: true }, // thời gian hết hạn OTP
  },
  { timestamps: true }
);

const OtpTemp = mongoose.model("OtpTemp", otpTempSchema);

export default OtpTemp;
