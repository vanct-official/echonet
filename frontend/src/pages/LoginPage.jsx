import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Heading,
  useToast,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  IconButton,
  Text,
  Link as ChakraLink,
  Center,
  Divider,
  useColorModeValue,
  Avatar,
  Stack,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, EmailIcon, LockIcon } from "@chakra-ui/icons";
import { Link, useNavigate } from "react-router-dom";
import EchoNetLight from "/images/EchoNetLight.png";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Color mode values
  const cardBg = useColorModeValue("white", "gray.700");
  const pageBg = useColorModeValue("gray.50", "gray.800");
  const subtle = useColorModeValue("gray.500", "gray.300");
  const inputBg = useColorModeValue("gray.50", "gray.900");
  const focusBg = useColorModeValue("white", "gray.800");

  const handleLogin = async () => {
    // Validation
    if (!username.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên đăng nhập.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mật khẩu.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      toast({
        title: "Đăng nhập thành công! 🎉",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Đăng nhập thất bại",
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

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin();
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 8, md: 16 }} px={4}>
      <Center>
        <Box
          w={{ base: "full", md: "900px" }}
          bg={cardBg}
          borderRadius="xl"
          boxShadow="lg"
          overflow="hidden"
          display="flex"
        >
          {/* Left visual side */}
          <Box
            display={{ base: "none", md: "block" }}
            w="45%"
            bgGradient="linear(to-b, blue.400, blue.600)"
            color="white"
            p={8}
          >
            <Center h="100%" flexDirection="column" textAlign="center">
              <img
                src={EchoNetLight}
                alt="EchoNet"
                style={{ width: "120px", marginBottom: "20px" }}
              />{" "}
              <Heading size="lg" mb={4} color="white">
                EchoNet
              </Heading>
              <Text opacity={0.95} mb={6} fontSize="sm" lineHeight={1.6}>
                Kết nối với những người có cùng sở thích, chia sẻ những khoảnh
                khắc đặc biệt, và khám phá nội dung từ cộng đồng.
              </Text>
              <Divider borderColor="whiteAlpha.300" my={6} />
              <VStack spacing={3} align="start" fontSize="sm" opacity={0.9}>
                <Text>✨ Kết nối với bạn bè</Text>
                <Text>💬 Chia sẻ các bài viết</Text>
                <Text>❤️ Tương tác với cộng đồng</Text>
              </VStack>
            </Center>
          </Box>

          {/* Right login form */}
          <Box w={{ base: "100%", md: "55%" }} p={{ base: 6, md: 8 }}>
            <Stack spacing={6}>
              <Box>
                <Heading as="h1" size="lg" color="blue.500" mb={2}>
                  Đăng Nhập
                </Heading>
                <Text color={subtle} fontSize="sm">
                  Quay lại với cộng đồng của bạn
                </Text>
              </Box>

              <Divider />

              <VStack spacing={4} align="stretch">
                {/* Username input */}
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    mb={2}
                    color="gray.700"
                    _dark={{ color: "gray.300" }}
                  >
                    Tên đăng nhập
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <EmailIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Nhập tên đăng nhập"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyPress={handleKeyPress}
                      isDisabled={isLoading}
                      bg={inputBg}
                      _focus={{
                        bg: focusBg,
                        borderColor: "blue.500",
                      }}
                      size="lg"
                    />
                  </InputGroup>
                </Box>

                {/* Password input */}
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    mb={2}
                    color="gray.700"
                    _dark={{ color: "gray.300" }}
                  >
                    Mật khẩu
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <LockIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Nhập mật khẩu"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      isDisabled={isLoading}
                      bg={inputBg}
                      _focus={{
                        bg: focusBg,
                        borderColor: "blue.500",
                      }}
                      size="lg"
                    />
                    <InputRightElement>
                      <IconButton
                        h="full"
                        size="lg"
                        onClick={() => setShowPassword(!showPassword)}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                        variant="ghost"
                        isDisabled={isLoading}
                      />
                    </InputRightElement>
                  </InputGroup>
                </Box>

                {/* Forgot password link */}
                <HStack justify="flex-end">
                  <Link to="/forgot-password">
                    <Text
                      fontSize="sm"
                      color="blue.500"
                      fontWeight="500"
                      _hover={{ textDecoration: "underline" }}
                    >
                      Quên mật khẩu?
                    </Text>
                  </Link>
                </HStack>

                {/* Login button */}
                <Button
                  w="full"
                  colorScheme="blue"
                  onClick={handleLogin}
                  isLoading={isLoading}
                  loadingText="Đang đăng nhập..."
                  size="lg"
                  mt={2}
                  _hover={{
                    boxShadow: "md",
                  }}
                >
                  Đăng Nhập
                </Button>

                {/* Divider */}
                <HStack spacing={4} my={2}>
                  <Divider />
                  <Text fontSize="sm" color={subtle} whiteSpace="nowrap">
                    Hoặc
                  </Text>
                  <Divider />
                </HStack>

                {/* Sign up link */}
                <Box textAlign="center">
                  <Text fontSize="sm" color={subtle} mb={2}>
                    Chưa có tài khoản?
                  </Text>
                  <Link to="/register">
                    <Button
                      w="full"
                      variant="outline"
                      colorScheme="blue"
                      size="lg"
                    >
                      Đăng Ký Ngay
                    </Button>
                  </Link>
                </Box>
              </VStack>

              {/* Footer text */}
              <Text fontSize="xs" color={subtle} textAlign="center" mt={4}>
                Bằng cách đăng nhập, bạn đồng ý với Điều khoản sử dụng của chúng
                tôi.
              </Text>
            </Stack>
          </Box>
        </Box>
      </Center>
    </Box>
  );
}
