import axios from "axios";
const API_URL = "http://localhost:5000/api";

// ✅ Hàm tiện ích để tạo header có token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ✅ Lấy tin nhắn trong 1 cuộc trò chuyện
export const fetchMessagesByConversation = async (conversationId) => {
  const res = await axios.get(
    `${API_URL}/chat/messages/${conversationId}`,
    getAuthHeaders()
  );
  return res.data;
};

// ✅ Gửi tin nhắn mới
export const sendMessageAPI = async (conversationId, senderId, text) => {
  const res = await axios.post(
    `${API_URL}/chat/message`,
    {
      conversation: conversationId,
      sender: senderId,
      text,
    },
    getAuthHeaders()
  );
  return res.data;
};
