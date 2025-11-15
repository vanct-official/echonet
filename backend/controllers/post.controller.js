import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../config/cloudinary.js";

// Lấy danh sách tất cả post, mới nhất (tạo hoặc chỉnh sửa) lên đầu
export const getPosts = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Lấy danh sách người bị chặn hoặc đã chặn bạn
    const currentUser = await User.findById(currentUserId).select(
      "blockedUsers"
    );
    const blockedByOthers = await User.find({
      blockedUsers: currentUserId,
    }).select("_id");

    const blockedIds = [
      ...currentUser.blockedUsers,
      ...blockedByOthers.map((u) => u._id),
    ];

    // Lọc bài post của những người không nằm trong danh sách block
    const posts = await Post.find({
      status: "published",
      author: { $nin: blockedIds },
    })
      .sort({ createdAt: -1 })
      .populate([
        { path: "author", select: "username avatar isVerified" },
        { path: "comments.user", select: "username avatar isVerified" },
        { path: "comments.reply.user", select: "username avatar isVerified" },
        {
          path: "repostOf",
          populate: [
            { path: "author", select: "username avatar isVerified" },
            { path: "comments.user", select: "username avatar isVerified" },
            {
              path: "comments.reply.user",
              select: "username avatar isVerified",
            },
          ],
        },
      ])
      .lean();

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách bài viết" });
  }
};

