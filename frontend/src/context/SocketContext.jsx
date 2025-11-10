// src/context/SocketContext.js
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
  const newSocket = io("http://localhost:5000", { withCredentials: true });
  setSocket(newSocket);

  newSocket.on("connect", () => {
    console.log("⚡ Connected to socket:", newSocket.id);
  });
  newSocket.on("connect_error", (err) => {
    console.error("⚡ Socket connect_error:", err);
  });
  newSocket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  return () => {
    newSocket.close();
  };
}, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
