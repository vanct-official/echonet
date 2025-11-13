import React, { useState, useEffect } from "react";
import {
  Box,
  Input,
  Button,
  Text,
  VStack,
  Select,
  Progress,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Heading,
  HStack,
  Divider,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  IconButton,
  Avatar,
  Center,
  Stack,
  useColorModeValue,
  Link as ChakraLink,
} from "@chakra-ui/react";
import {
  ViewIcon,
  ViewOffIcon,
  EmailIcon,
  PhoneIcon,
  CalendarIcon,
  LockIcon,
} from "@chakra-ui/icons";
import EchoNetLight from "/images/EchoNetLight.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/auth";

export default function RegisterPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    phone: "",
    dob: "",
    gender: "true",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    const p = form.password || "";
    let score = 0;
    if (p.length >= 8) score += 20;
    if (/[A-Z]/.test(p)) score += 20;
    if (/[a-z]/.test(p)) score += 20;
    if (/[0-9]/.test(p)) score += 20;
    if (/[^A-Za-z0-9]/.test(p)) score += 20;
    setPasswordStrength(score);
  }, [form.password]);

  const getPasswordProgressColor = (score) => {
    if (score < 40) return "red";
    if (score < 80) return "yellow";
    return "green";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    Object.keys(form).forEach((key) => {
      if (typeof form[key] === "string" && !form[key].trim()) {
        if (key !== "confirmPassword" || form.password.trim()) {
          newErrors[key] = "Trường này là bắt buộc.";
        }
      }
    });

    if (form.password.length < 8 && form.password.length > 0)
      newErrors.password = "Mật khẩu phải ít nhất 8 ký tự.";
    if (!emailRegex.test(form.email) && form.email)
      newErrors.email = "Email không hợp lệ.";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/register`, {
        ...form,
        gender: form.gender === "true",
        confirmPassword: undefined,
      });

      toast({
        title: "Đăng ký thành công!",
        description:
          res.data.message || "Vui lòng kiểm tra email để nhận OTP xác minh.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setStep(2);
    } catch (err) {
      toast({
        title: "Đăng ký thất bại",
        description: err.response?.data?.message || "Lỗi server hoặc kết nối.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (otp.length !== 6)
      return toast({ title: "OTP phải có 6 chữ số.", status: "warning" });
    setIsSubmitting(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/confirm`, {
        email: form.email,
        otp,
      });

      toast({
        title: "Xác minh thành công! 🎉",
        description: res.data.message || "Tài khoản của bạn đã được kích hoạt.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      navigate("/login");
    } catch (err) {
      toast({
        title: "Xác nhận OTP thất bại",
        description:
          err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const pageBg = useColorModeValue("gray.50", "gray.800");
  const subtle = useColorModeValue("gray.500", "gray.300");

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 8, md: 16 }} px={4}>
      <Center>
        <Box
          w={{ base: "full", md: "960px" }}
          bg={cardBg}
          borderRadius="xl"
          boxShadow="lg"
          overflow="hidden"
          display="flex"
        >
          {/* Left visual */}
          <Box
            display={{ base: "none", md: "block" }}
            w="40%"
            bgGradient="linear(to-b, blue.400, blue.600)"
            color="white"
            p={8}
          >
            <Center h="100%" flexDirection="column">
              <img
                src={EchoNetLight}
                alt="EchoNet Logo"
                style={{ width: "120px", marginBottom: "20px" }}
              />
              <Heading size="md" mb={2} color="white">
                Chào mừng đến với EchoNet
              </Heading>
              <Text textAlign="center" opacity={0.9} px={3} fontSize="sm">
                Tạo tài khoản để kết nối, chia sẻ và khám phá nội dung thú vị.
              </Text>
            </Center>
          </Box>

          {/* Right form */}
          <Box w={{ base: "100%", md: "60%" }} p={{ base: 6, md: 8 }}>
            <Stack spacing={4}>
              <Heading as="h1" size="lg" textAlign="left" color="blue.500">
                {step === 1 ? "Đăng Ký" : "Xác Minh Email"}
              </Heading>
              <Text color={subtle} fontSize="sm" mb={2}>
                {step === 1
                  ? "Điền thông tin để tạo tài khoản."
                  : "Nhập mã OTP được gửi tới email của bạn."}
              </Text>
              <Divider />

              {step === 1 ? (
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <FormControl isInvalid={!!errors.firstname}>
                      <FormLabel>Họ</FormLabel>
                      <Input
                        name="firstname"
                        value={form.firstname}
                        onChange={handleChange}
                        placeholder="Nguyễn / Trần"
                      />
                      <FormErrorMessage>{errors.firstname}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.lastname}>
                      <FormLabel>Tên</FormLabel>
                      <Input
                        name="lastname"
                        value={form.lastname}
                        onChange={handleChange}
                        placeholder="Văn A / Thị B"
                      />
                      <FormErrorMessage>{errors.lastname}</FormErrorMessage>
                    </FormControl>
                  </HStack>

                  <FormControl isInvalid={!!errors.username}>
                    <FormLabel>Username</FormLabel>
                    <Input
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Tên đăng nhập"
                    />
                    <FormErrorMessage>{errors.username}</FormErrorMessage>
                  </FormControl>

                  <HStack spacing={3}>
                    <FormControl isInvalid={!!errors.email}>
                      <FormLabel>Email</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <EmailIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="vidu@email.com"
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.phone}>
                      <FormLabel>Số điện thoại</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <PhoneIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="09xxxxxxxx"
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.phone}</FormErrorMessage>
                    </FormControl>
                  </HStack>

                  <HStack spacing={3}>
                    <FormControl isInvalid={!!errors.dob}>
                      <FormLabel>Ngày sinh</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <CalendarIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type="date"
                          name="dob"
                          value={form.dob}
                          onChange={handleChange}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.dob}</FormErrorMessage>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Giới tính</FormLabel>
                      <Select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                      >
                        <option value="true">Nam</option>
                        <option value="false">Nữ</option>
                      </Select>
                    </FormControl>
                  </HStack>

                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel>Mật khẩu</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <LockIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Ít nhất 8 ký tự"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={
                            showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                          }
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowPassword((s) => !s)}
                        />
                      </InputRightElement>
                    </InputGroup>

                    <Progress
                      value={passwordStrength}
                      size="sm"
                      mt={2}
                      colorScheme={getPasswordProgressColor(passwordStrength)}
                      borderRadius="sm"
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Mật khẩu nên có chữ hoa, chữ thường, số và ký tự đặc biệt.
                    </Text>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.confirmPassword}>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={
                            showConfirmPassword
                              ? "Ẩn mật khẩu"
                              : "Hiện mật khẩu"
                          }
                          icon={
                            showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />
                          }
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowConfirmPassword((s) => !s)}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>
                      {errors.confirmPassword}
                    </FormErrorMessage>
                  </FormControl>

                  <Button
                    colorScheme="blue"
                    width="full"
                    onClick={handleRegister}
                    isLoading={isSubmitting}
                    mt={2}
                  >
                    Đăng ký
                  </Button>

                  <Text fontSize="sm" textAlign="center" color="gray.500">
                    Đã có tài khoản?{" "}
                    <ChakraLink
                      color="blue.500"
                      onClick={() => navigate("/login")}
                    >
                      Đăng nhập
                    </ChakraLink>
                  </Text>
                </VStack>
              ) : (
                <VStack spacing={4}>
                  <Text textAlign="center">
                    Mã xác minh (OTP) đã được gửi tới:
                  </Text>
                  <Text fontWeight="bold" color="blue.500">
                    {form.email}
                  </Text>

                  <Input
                    placeholder="Nhập 6 chữ số OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    type="number"
                    size="lg"
                    textAlign="center"
                  />

                  <Button
                    colorScheme="green"
                    width="full"
                    onClick={handleConfirmOtp}
                    isLoading={isSubmitting}
                  >
                    Xác nhận OTP
                  </Button>

                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    Không nhận được mã?{" "}
                    <ChakraLink
                      color="blue.500"
                      onClick={() => {
                        toast({
                          title: "Vui lòng gửi lại OTP từ backend",
                          status: "info",
                        });
                      }}
                    >
                      Gửi lại
                    </ChakraLink>
                  </Text>
                </VStack>
              )}
            </Stack>
          </Box>
        </Box>
      </Center>
    </Box>
  );
}
