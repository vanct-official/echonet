// src/context/NotificationProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { useNotifications } from "../hooks/useNotification";
import { useSocket } from "./SocketContext";

// 🎯 Tạo context chia sẻ badge cho toàn app
const NotificationContext = createContext();

export const NotificationProvider = ({ currentUser, children }) => {
  const socket = useSocket();
  const toast = useToast();
  const { notifications, unreadCount, setUnreadCount, setNotifications } = useNotifications(currentUser);

  // 🧠 Khi có socket event "notification_new" → hiển thị popup ngay
  useEffect(() => {
    if (!socket || !currentUser) return;

    socket.emit("register", currentUser._id);

    socket.on("notification_new", (newNoti) => {
      console.log("🔔 Notification received:", newNoti.message);

      // Cập nhật danh sách và số lượng
      setNotifications((prev) => [newNoti, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Hiện popup tức thì
      toast({
        title: "🔔 Thông báo mới",
        description: newNoti.message,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      // 💡 Hiệu ứng rung chuông sidebar (id="bell-icon")
      const bell = document.getElementById("bell-icon");
      if (bell) {
        bell.classList.add("shake");
        setTimeout(() => bell.classList.remove("shake"), 1000);
      }
    });

    return () => socket.off("notification_new");
  }, [socket, currentUser, toast, setNotifications, setUnreadCount]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook dùng trong Sidebar hoặc NotificationPage để lấy badge
export const useNotificationContext = () => useContext(NotificationContext);
