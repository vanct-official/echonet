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
      const { token, user: userData, role } = res.data;

      if (!token) throw new Error("Token not returned from API.");

      // ✅ Lưu thông tin vào localStorage
      localStorage.setItem("token", token);
      if (role) localStorage.setItem("userRole", role);
      setUser(userData || { username, role });

      // ✅ Chuyển hướng theo vai trò
      if (role === "admin") {
        navigate("/admin/dashboard"); // 👉 chuyển sang dashboard admin
      } else {
        navigate("/"); // user bình thường về trang chủ
      }

      return true;
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  // 🔴 Đăng xuất
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
