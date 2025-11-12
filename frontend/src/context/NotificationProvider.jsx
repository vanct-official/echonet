import React, { createContext, useContext, useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import { useNotifications } from "../hooks/useNotification";  // ✅ sửa import
import { useSocket } from "./SocketContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ currentUser, children }) => {
  const socket = useSocket();
  const toast = useToast();
  const { notifications, unreadCount, setUnreadCount, setNotifications } =
    useNotifications(currentUser);

  useEffect(() => {
    if (!socket) return;

    if (currentUser?._id) {
      console.log("📡 Registering socket for user:", currentUser._id);
      socket.emit("register", currentUser._id);
    } else {
      console.log("⚠️ currentUser not ready yet");
    }

    socket.on("notification_new", (newNoti) => {
      console.log("🔔 Notification received:", newNoti.message);

      // cập nhật UI ngay
      setNotifications((prev) => [newNoti, ...prev]);
      setUnreadCount((prev) => prev + 1);

      toast({
        title: "🔔 Thông báo mới",
        description: newNoti.message,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      const bell = document.getElementById("bell-icon");
      if (bell) {
        bell.classList.add("shake");
        setTimeout(() => bell.classList.remove("shake"), 1000);
      }
    });

    return () => socket.off("notification_new");
  }, [socket, currentUser, toast, setNotifications, setUnreadCount]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
