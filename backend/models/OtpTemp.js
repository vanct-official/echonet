import mongoose from "mongoose";

const otpTempSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    username: { type: String},
    firstname: { type: String},
    lastname: { type: String},
    phone: { type: String},
    dob: { type: Date},
    gender: { type: Boolean},
    password: { type: String}, // lưu password đã hash
    otp: { type: String, required: true }, // 6 chữ số
    expiresAt: { type: Date, required: true }, // thời gian hết hạn OTP
    purpose: {
      type: String,
      enum: ["register", "forgot-password"],
      required: true,
    },
  },
  { timestamps: true }
);

const OtpTemp = mongoose.model("OtpTemp", otpTempSchema);

export default OtpTemp;
