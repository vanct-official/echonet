import Conversation from "../models/conversation.model.js";

// 📩 Lấy danh sách cuộc trò chuyện của user hiện tại
export const getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      // 🔹 Populate thông tin người trong cuộc trò chuyện
      .populate("participants", "username firstname lastname avatar")
      // 🔹 Populate tin nhắn cuối cùng và người gửi tin đó
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "username firstname lastname avatar",
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 💬 Tạo cuộc trò chuyện mới giữa 2 người
export const createConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    // 🔍 Kiểm tra xem đã có cuộc trò chuyện này chưa
    let existing = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    })
      .populate("participants", "username firstname lastname avatar")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "username firstname lastname avatar",
        },
      });

    if (existing) return res.status(200).json(existing);

    // 🆕 Nếu chưa có -> tạo mới
    const newConversation = await Conversation.create({
      participants: [senderId, receiverId],
    });

    const populatedConv = await newConversation.populate(
      "participants",
      "username firstname lastname avatar"
    );

    res.status(201).json(populatedConv);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: "Lỗi khi tạo conversation mới" });
  }
};