export const getAllPostsForAdmin = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username avatar role")
      .populate("comments.user", "username avatar role")
      .populate("comments.reply.user", "username avatar role")
      .populate("reports.user", "username avatar role avatar email")
      .populate({
        path: "repostOf",
        populate: [
          { path: "author", select: "username avatar role" },
          { path: "comments.user", select: "username avatar role" },
          { path: "comments.reply.user", select: "username avatar role" },
        ],
      })
      .lean();

    res.json(posts);
  } catch (err) {
    console.error("getAllPostsForAdmin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// New: lấy danh sách report của 1 post (chỉ admin hoặc chủ bài)
export const getPostReports = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId).populate(
      "reports.user",
      "username avatar role"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Chỉ admin hoặc chủ bài được xem reports
    const isOwner = post.author?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Không có quyền xem báo cáo" });
    }

    return res.status(200).json({ reports: post.reports || [] });
  } catch (err) {
    console.error("getPostReports error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Export bài đăng của chính người dùng đăng nhập
export const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate([
        { path: "author", select: "username avatar" },
        { path: "comments.user", select: "username avatar" },
        { path: "comments.reply.user", select: "username avatar" },
        {
          path: "repostOf",
          populate: [
            { path: "author", select: "username avatar" },
            { path: "comments.user", select: "username avatar" },
            { path: "comments.reply.user", select: "username avatar" },
          ],
        },
      ])
      .lean();

    res.json(posts);
  } catch (err) {
    console.error("Error in getMyPosts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📄 Lấy bài đăng của một user bất kỳ (theo userId)
export const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params; // Lấy userId từ URL

    const posts = await Post.find({ author: id })
      .sort({ createdAt: -1 })
      .populate([
        { path: "author", select: "username avatar isVerified" },
        { path: "comments.user", select: "username avatar isVerified" },
        {path: "comments.reply.user", select: "username avatar isVerified" },
        {
          path: "repostOf",
          populate: [
            { path: "author", select: "username avatar isVerified" },
            { path: "comments.user", select: "username avatar isVerified" },
            {
              path: "comments.reply.user",
              select: "username avatar isVerified",
            },
          ],
        },
      ])
      .lean();

    res.json(posts);
  } catch (err) {
    console.error("Error in getUserPosts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//Lấy bài viết nháp của người dùng đăng nhập
export const getDraftPosts = async (req, res) => {
  try {
    const drafts = await Post.find({
      author: req.user._id,
      status: "draft",
    })
      .sort({ updatedAt: -1 })
      .populate("author", "username avatar");

    res.json(drafts);
  } catch (err) {
    console.error("Error in getDraftPosts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Đăng bài từ nháp
export const publishPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });

    // ✅ Chỉ cho phép chính chủ hoặc admin đăng bài
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Không có quyền đăng bài này" });
    }

    if (post.status === "published") {
      return res.status(400).json({ message: "Bài viết đã được đăng rồi" });
    }

    post.status = "published";
    await post.save();

    const populatedPost = await post.populate("author", "username avatar");
    res.json({
      message: "Bài viết đã được đăng thành công",
      post: populatedPost,
    });
  } catch (err) {
    console.error("Error in publishPost:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Tạo post với ảnh upload lên Cloudinary
export const createPost = async (req, res) => {
  try {
    const { content, status = "published" } = req.body; // 🆕 nhận thêm status
    let images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "posts" },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(file.buffer);
        });
        images.push(result.secure_url);
      }
    }

    const newPost = new Post({
      author: req.user._id,
      content,
      images,
      status, // 🆕 thêm status vào DB
    });

    await newPost.save();
    const populatedPost = await newPost.populate("author", "username avatar");
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Error in createPost:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Like / Unlike post
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username _id"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const isLiked = post.likes.some((id) => id.toString() === userId);

    if (isLiked) {
      // 🧊 Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      // ❤️ Like
      post.likes.push(userId);
      await post.save();

      // 🧩 Tạo thông báo (nếu người like ≠ chủ bài viết)
      if (post.author._id.toString() !== userId) {
        const message = `${req.user.username} đã thích bài viết của bạn.`;

        const notification = await Notification.create({
          senderId: userId,
          receiverId: post.author._id,
          type: "like",
          message,
          targetId: post._id,
        });

        // 🚀 Gửi real-time qua socket (nếu user đang online)
        const receiverSocketId = global.findSocketByUser(post.author._id);
        if (receiverSocketId) {
          global.io.to(receiverSocketId).emit("notification_new", notification);
        }
      }
    }

    await post.save();
    res.status(200).json({ likes: post.likes });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Users who liked a post
export const getLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "likes",
      "username avatar isVerified"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post.likes);
  } catch (err) {
    console.error("getLikes error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Comment vào post
export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username _id"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    const { text } = req.body;
    post.comments.push({ user: req.user._id, text });
    await post.save();

    // 🆕 Populate thông tin user
    const populated = await Post.findById(post._id).populate(
      "comments.user",
      "username avatar isVerified"
    );
    const newComment = populated.comments[populated.comments.length - 1];

    // 🧩 Tạo thông báo (nếu người comment ≠ chủ bài viết)
    if (post.author._id.toString() !== req.user._id.toString()) {
      const message = `${req.user.username} đã bình luận: "${text}"`;

      const notification = await Notification.create({
        senderId: req.user._id,
        receiverId: post.author._id,
        type: "comment",
        message,
        targetId: post._id,
      });

      // 🚀 Gửi real-time notification
      const receiverSocketId = global.findSocketByUser(post.author._id);
      if (receiverSocketId) {
        global.io.to(receiverSocketId).emit("notification_new", notification);
      }
    }

    res.status(201).json(newComment);
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reply to a comment
export const replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Tìm post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Tìm comment
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Đảm bảo reply array tồn tại
    if (!comment.reply) comment.reply = []; // ← fix chính

    // Push reply (nếu schema là replies)
    comment.reply.push({
      user: userId,
      text,
      createdAt: new Date(),
    });

    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate("comments.user", "username avatar isVerified")
      .populate("comments.reply.user", "username avatar isVerified");

    res.status(200).json({
      message: "Reply added successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.error("replyToComment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cập nhật bài viết (chỉ chủ bài hoặc admin)
export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content, tags, existingImages = [] } = req.body;

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });

    // ✅ Kiểm tra quyền chỉnh sửa
    if (post.author.toString() !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Không có quyền chỉnh sửa bài viết này" });
    }

    // ==========================================
    // ✅ Nếu là bài repost → chỉ cho phép sửa phần chia sẻ (caption)
    // ==========================================
    if (post.repostOf) {
      if (req.body.content !== undefined) {
        post.content = req.body.content; // chỉ cập nhật caption cá nhân
      }

      // ❌ Không cho chỉnh ảnh, video, trạng thái hoặc xoá liên kết repost
      await post.save();

      const populatedPost = await post.populate([
        { path: "author", select: "username avatar" },
        {
          path: "repostOf",
          populate: { path: "author", select: "username avatar" },
        },
      ]);

      return res.status(200).json({
        message: "Cập nhật caption repost thành công",
        post: populatedPost,
      });
    }

    // ==========================================
    // Nếu KHÔNG phải repost → xử lý như cũ
    // ==========================================
    if (content) post.content = content;
    if (tags) post.tags = tags;
    if (req.body.status) post.status = req.body.status;

    const remainingImages = Array.isArray(existingImages)
      ? existingImages
      : [existingImages].filter(Boolean);

    let uploadedImages = [];
    let uploadedVideo = null;

    if (req.files && req.files.length > 0) {
      const imageFiles = req.files.filter((f) =>
        f.mimetype.startsWith("image/")
      );
      const videoFiles = req.files.filter((f) =>
        f.mimetype.startsWith("video/")
      );

      // Upload ẢNH mới
      for (const file of imageFiles) {
        const uploadRes = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "posts" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });
        uploadedImages.push(uploadRes.secure_url);
      }

      // Upload VIDEO mới
      if (videoFiles.length > 0) {
        if (post.video) {
          try {
            const publicId = post.video.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`posts/${publicId}`, {
              resource_type: "video",
            });
          } catch (err) {
            console.warn("Không thể xóa video cũ:", err.message);
          }
        }

        const uploadRes = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "posts", resource_type: "video" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(videoFiles[0].buffer);
        });
        uploadedVideo = uploadRes.secure_url;
      }
    }

    // ==========================================
    // Hợp nhất ảnh cũ còn giữ lại + ảnh mới
    // ==========================================
    post.images = [...remainingImages, ...uploadedImages];
    if (uploadedVideo) post.video = uploadedVideo;

    // ==========================================
    // Lưu thay đổi
    // ==========================================
    await post.save();
    const populatedPost = await post.populate("author", "username avatar");

    res.status(200).json({
      message: "Cập nhật bài viết thành công",
      post: populatedPost,
    });
  } catch (err) {
    console.error("❌ Lỗi cập nhật bài viết:", err);
    res.status(500).json({ message: "Cập nhật thất bại", error: err.message });
  }
};

