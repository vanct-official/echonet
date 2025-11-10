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

// 🟢 Lấy tin nhắn trong conversation cụ thể
export const getMessages = async (conversationId) => {
  try {
    const res = await axios.get(
      `${API_URL}/chat/messages/${conversationId}`,
      getAuthHeaders()
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("❌ Lỗi khi lấy tin nhắn:", error);
    return [];
  }
};

export const getMyMessages = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/chat/messages/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("❌ Lỗi khi lấy tin nhắn của chính người dùng:", {
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
      ...(!isFormData ? { "Content-Type": "application/json" } : {}), // Nếu không phải form data, set Content-Type
    };

    const res = await axios.post(`${API_URL}/chat/message`, data, { headers });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi gửi tin nhắn:", error);
    throw error;
  }
};

// 🟢 Đánh dấu tin nhắn đã đọc
export const markMessagesAsRead = async (conversationId) => {
  try {
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

// 🟢 Tạo cuộc trò chuyện mới (nếu chưa tồn tại)
export const createConversation = async ({ receiverId }) => {
  try {
    const res = await axios.post(
      `${API_URL}/conversations`,
      { receiverId },
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo conversation:", error);
    throw error;
  }
};
