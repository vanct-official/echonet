import { useEffect, useState } from "react";
import axios from "axios";
import { useSocket } from "../context/SocketContext";

export const useNotifications = (currentUser) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  // 🔹 Load dữ liệu ban đầu
  useEffect(() => {
    // ✅ Chờ đến khi currentUser và _id đều có
    if (!currentUser || !currentUser._id) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/notifications/${currentUser._id}`
        );
        setNotifications(res.data);
        const unread = res.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("❌ Lỗi khi tải notifications:", err);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  // 🔹 Lắng nghe notification real-time
  useEffect(() => {
    if (!socket || !currentUser?._id) return;

    console.log("📡 Registering socket for user:", currentUser._id);
    socket.emit("register", currentUser._id);

    socket.on("notification_new", (newNoti) => {
      console.log("🔔 Notification received:", newNoti.message);
      setNotifications((prev) => [newNoti, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => socket.off("notification_new");
  }, [socket, currentUser]);

  // 🔹 Đánh dấu 1 thông báo đã đọc
  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("❌ Lỗi khi đánh dấu đã đọc:", err);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    setUnreadCount,
    setNotifications,
  };
};
