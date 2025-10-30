import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios"; // 💡 Đã thêm import axios
import LoginPage from "./pages/LoginPage.jsx";
import HomeFeed from "./pages/HomeFeed.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import UserProfilePage from "./pages/UserProfile.jsx";
import AdminUsersPage from "./pages/AdminPages/AdminUser.jsx";
import AdminDashboard from "./pages/AdminPages/AdminDashboard.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  // Loại bỏ [loadingUser, setLoadingUser] để đơn giản hóa,
  // vì ProtectedRoute sẽ tự động xử lý việc chuyển hướng nếu không có token.

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Lỗi lấy thông tin người dùng hiện tại:", err);
        // Xóa token nếu API trả về 401 (token hết hạn/sai)
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // KHÔNG cần spinner Loading ở đây nếu ProtectedRoute xử lý việc chuyển hướng/chờ đợi

  return (
    <Router>
      <AuthProvider>
        {/* 💡 BAO BỌC VỚI CHAT PROVIDER */}
        <Routes>
          <Route
            path="/login"
            element={<LoginPage setCurrentUser={setCurrentUser} />}
          />{" "}
          {/* Truyền setter */}
          <Route path="/register" element={<RegisterPage />} />
          {/* Truyền currentUser vào các Route cần dùng */}
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={!!currentUser}>
                <HomeFeed currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute isAuthenticated={!!currentUser}>
                <MyProfile currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute isAuthenticated={!!currentUser}>
                <SearchPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/:id"
            element={
              <ProtectedRoute isAuthenticated={!!currentUser}>
                <UserProfilePage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute currentUser={currentUser}>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute currentUser={currentUser}>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute currentUser={currentUser}>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
        </Routes>
        {/* 💡 HẾT BAO BỌC */}
      </AuthProvider>
    </Router>
  );
}
