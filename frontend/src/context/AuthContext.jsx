// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();
const USER_API_URL = "http://localhost:5000/api/users/me";
const LOGIN_API_URL = "http://localhost:5000/api/auth/login";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🟡 Khi reload trang -> kiểm tra token & lấy thông tin user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(USER_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Token invalid:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 🟢 Hàm đăng nhập — xử lý token, user, role, navigate
  const login = async (username, password) => {
    try {
      const res = await axios.post(LOGIN_API_URL, { username, password });

      // Backend trả { user: {...}, token: "..." } hoặc chỉ token
      const { user: userData, token } = res.data;

      if (!token) throw new Error("Token not returned from API.");

      // Lưu token ngay để dùng cho request tiếp theo
      localStorage.setItem("token", token);

      // Lấy thông tin đầy đủ của user từ endpoint /users/me (đảm bảo token đã được lưu)
      let fullUser = userData;
      try {
        const meRes = await axios.get(USER_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fullUser = meRes.data;
      } catch (err) {
        // Nếu backend đã trả đầy đủ user trong login response thì vẫn ok,
        // nếu không thì log lỗi nhưng tiếp tục với userData (nếu có)
        console.warn("Không thể tải thông tin user đầy đủ sau khi login:", err);
      }

      // Lưu thông tin cục bộ
      if (fullUser?._id) localStorage.setItem("userId", fullUser._id);
      if (fullUser?.role) localStorage.setItem("userRole", fullUser.role);

      // Cập nhật state user với thông tin đầy đủ
      setUser(fullUser);

      // Điều hướng theo role
      setTimeout(() => {
        if (fullUser.role === "admin") navigate("/admin/dashboard");
        else navigate("/");
      }, 10);

      return true;
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  // 🔴 Đăng xuất
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Quên mật khẩu

export const useAuth = () => useContext(AuthContext);
