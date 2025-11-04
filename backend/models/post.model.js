import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
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
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
