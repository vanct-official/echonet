import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";

// 📩 Lấy danh sách cuộc trò chuyện của user hiện tại
export const getUserConversations = async (req, res) => {
  try {
    // ✅ Lấy danh sách block 2 chiều
    const currentUser = await User.findById(req.user._id).select("blockedUsers");
    const blockedByOthers = await User.find({ blockedUsers: req.user._id }).select("_id");

    const blockedIds = [
      ...currentUser.blockedUsers.map((id) => id.toString()),
      ...blockedByOthers.map((u) => u._id.toString()),
    ];

    // ✅ Tìm tất cả conversation có user hiện tại tham gia
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username firstname lastname avatar")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username firstname lastname avatar",
        },
      })
      .sort({ updatedAt: -1 });

    // 🚫 Lọc bỏ conversation có người bị block 2 chiều
    const filtered = conversations.filter((conv) =>
      conv.participants.every((p) => !blockedIds.includes(p._id.toString()))
    );

    res.status(200).json(filtered);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// 💬 Tạo cuộc trò chuyện mới giữa 2 người (kiểm tra block 2 chiều)
export const createConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    // ✅ Kiểm tra chặn hai chiều
    const [sender, receiver] = await Promise.all([
      User.findById(senderId).select("blockedUsers"),
      User.findById(receiverId).select("blockedUsers"),
    ]);

    const senderBlockedReceiver = sender.blockedUsers.includes(receiverId);
    const receiverBlockedSender = receiver.blockedUsers.includes(senderId);

    if (senderBlockedReceiver || receiverBlockedSender) {
      return res.status(403).json({
        message: "Không thể tạo cuộc trò chuyện vì một trong hai người đã bị chặn.",
      });
    }

    // 🔍 Kiểm tra xem đã có cuộc trò chuyện này chưa
    let existing = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    })
      .populate("participants", "username firstname lastname avatar")
      .populate({
        path: "lastMessage",
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

