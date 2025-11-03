import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

// Lấy danh sách tất cả post, mới nhất (tạo hoặc chỉnh sửa) lên đầu
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate("author", "username avatar")
      .populate("comments.user", "username avatar");

    res.json(posts);
  } catch (err) {
    console.error("Lỗi trong getPosts:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Export bài đăng của chính người dùng đăng nhập
export const getMyPosts = async (req, res) => {
  try {
    console.log("Current user:", req.user); // debug
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate("author", "username avatar")
      .populate("comments.user", "username avatar");

    res.json(posts);
  } catch (err) {
    console.error("Error in getMyPosts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Tạo post với ảnh upload lên Cloudinary
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Chuyển upload_stream sang Promise để await
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "posts" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer); // gửi buffer lên Cloudinary
        });
        images.push(result.secure_url);
      }
    }

    const newPost = new Post({
      author: req.user._id,
      content,
      images,
    });

    await newPost.save();
    const populatedPost = await newPost.populate("author", "username avatar");
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Error in createPost:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Like / unlike post
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    if (post.likes.includes(userId)) {
      // unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // like
      post.likes.push(userId);
    }
    await post.save();
    res.json({ likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Comment vào post
export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const { text } = req.body;
    post.comments.push({ user: req.user._id, text });
    await post.save();
    const populatedPost = await post.populate(
      "comments.user",
      "username avatar"
    );
    res.json(populatedPost.comments);
  } catch (err) {
    console.error(err);
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
    // Cập nhật nội dung & thẻ
    // ==========================================
    if (content) post.content = content;
    if (tags) post.tags = tags;

    // ==========================================
    // Giữ lại ảnh cũ còn tồn tại
    // ==========================================
    const remainingImages = Array.isArray(existingImages)
      ? existingImages
      : [existingImages].filter(Boolean);

    // ==========================================
    // Xử lý upload ảnh/video mới (nếu có)
    // ==========================================
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
        // Xóa video cũ nếu có
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

    // Cập nhật video (nếu có mới)
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
    res
      .status(500)
      .json({ message: "Cập nhật thất bại", error: err.message });
  }
};





