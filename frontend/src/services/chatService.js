// services/chatService.js

import axios from "axios";

const API_URL = "http://localhost:5000/api";

/* -------------------------------------------------------------------------- */
/* 🔐 Hàm tiện ích - thêm token xác thực */
/* -------------------------------------------------------------------------- */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/* -------------------------------------------------------------------------- */
/* 💬 CHAT SERVICE */
/* -------------------------------------------------------------------------- */

// Tạo conversation giữa 2 người (nếu chưa có)
export const createOrGetConversation = async (receiverId) => {
  try {
    const res = await axios.post(
      `${API_URL}/conversations`,
      { receiverId },
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo hoặc lấy conversation:", error);
    throw error;
  }
};

// 🟢 Lấy danh sách conversation của người dùng hiện tại
export const getConversations = async () => {
  try {
    const res = await axios.get(`${API_URL}/conversations`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách conversation:", error);
    return [];
  }
};

// 🟢 Lấy tin nhắn theo conversation ID
export const getMessages = async (conversationId) => {
  try {
    const res = await axios.get(
      `${API_URL}/chat/messages/${conversationId}`,
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi lấy tin nhắn theo conversation:", error);
    return [];
  }
};

// 🟢 Lấy tin nhắn của chính người dùng (theo sender ID)
export const getMyMessages = async () => {
  try {
    const res = await axios.get(
      `${API_URL}/chat/messages/mine`,
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi lấy tin nhắn của người dùng:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return [];
  }
};

// 🟢 Gửi tin nhắn (text hoặc file)
export const sendMessage = async (data, isFormData = false) => {
  try {
    const token = localStorage.getItem("token");

    const headers = {
      Authorization: `Bearer ${token}`,
      // 💡 SỬA LỖI: Chỉ set Content-Type: application/json nếu KHÔNG phải FormData
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    };

    const res = await axios.post(`${API_URL}/chat/message`, data, { headers });
    return res.data; // Server trả về trực tiếp message object đã populated
  } catch (error) {
    console.error("❌ Lỗi khi gửi tin nhắn:", error);
    throw error;
  }
};

// 🟢 Đánh dấu tin nhắn đã đọc
export const markMessagesAsRead = async (conversationId) => {
  try {
    // 💡 SỬA LỖI: Đảm bảo gửi body rỗng cho request POST (Khắc phục AxiosError dòng 108)
    const res = await axios.post(
      `${API_URL}/chat/messages/${conversationId}/read`,
      {},
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi đánh dấu tin nhắn đã đọc:", error);
    throw error;
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const res = await axios.patch(
      `${API_URL}/chat/messages/${messageId}`, // API endpoint mới
      {},
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi xóa tin nhắn:", error);
    throw error;
  }
};

export const updateMessage = async (messageId, newContent) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(
    `http://localhost:5000/api/chat/messages/${messageId}`,   // ✔ CHÍNH XÁC
    { newContent },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return res.data.updatedMessage;
};
