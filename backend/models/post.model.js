import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: false },

    images: [{ type: String }], // URL ảnh
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // danh sách user đã like
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // 🆕 Trạng thái bài viết: 'draft' hoặc 'published'
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    // 🆕 Trường cho bài viết được repost
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    repostCount: {
      type: Number,
      default: 0,
    },
    wasRepost: {
      type: Boolean,
      default: false
    },
    
    
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
