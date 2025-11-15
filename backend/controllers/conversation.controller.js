import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";

// Get all conversations for the logged-in user, excluding blocked users
export const getUserConversations = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select("blockedUsers");
    const blockedByOthers = await User.find({ blockedUsers: req.user._id }).select("_id");

    const blockedIds = [
      ...currentUser.blockedUsers.map((id) => id.toString()),
      ...blockedByOthers.map((u) => u._id.toString()),
    ];

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

    const filtered = conversations.filter((conv) =>
      conv.participants.every((p) => !blockedIds.includes(p._id.toString()))
    );

    res.status(200).json(filtered);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Create a new conversation between two users 
export const createConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

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

