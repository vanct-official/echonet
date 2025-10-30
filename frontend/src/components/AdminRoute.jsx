import React from "react";
import { Navigate } from "react-router-dom";
import { Box, Text, Spinner } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth(); // ✅ Đúng key rồi
  const token = localStorage.getItem("token");

  // 🟡 Nếu chưa có token => chuyển hướng đến trang đăng nhập
  if (!token) return <Navigate to="/login" replace />;

  // 🟡 Nếu đang tải => hiển thị loading
  if (loading)
    return (
      <Box pt={20} textAlign="center">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text mt={3}>Đang tải dữ liệu người dùng...</Text>
      </Box>
    );

  // 🔴 Nếu không phải admin => quay lại trang chủ
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  // ✅ Nếu là admin => render component con
  return children;
}
