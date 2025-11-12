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
} from "@chakra-ui/react";
import {
  FaUsers,
  FaChartLine,
  FaEnvelopeOpenText,
  FaNewspaper,
  FaUserShield,
  FaFileAlt,
  FaCheckCircle,
  FaRegFileAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";

// API endpoint
const STATS_API_URL = "http://localhost:5000/api/admin/statistics";
const POSTS_STATS_API_URL = "http://localhost:5000/api/admin/post-statistics";

// Stat Card component
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
    normalUsers: 0,
    admins: 0,
    totalPosts: 0,
    unverifiedUsers: 0,
  });

  const [postStats, setPostStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
  });

  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch USER statistics
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
          description: "Không thể lấy dữ liệu thống kê người dùng.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchStats();
  }, [token]);

  // Fetch POST statistics
  useEffect(() => {
    const fetchPostStats = async () => {
      try {
        const res = await axios.get(POSTS_STATS_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPostStats(res.data);
      } catch (err) {
        console.error("Error fetching post stats:", err);
        toast({
          title: "Lỗi tải thống kê bài viết",
          description: "Không thể lấy dữ liệu bài viết.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPostStats();
  }, [token]);

  if (loading) {
    return <Spinner size="xl" display="block" mx="auto" mt={20} />;
  }

  // Quick links
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
    <Flex w="100%" minH="100vh">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <Box ml="250px" flex="1" p={6}>
        <Heading mb={8} display="flex" alignItems="center">
          <Icon as={FaChartLine} mr={3} color="blue.500" />
          Bảng Điều Khiển Quản Trị
        </Heading>

        {/* USER STATS */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={10}>
          <StatCard
            icon={FaUsers}
            label="Tổng số Người dùng"
            number={(stats.totalUsers || 0).toLocaleString()}
            helpText={`+${stats.newUsersToday || 0} hôm nay`}
            color="teal.500"
          />
          <StatCard
            icon={FaUsers}
            label="Người dùng thường"
            number={(stats.normalUsers || 0).toLocaleString()}
            helpText="User có role = user"
            color="green.600"
          />
          <StatCard
            icon={FaUserShield}
            label="Quản trị viên"
            number={(stats.admins || 0).toLocaleString()}
            helpText="User có role = admin"
            color="blue.700"
          />
          <StatCard
            icon={FaEnvelopeOpenText}
            label="Chưa xác minh Email"
            number={(stats.unverifiedUsers || 0).toLocaleString()}
            helpText="Cần gửi email nhắc nhở"
            color="orange.500"
          />
        </SimpleGrid>

        {/* POST STATS */}
        <Heading size="md" mb={4}>
          Thống kê Bài viết
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={10}>
          <StatCard
            icon={FaFileAlt}
            label="Tổng số bài viết"
            number={(postStats.totalPosts || 0).toLocaleString()}
            helpText="Tổng tất cả bài"
            color="purple.600"
          />
          <StatCard
            icon={FaCheckCircle}
            label="Bài đã đăng"
            number={(postStats.publishedPosts || 0).toLocaleString()}
            helpText="Public"
            color="green.600"
          />
          <StatCard
            icon={FaRegFileAlt}
            label="Bài nháp"
            number={(postStats.draftPosts || 0).toLocaleString()}
            helpText="Chưa đăng"
            color="yellow.500"
          />
        </SimpleGrid>

        {/* Quick Links */}
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

        {/* Recent Activity */}
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
          <Heading size="md" mb={3}>
            Hoạt động Gần đây
          </Heading>
          <Text color="gray.500">
            [Khu vực này sẽ hiển thị các hoạt động quản trị hoặc lỗi hệ thống gần đây.]
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}
