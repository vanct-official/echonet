import { useState, useEffect } from "react";
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
  Heading, // 💡 Thêm Heading
  HStack, // 💡 Thêm HStack
  Divider, // 💡 Thêm Divider
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom"; // 💡 Import useNavigate
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/auth";

export default function RegisterPage() {
  const toast = useToast();
  const navigate = useNavigate(); // 💡 Khai báo useNavigate

  const [step, setStep] = useState(1); // 1: nhập thông tin, 2: nhập OTP
  const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái loading
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    phone: "",
    dob: "",
    gender: "true", // true=Nam, false=Nữ
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [otp, setOtp] = useState("");

  // Password strength
  useEffect(() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score += 20; // Yêu cầu 8 ký tự
    if (/[A-Z]/.test(p)) score += 20;
    if (/[a-z]/.test(p)) score += 20;
    if (/[0-9]/.test(p)) score += 20;
    if (/[^A-Za-z0-9]/.test(p)) score += 20;
    setPasswordStrength(score);
  }, [form.password]);

  // Lấy màu Progress Bar dựa trên điểm số
  const getPasswordProgressColor = (score) => {
    if (score < 40) return "red";
    if (score < 80) return "yellow";
    return "green";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Xóa lỗi ngay khi người dùng bắt đầu nhập lại
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Kiểm tra các trường bắt buộc
    Object.keys(form).forEach((key) => {
      if (typeof form[key] === "string" && !form[key].trim()) {
        // Bỏ qua confirmPassword nếu password trống
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
        gender: form.gender === "true", // Chuyển chuỗi "true"/"false" thành boolean
        confirmPassword: undefined, // Loại bỏ trường này trước khi gửi
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

      // 💡 HÀNH ĐỘNG MỚI: Chuyển hướng sang trang Đăng nhập
      navigate("/login");

      // Không cần setStep(1) hay reset form vì người dùng sẽ rời khỏi trang này
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

  return (
    <Box
      maxW="480px" // Tăng kích thước box
      mx="auto"
      mt={{ base: 4, md: 10 }}
      p={{ base: 6, md: 10 }}
      borderWidth="1px"
      borderRadius="xl" // Bo góc nhiều hơn
      boxShadow="lg"
    >
      <Heading as="h1" size="xl" mb={6} textAlign="center" color="blue.500">
        {step === 1 ? "Đăng Ký Tài Khoản" : "Xác Nhận Email (OTP)"}
      </Heading>
      <Divider mb={6} />

      <VStack spacing={5} align="stretch">
        {/* === STEP 1: Nhập thông tin đăng ký === */}
        {step === 1 && (
          <>
            <HStack spacing={4}>
              <FormControl isInvalid={!!errors.firstname}>
                <FormLabel>Họ</FormLabel>
                <Input
                  name="firstname"
                  value={form.firstname}
                  onChange={handleChange}
                  placeholder="Nguyễn/Trần..."
                />
                <FormErrorMessage>{errors.firstname}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.lastname}>
                <FormLabel>Tên</FormLabel>
                <Input
                  name="lastname"
                  value={form.lastname}
                  onChange={handleChange}
                  placeholder="Văn A / Thị B..."
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

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="vidu@email.com"
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.phone}>
              <FormLabel>Số điện thoại</FormLabel>
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="09xxxxxxxx"
              />
              <FormErrorMessage>{errors.phone}</FormErrorMessage>
            </FormControl>

            <HStack spacing={4}>
              <FormControl isInvalid={!!errors.dob}>
                <FormLabel>Ngày sinh</FormLabel>
                <Input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.dob}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Giới tính</FormLabel>
                <Select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange} // Sử dụng handleChange chung
                >
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </Select>
              </FormControl>
            </HStack>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel>Mật khẩu</FormLabel>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Ít nhất 8 ký tự"
              />
              <Progress
                value={passwordStrength}
                size="sm"
                mt={1}
                colorScheme={getPasswordProgressColor(passwordStrength)} // Màu dựa trên điểm
              />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Xác nhận mật khẩu</FormLabel>
              <Input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
              />
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>

            <Button
              colorScheme="blue"
              width="full"
              onClick={handleRegister}
              isLoading={isSubmitting}
              mt={3}
            >
              Đăng ký
            </Button>

            <Text fontSize="sm" textAlign="center" color="gray.500">
              Đã có tài khoản?
              <Button
                variant="link"
                colorScheme="blue"
                ml={1}
                onClick={() => navigate("/login")}
              >
                Đăng nhập ngay
              </Button>
            </Text>
          </>
        )}

        {/* === STEP 2: Nhập OTP === */}
        {step === 2 && (
          <VStack spacing={5}>
            <Text fontSize="lg" textAlign="center">
              Mã xác minh (OTP) đã được gửi tới:
              <Text
                as="span"
                fontWeight="bold"
                color="blue.500"
                display="block"
              >
                {form.email}
              </Text>
              Vui lòng kiểm tra hộp thư đến của bạn.
            </Text>
            <Input
              placeholder="Nhập 6 chữ số OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))} // Giới hạn 6 ký tự
              type="number" // Đảm bảo chỉ nhập số
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
            {/* Tùy chọn: Thêm nút Gửi lại OTP (logic cần được thêm vào backend) */}
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
