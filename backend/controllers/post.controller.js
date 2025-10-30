import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

// Lấy danh sách tất cả post, mới nhất lên đầu
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username avatar")
      .populate("comments.user", "username avatar");
    res.json(posts);
  } catch (err) {
    console.error(err);
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
