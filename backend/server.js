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

  // join room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // handle sending messages
  socket.on("sendMessage", ({ roomId, message, senderId }) => {
    io.to(roomId).emit("receiveMessage", {
      message,
      senderId,
      timestamp: new Date(),
    });
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
