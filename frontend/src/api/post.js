import API from "../api"; // ✅ dùng instance có interceptor token

// 🟢 Lấy tất cả bài viết
export const fetchAllPosts = async () => {
  const res = await API.get("/posts");
  return res.data;
};

// 🟢 Lấy bài viết của chính mình
export const fetchMyPosts = async () => {
  const res = await API.get("/posts/me");
  return res.data;
};

// 🟢 Tạo bài viết mới
export const createPost = async (data) => {
  const res = await API.post("/posts", data);
  return res.data;
};

// 🟡 Cập nhật bài viết (Edit Post)
export const updatePost = async (id, data) => {
  const res = await API.put(`/posts/${id}`, data);
  return res.data;
};

// 🔴 Xóa bài viết
export const deletePost = async (id) => {
  const res = await API.delete(`/posts/${id}`);
  return res.data;
};

// 🟣 Lấy bài viết theo ID
export const fetchPostById = async (id) => {
  const res = await API.get(`/posts/${id}`);
  return res.data;
};

// 🔁 Repost bài viết
export const repostPost = async (id) => {
  const res = await API.post(`/posts/${id}/repost`);
  return res.data;
};

