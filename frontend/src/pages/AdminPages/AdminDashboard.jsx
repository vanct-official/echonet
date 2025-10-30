import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  useToast,
  Spinner,
  Flex,
  Text,
  Button,
  VStack,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaChartLine,
  FaEnvelopeOpenText,
  FaNewspaper,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";

// Giả định API endpoint để lấy các chỉ số thống kê
const STATS_API_URL = "http://localhost:5000/api/admin/stats";

// Component Card để hiển thị chỉ số
const StatCard = ({ icon, label, number, helpText, color }) => (
  <Stat
    p={5}
    shadow="md"
    border="1px"
    borderColor="gray.200"
    borderRadius="lg"
    bg="white"
  >
    <Flex justifyContent="space-between" alignItems="center">
      <Box>
        <StatLabel fontWeight="medium" isTruncated>
          {label}
        </StatLabel>
        <StatNumber fontSize="3xl">{number}</StatNumber>
        <StatHelpText>{helpText}</StatHelpText>
      </Box>
      <Icon as={icon} w={12} h={12} color={color} />
    </Flex>
  </Stat>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    totalPosts: 0,
    unverifiedUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(STATS_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        toast({
          title: "Lỗi tải Dashboard",
          description: "Không thể lấy dữ liệu thống kê.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return <Spinner size="xl" display="block" mx="auto" mt={20} />;
  }

  // Danh sách các liên kết nhanh (Quick Links)
  const quickLinks = [
    {
      label: "Quản lý Người dùng",
      icon: FaUserShield,
      path: "/admin/users",
      color: "blue",
    },
    {
      label: "Quản lý Bài viết",
      icon: FaNewspaper,
      path: "/admin/posts",
      color: "purple",
    },
    {
      label: "Cài đặt Chung",
      icon: FaChartLine,
      path: "/admin/settings",
      color: "gray",
    },
  ];

  return (
    // 💡 SỬ DỤNG FLEX LAYOUT ĐỂ HIỂN THỊ SIDEBAR VÀ NỘI DUNG CẠNH NHAU
    <Flex maxW="1500px" mx="auto" minH="100vh" gap={0}>
        
      {/* 1. ADMIN SIDEBAR */}
      <AdminSidebar />
    <Box maxW="1200px" mx="auto" p={6}>
      <Heading mb={8} display="flex" alignItems="center">
        <Icon as={FaChartLine} mr={3} color="blue.500" />
        Bảng Điều Khiển Quản Trị
      </Heading>

      {/* 1. Các Chỉ số Tổng quan */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={10}>
        <StatCard
          icon={FaUsers}
          label="Tổng số Người dùng"
          number={stats.totalUsers.toLocaleString()}
          helpText={`+${stats.newUsersToday} hôm nay`}
          color="teal.500"
        />
        <StatCard
          icon={FaNewspaper}
          label="Tổng số Bài viết"
          number={stats.totalPosts.toLocaleString()}
          helpText="Tăng trưởng ổn định"
          color="red.500"
        />
        <StatCard
          icon={FaEnvelopeOpenText}
          label="Chưa xác minh Email"
          number={stats.unverifiedUsers.toLocaleString()}
          helpText="Cần gửi email nhắc nhở"
          color="orange.500"
        />
        <StatCard
          icon={FaUserShield}
          label="Quản trị viên"
          number="4" // Giả định
          helpText="Đảm bảo an toàn hệ thống"
          color="blue.500"
        />
      </SimpleGrid>

      {/* 2. Liên kết Nhanh */}
      <Box mb={10}>
        <Heading size="md" mb={4}>
          Liên kết Nhanh
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {quickLinks.map((link) => (
            <Button
              key={link.path}
              leftIcon={<Icon as={link.icon} />}
              colorScheme={link.color}
              variant="outline"
              h="100px"
              fontSize="xl"
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </Button>
          ))}
        </SimpleGrid>
      </Box>

      {/* 3. Lịch sử hoạt động (Tùy chọn - Giữ chỗ) */}
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
        <Heading size="md" mb={3}>
          Hoạt động Gần đây
        </Heading>
        <Text color="gray.500">
          [Khu vực này có thể hiển thị các hành động quản trị viên mới nhất hoặc
          các báo cáo lỗi.]
        </Text>
      </Box>
    </Box>
    </Flex>
  );
}
