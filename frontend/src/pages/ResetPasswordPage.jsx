// src/pages/ResetPasswordPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { Box, Input, Button, Text, VStack, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth/reset-password";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const email = localStorage.getItem("resetEmail");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }
    try {
      const otp = localStorage.getItem("lastOtp") || prompt("Nhập lại OTP:");
      const res = await axios.post(API_URL, {
        email,
        otp,
        newPassword: password,
      });
      setMessage(res.data.message);
      localStorage.removeItem("resetEmail");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đặt lại mật khẩu");
    }
  };

  return (
    <Box
      maxW="md"
      mx="auto"
      mt="100px"
      p={6}
      borderWidth="1px"
      borderRadius="lg"
    >
      <Heading size="md" mb={4}>
        Đặt lại mật khẩu
      </Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={3}>
          <Input
            type="password"
            placeholder="Mật khẩu mới"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button colorScheme="blue" type="submit">
            Đặt lại mật khẩu
          </Button>
          {message && <Text color="green.500">{message}</Text>}
          {error && <Text color="red.500">{error}</Text>}
        </VStack>
      </form>
    </Box>
  );
}