// 🗑️ Xóa bài viết (người dùng xóa bài của mình, admin có thể xóa bất kỳ)
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // ❌ BỎ .lean() để post vẫn là Mongoose Document
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });

    // ✅ Kiểm tra quyền
    if (
      post.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bài viết này" });
    }

    // ✅ Nếu đây là bài repost → giảm repostCount bài gốc
    if (post.repostOf) {
      const originalId =
        typeof post.repostOf === "object" && post.repostOf._id
          ? post.repostOf._id
          : post.repostOf;

      const originalPost = await Post.findById(originalId);
      if (originalPost) {
        originalPost.repostCount = Math.max(
          (originalPost.repostCount || 1) - 1,
          0
        );
        await originalPost.save({ timestamps: false });
      }
    }
    // ✅ Nếu là bài gốc → đánh dấu các bài repost từng chia sẻ nó
    else {
      await Post.updateMany(
        { repostOf: post._id },
        {
          $unset: { repostOf: "" }, // xoá hoàn toàn trường này
          $set: { wasRepost: true }, // đánh dấu từng là repost
        },
        { timestamps: false }
      );
    }

    // 🧹 Xoá ảnh trên Cloudinary nếu có
    if (Array.isArray(post.images)) {
      for (const url of post.images) {
        try {
          const publicId = url.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`posts/${publicId}`);
        } catch (err) {
          console.warn("Không thể xóa ảnh trên Cloudinary:", err.message);
        }
      }
    }

    // 🧹 Xoá video nếu có
    if (post.video) {
      try {
        const publicId = post.video.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`posts/${publicId}`, {
          resource_type: "video",
        });
      } catch (err) {
        console.warn("Không thể xóa video trên Cloudinary:", err.message);
      }
    }

    // ✅ Xóa bài viết
    await post.deleteOne();

    res.json({
      message: "Đã xóa bài viết thành công",
      id: postId,
      deletedBy: req.user.username,
    });
  } catch (err) {
    console.error("❌ Lỗi khi xóa bài viết:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Repost bài viết
export const repostPost = async (req, res) => {
  try {
    const { content = "" } = req.body;
    const { id } = req.params;

    const originalPost = await Post.findById(id).populate(
      "author",
      "username avatar isVerified"
    );
    if (!originalPost)
      return res.status(404).json({ message: "Post not found" });

    // 🟢 Tạo bài repost
    const repost = new Post({
      author: req.user._id,
      content,
      repostOf: originalPost._id,
      status: "published",
      wasRepost: true, // 🧩 Thêm dòng này
    });

    await repost.save();

    // 🟢 Tăng repostCount an toàn
    originalPost.repostCount = (originalPost.repostCount || 0) + 1;
    await originalPost.save({ timestamps: false }); // Giữ nguyên updatedAt của bài gốc

    // 🟢 Populate bài repost vừa tạo
    const populatedRepost = await Post.findById(repost._id)
      .populate("author", "username avatar isVerified")
      .populate({
        path: "repostOf",
        populate: { path: "author", select: "username avatar isVerified" },
      });

    res.status(201).json(populatedRepost);
  } catch (err) {
    console.error("❌ Lỗi khi repost:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const reportPost = async (req, res) => {
  try {
    const { reason, details } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.reports.push({
      user: req.user.id,
      reason,
      details,
    });

    await post.save();

    res.json({ message: "Report submitted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
