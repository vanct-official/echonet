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

      // ✅ Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Lấy user và gắn vào request
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      return next();
    }

    // ❌ Không có token
    return res.status(401).json({ message: "Not authorized, no token" });
  } catch (error) {
    console.error("JWT Error:", error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
