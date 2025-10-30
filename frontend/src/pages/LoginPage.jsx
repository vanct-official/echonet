import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useAuth } from "../context/AuthContext"; // ✅ import AuthContext

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const { login } = useAuth(); // ✅ Lấy hàm login từ context

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login(username, password);
      toast({
        title: "Đăng nhập thành công!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Đăng nhập thất bại.",
        description:
          error.response?.data?.message ||
          error.message ||
          "Không thể kết nối đến máy chủ.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      maxW="sm"
      mx="auto"
      mt={20}
      p={6}
      borderWidth="1px"
      borderRadius="md"
      boxShadow="lg"
    >
      <VStack spacing={4}>
        <Heading size="lg" mb={2} color="blue.500">
          Đăng Nhập
        </Heading>
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          isDisabled={isLoading}
        />
        <InputGroup size="md">
          <Input
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isDisabled={isLoading}
          />
          <InputRightElement width="4.5rem">
            <IconButton
              h="1.75rem"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
              aria-label={showPassword ? "Hide password" : "Show password"}
              variant="ghost"
              isDisabled={isLoading}
            />
          </InputRightElement>
        </InputGroup>

        <Box w="full" textAlign="right">
          <Link to="/forgot-password">
            <Text fontSize="sm" color="blue.500" fontWeight="medium">
              Quên Mật khẩu?
            </Text>
          </Link>
        </Box>

        <Button
          w="full"
          colorScheme="blue"
          onClick={handleLogin}
          isLoading={isLoading}
          loadingText="Đang đăng nhập"
          mt={2}
        >
          Login
        </Button>

        <Box pt={2}>
          <Text fontSize="sm">
            <span>Chưa có tài khoản? </span>
            <Link
              to="/register"
              style={{ color: "#3182CE", fontWeight: "bold" }}
            >
              Đăng Ký Ngay!
            </Link>
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
