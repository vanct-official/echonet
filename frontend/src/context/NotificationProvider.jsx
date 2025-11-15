import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useSocket } from "./SocketContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ currentUser, children }) => {
  const socket = useSocket();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Lấy notification khi user đăng nhập
  useEffect(() => {
    if (!currentUser) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/notifications/me`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.read).length);
      } catch (err) {
        console.error("Fetch notifications error:", err);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  // Lắng nghe notification realtime
  useEffect(() => {
    if (!socket || !currentUser?._id) return;

    // Đăng ký socket
    socket.emit("register", currentUser._id);

    const handleNewNotification = (newNoti) => {
      console.log("🔔 Notification received:", newNoti.message);

      // Cập nhật state ngay
      setNotifications((prev) => [newNoti, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Hiển thị toast
      toast({
        title: "🔔 Thông báo mới",
        description: newNoti.message,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      // Rung icon chuông nếu có
      const bell = document.getElementById("bell-icon");
      if (bell) {
        bell.classList.add("shake");
        setTimeout(() => bell.classList.remove("shake"), 1000);
      }
    };

    socket.on("notification_new", handleNewNotification);

    return () => {
      socket.off("notification_new", handleNewNotification);
    };
  }, [socket, currentUser, toast]);

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/mark-all-read`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
