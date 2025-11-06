// src/services/chatService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// ✅ Tạo header có token để xác thực
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

// ✅ Lấy danh sách các cuộc trò chuyện của người dùng hiện tại
export const getConversations = async () => {
  const res = await axios.get(`${API_URL}/chat/conversations`, getAuthHeaders());
  return res.data;
};

// ✅ Lấy danh sách tin nhắn trong một cuộc trò chuyện
export const getMessages = async (conversationId) => {
  try {
    const res = await axios.get(`${API_URL}/chat/messages/${conversationId}`, getAuthHeaders());
    // Trả về res.data nếu nó là mảng, nếu không trả về mảng rỗng
    return Array.isArray(res.data) ? res.data : []; 
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    return []; 
  }
};

// ✅ Gửi tin nhắn mới
// src/services/chatService.js

// ✅ Sửa lại hàm sendMessage để nhận cả senderId
// chatService.js (Hàm sendMessage đã sửa)
export const sendMessage = async ({ conversationId, text }) => {
  try {
    const res = await axios.post(
      `${API_URL}/chat/message`,
      { conversation: conversationId, text }, 
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error);
    // Ném lỗi để ChatWindow bắt được và không crash
    throw error; 
  }
};

// ✅ Đánh dấu tin nhắn là đã đọc
export const markMessagesAsRead = async (conversationId) => {
  const res = await axios.post(
    `${API_URL}/chat/messages/${conversationId}/read`,
    {},
    getAuthHeaders()
  );
  return res.data;
};

// ✅ Tạo cuộc trò chuyện mới (khi nhắn với người chưa từng nhắn)
export const createConversation = async ({ receiverId }) => {
  const res = await axios.post(
    `${API_URL}/chat/conversation`,
    { receiverId },
    getAuthHeaders()
  );
  return res.data;
};
