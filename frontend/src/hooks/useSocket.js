import { useEffect, useRef } from "react";
import io from "socket.io-client";

const SOCKET_IO_URL = import.meta.env.VITE_SOCKET_IO_URL;

export const useSocket = (roomId, onReceiveMessage) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_IO_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"], // Đảm bảo hoạt động trên nhiều môi trường
    });

    socketRef.current.on("connect", () => {
      console.log("Socket.IO connected");
      if (roomId) {
        socketRef.current.emit("joinRoom", roomId);
      }
    });

    socketRef.current.on("receiveMessage", (message) => {
      console.log("Received message via socket:", message);
      onReceiveMessage(message);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("Socket.IO disconnected on cleanup");
      }
    };
  }, [roomId, onReceiveMessage]); // Re-run if roomId or onReceiveMessage changes

  const sendMessageSocket = (roomId, message, senderId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("sendMessage", { roomId, message, senderId });
    } else {
      console.warn("Socket not connected, cannot send message via socket.");
    }
  };

  return { sendMessageSocket };
};
