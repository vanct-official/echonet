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
  },
  { timestamps: true } // tạo createdAt và updatedAt tự động
);

const Post = mongoose.model("Post", postSchema);
export default Post;
