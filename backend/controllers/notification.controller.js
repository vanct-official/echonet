import Notification from "../models/notification.model.js";

// Lấy danh sách thông báo theo user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    const notifications = await Notification.find({ receiverId: userId })
      .populate("senderId", "username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gửi thông báo mới (tạo mới)
export const createNotification = async (req, res) => {
  try {
    const { senderId, receiverId, type, title, message, targetId } = req.body;

    const newNotification = await Notification.create({
      senderId,
      receiverId,
      type,
      title,
      message,
      targetId,
    });

    // Socket event (tùy theo socket module)
    global.io.to(receiverId.toString()).emit("notification_new", newNotification);

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Đánh dấu đã đọc
export const markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Đánh dấu tất cả đã đọc
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ receiverId: userId, isRead: false }, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa thông báo
export const deleteNotification = async (req, res) => {
  try {
    const id = req.params.id;
    await Notification.findByIdAndDelete(id);
    res.status(200).json({ message: "Notification deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
