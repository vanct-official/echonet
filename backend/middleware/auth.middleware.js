import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  let token;
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("_id username role");
      console.log("🟢 Decoded:", decoded);
      console.log("🟢 Found user:", user);

      if (!user) {
        return res.status(401).json({ message: "User not found for token" });
      }

      req.user = user;
      return next();
    }

    return res.status(401).json({ message: "Not authorized, no token" });
  } catch (error) {
    console.error("JWT Error:", error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};


// ✅ Middleware dành riêng cho Admin (dùng cho route đặc biệt)
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Chỉ admin mới được phép thực hiện hành động này" });
  }
};