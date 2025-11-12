// src/hooks/useNotifications.js
import { useEffect, useState } from "react";
import axios from "axios";
import { useSocket } from "../context/SocketContext";

export const useNotifications = (currentUser) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  // 🔹 Load dữ liệu ban đầu
  useEffect(() => {
    if (!currentUser) return;

    axios
      .get(`http://localhost:5000/api/notifications/${currentUser._id}`)
      .then((res) => {
        setNotifications(res.data);
        const unread = res.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      })
      .catch((err) => console.error(err));
  }, [currentUser]);

  // 🔹 Lắng nghe notification real-time
  useEffect(() => {
    if (!socket || !currentUser) return;

    socket.emit("register", currentUser._id);

    socket.on("notification_new", (newNoti) => {
      setNotifications((prev) => [newNoti, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => socket.off("notification_new");
  }, [socket, currentUser]);

  // 🔹 Đánh dấu 1 thông báo đã đọc
  const markAsRead = async (id) => {
    await axios.patch(`http://localhost:5000/api/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return { notifications, unreadCount, markAsRead };
};
