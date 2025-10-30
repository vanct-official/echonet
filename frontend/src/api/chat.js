import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Thêm interceptor để gắn token vào header mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Lấy danh sách cuộc trò chuyện
export const getConversations = async () => {
  try {
    const response = await api.get("/conversations"); // Hoặc '/chat/conversations' tùy theo route của bạn
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching conversations:",
      error.response?.data || error.message
    );
    throw error.response?.data || error.message;
  }
};

// Lấy tin nhắn trong một cuộc trò chuyện
export const getMessages = async (conversationId) => {
  try {
    const response = await api.get(`/chat/messages/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching messages for conversation ${conversationId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error.message;
  }
};

// Gửi tin nhắn (text hoặc media)
export const sendMessage = async (
  conversationId,
  senderId,
  content,
  type = "text",
  mediaFile = null
) => {
  try {
    const formData = new FormData();
    formData.append("conversation", conversationId);
    formData.append("sender", senderId);
    if (content) {
      formData.append("content", content);
    }
    if (mediaFile) {
      formData.append("media", mediaFile); // 'media' là tên trường mà backend của bạn mong đợi
      formData.append(
        "type",
        mediaFile.type.startsWith("image/") ? "image" : "file"
      ); // Hoặc 'video'
    } else {
      formData.append("type", type);
    }

    const response = await api.post("/chat/message", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response?.data || error.message
    );
    throw error.response?.data || error.message;
  }
};

// Tạo cuộc trò chuyện mới (nếu cần)
export const createConversation = async (receiverId) => {
  try {
    const response = await api.post("/conversations", { receiverId });
    return response.data;
  } catch (error) {
    console.error(
      "Error creating conversation:",
      error.response?.data || error.message
    );
    throw error.response?.data || error.message;
  }
};
