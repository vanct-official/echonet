import API from "../api";

// 🧱 Chặn người dùng
export const blockUser = async (userId) => {
  const res = await API.put(`/users/${userId}/block`);
  return res.data;
};

// 🔓 Bỏ chặn người dùng
export const unblockUser = async (userId) => {
  const res = await API.put(`/users/${userId}/unblock`);
  return res.data;
};

// 📋 Lấy danh sách người bị chặn
export const getBlockedUsers = async () => {
  const res = await API.get(`/users/blocked/list`);
  return res.data;
};
