import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();
const app = express();

// middleware
app.use(express.json());

// CORS config
const allowedOrigins = [process.env.FRONTEND_ROUTE];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

// create HTTP server
const httpServer = createServer(app);

// setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ROUTE,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// socket.io events
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  // ✅ SỬA: join conversation
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // ✅ SỬA: handle sending messages - Nhận đối tượng message đã populated
  socket.on("sendMessage", (message) => {
    const roomId = message.conversation; 
    
    // Phát tin nhắn này cho tất cả client trong room đó (trừ người gửi)
    socket.to(roomId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// connect MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("======= MongoDB connected =======");
    httpServer.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error(err));
