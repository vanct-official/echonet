import User from "../models/user.model.js";

// @desc    Get profile of logged-in user
// @route   GET /api/users/me
// @access  Private
export const getMyProfile = async (req, res) => {
  res.json(req.user);
};

// @desc    Get profile by ID or username
// @route   GET /api/users/:idOrUsername
// @access  Private
export const getUserProfile = async (req, res) => {
  const { idOrUsername } = req.params;
  const user = await User.findOne({
    $or: [{ _id: idOrUsername }, { username: idOrUsername }],
  }).select("-passwordHash");

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// Get All User Profile
// 📘 [GET] /api/users/all
export const getAllUsers = async (req, res) => {
  try {
    // 1️⃣ Lấy tất cả người dùng (trừ passwordHash)
    const users = await User.find().select("-passwordHash");

    // 2️⃣ Kiểm tra nếu không có user nào
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // 3️⃣ Trả về danh sách users
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// @desc    Follow another user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req, res) => {
  try {
    // Kiểm tra không thể follow chính mình
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra đã follow chưa
    if (targetUser.followers.includes(req.user._id)) {
      return res.status(400).json({ message: "You already follow this user" });
    }

    // Thêm vào followers của target user
    targetUser.followers.push(req.user._id);
    await targetUser.save();

    // Thêm vào followed của current user
    req.user.followed.push(targetUser._id);
    await req.user.save();

    res.json({ 
      message: `You are now following ${targetUser.username}`,
      followersCount: targetUser.followers.length
    });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Unfollow user
// @route   POST /api/users/:id/unfollow
// @access  Private
export const unfollowUser = async (req, res) => {
  try {
    // Kiểm tra không thể unfollow chính mình
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra có đang follow không
    if (!targetUser.followers.includes(req.user._id)) {
      return res.status(400).json({ message: "You are not following this user" });
    }

    // Xóa khỏi followers của target user
    targetUser.followers = targetUser.followers.filter(
      (f) => f.toString() !== req.user._id.toString()
    );
    await targetUser.save();

    // Xóa khỏi followed của current user
    req.user.followed = req.user.followed.filter(
      (f) => f.toString() !== targetUser._id.toString()
    );
    await req.user.save();

    res.json({ 
      message: `You have unfollowed ${targetUser.username}`,
      followersCount: targetUser.followers.length
    });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Routes (trong file userRoutes.js)
// router.post("/:id/follow", protect, followUser);
// router.post("/:id/unfollow", protect, unfollowUser);

// Tìm kiếm người dùng qua username hoặc số điện thoại
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query; // q có thể là username hoặc phone

    if (!q) return res.status(400).json({ message: "Query is required" });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } }, // tìm theo username (ignore case)
        { phone: { $regex: q, $options: "i" } }, // tìm theo phone
      ],
    }).select("-passwordHash"); // không trả về password

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFollowedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("followed", "username firstname lastname _id"); // chỉ lấy thông tin cần
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Kiểm tra tránh undefined
    res.json(user.followed || []);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách followed:", error);
    res.status(500).json({ message: "Server error" });
  }
};