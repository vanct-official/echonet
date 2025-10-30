import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Quan trọng để gửi cookie (nếu dùng cookie cho JWT)
});

// Hàm login
export const login = async (username, password) => {
  try {
    const response = await api.post("/auth/login", { username, password });
    return response.data;
  } catch (error) {
    console.error("Error in login API:", error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

// Hàm đăng ký (nếu có, không bắt buộc cho demo này)
export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error(
      "Error in register API:",
      error.response?.data || error.message
    );
    throw error.response?.data || error.message;
  }
};
