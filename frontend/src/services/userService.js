// src/services/userService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// ✅ Tạo header có token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/* -------------------------------------------------------------------------- */
/* 👤 USER SERVICE */
/* -------------------------------------------------------------------------- */

// ✅ Lấy thông tin hồ sơ người dùng hiện tại
export const getMyProfile = async () => {
  try {
    const res = await axios.get(`${API_URL}/users/me`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy hồ sơ người dùng:", error);
    return null;
  }
};

// ✅ Lấy danh sách người dùng mà mình đang theo dõi
export const getFollowedUsers = async () => {
  try {
    const res = await axios.get(`${API_URL}/users/followed`, getAuthHeaders());
    // Đảm bảo luôn trả về mảng an toàn
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người đã theo dõi:", error);
    return []; // ✅ fallback rỗng tránh crash
  }
};

export const getFollowers = async (userId) => {
  try {
    const res = await axios.get(
      `${API_URL}/users/followers`,
      getAuthHeaders()
    );
    return res.data || []; // ✅ fallback rừng tránh crash
  } catch (error) {
    console.error("Lỗi khi lấy danh sách followers:", error);
    return []; // ✅ fallback rừng tránh crash
  }
};

// ✅ Theo dõi người khác
export const followUser = async (userId) => {
  try {
    const res = await axios.post(
      `${API_URL}/users/${userId}/follow`,
      {},
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi theo dõi người dùng:", error);
    throw error;
  }
};

// ✅ Bỏ theo dõi người khác
export const unfollowUser = async (userId) => {
  try {
    const res = await axios.post(
      `${API_URL}/users/${userId}/unfollow`,
      {},
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi bỏ theo dõi người dùng:", error);
    throw error;
  }
};

// ✅ Tìm kiếm người dùng theo tên
export const searchUsers = async (query) => {
  try {
    const res = await axios.get(
      `${API_URL}/users/search?q=${query}`,
      getAuthHeaders()
    );
    return res.data || [];
  } catch (error) {
    console.error("Lỗi khi tìm kiếm người dùng:", error);
    return [];
  }
};

// ✅ Lấy toàn bộ danh sách người dùng (admin)
export const getAllUsers = async () => {
  try {
    const res = await axios.get(`${API_URL}/users/all`, getAuthHeaders());
    return res.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy toàn bộ người dùng:", error);
    return [];
  }
};
