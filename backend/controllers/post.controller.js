import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

// Lấy danh sách tất cả post, mới nhất (tạo hoặc chỉnh sửa) lên đầu
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "published" }) // 🆕 chỉ lấy bài đã đăng
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
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    // ✅ Chỉ cho phép chính chủ hoặc admin đăng bài
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền đăng bài này" });
    }

    if (post.status === "published") {
      return res.status(400).json({ message: "Bài viết đã được đăng rồi" });
    }

    post.status = "published";
    await post.save();

    const populatedPost = await post.populate("author", "username avatar");
    res.json({ message: "Bài viết đã được đăng thành công", post: populatedPost });
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
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // like
      post.likes.push(userId);
    }

    await post.save();

    // ✅ Trả về mảng userId để frontend xử lý dễ hơn
    res.status(200).json({ likes: post.likes });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Comment vào post
export const addComment = async (req, res) => {
  try {

    // Lấy bài viết
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Thêm comment
    const { text } = req.body;
    post.comments.push({ user: req.user._id, text });
    await post.save();

    // 🆕 Populate user info trong comment
    const populated = await Post.findById(post._id).populate(
      "comments.user",
      "username avatar isVerified"
    );

    // ✅ Trả về comment vừa thêm
    const newComment = populated.comments[populated.comments.length - 1];

    // Trả về comment mới tạo
    res.status(201).json(newComment);
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
    // ✅ Cập nhật trạng thái (draft / published)
    if (req.body.status) {
      post.status = req.body.status;
    }
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

// Xóa bài viết (người dùng xóa bài của mình, admin có thể xóa bất kỳ)
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });

    // ✅ Cho phép: chính chủ hoặc admin
    if (post.author.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài viết này" });
    }

    // 🧹 Nếu bài viết có ảnh, xóa trên Cloudinary
    if (post.images && post.images.length > 0) {
      for (const url of post.images) {
        try {
          const publicId = url.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`posts/${publicId}`);
        } catch (err) {
          console.warn("Không thể xóa ảnh trên Cloudinary:", err.message);
        }
      }
    }

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

// Repost của một bài viết
export const repostPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { quoteText } = req.body;

    // 1️⃣ Kiểm tra bài gốc tồn tại
    const originalPost = await Post.findById(id);
    if (!originalPost) {
      return res.status(404).json({ message: "Original post not found" });
    }

    // 2️⃣ Kiểm tra người dùng đã repost bài này chưa (nếu bạn muốn hạn chế repost trùng)
    const existingRepost = await Post.findOne({
      author: req.user._id,
      repostOf: id,
    });
    if (existingRepost) {
      return res
        .status(400)
        .json({ message: "You have already reposted this post." });
    }

    // 3️⃣ Tạo bài repost mới
    const repost = await Post.create({
      author: req.user._id,
      repostOf: id,
      quoteText: quoteText || "",
      content: "", // để trống vì bài này không có content riêng
      images: [],
      status: "published",
    });

    // 4️⃣ Populate để gửi về frontend
    const populatedRepost = await Post.findById(repost._id)
      .populate("author", "username avatar isVerified")
      .populate({
        path: "repostOf",
        populate: { path: "author", select: "username avatar isVerified" },
      });

    res.status(201).json(populatedRepost);
  } catch (err) {
    console.error("Error in repostPost:", err);
    res.status(500).json({ message: "Server error" });
  }
};