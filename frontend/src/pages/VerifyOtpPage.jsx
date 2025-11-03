// src/pages/VerifyOtpPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { Box, Input, Button, Text, VStack, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth/verify-reset-otp";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const email = localStorage.getItem("resetEmail");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(API_URL, { email, otp });
      setMessage(res.data.message);
      navigate("/reset-password");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi xác thực OTP");
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
        Xác nhận OTP
      </Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={3}>
          <Input
            type="text"
            placeholder="Nhập mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <Button colorScheme="blue" type="submit">
            Xác nhận
          </Button>
          {message && <Text color="green.500">{message}</Text>}
          {error && <Text color="red.500">{error}</Text>}
        </VStack>
      </form>
    </Box>
  );
}
