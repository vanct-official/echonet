// src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { Box, Input, Button, Text, VStack, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth/forgot-password";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.post(API_URL, { email });
      setMessage(res.data.message);
      // ✅ Lưu email tạm để chuyển tiếp qua các bước
      localStorage.setItem("resetEmail", email);
      navigate("/verify-otp");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi gửi OTP");
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
        Quên mật khẩu
      </Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={3}>
          <Input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button colorScheme="blue" type="submit">
            Gửi mã OTP
          </Button>
          {message && <Text color="green.500">{message}</Text>}
          {error && <Text color="red.500">{error}</Text>}
        </VStack>
      </form>
    </Box>
  );
}
