import React from "react";
import {
  Box,
  VStack,
  Text,
  Heading,
  Icon,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom"; // 💡 Import Link và useLocation
import {
  FaTachometerAlt,
  FaUsers,
  FaNewspaper,
  FaCog,
  FaSignOutAlt,
  FaUserShield,
} from "react-icons/fa";

// Dữ liệu menu Admin
const adminMenuItems = [
  { name: "Dashboard", icon: FaTachometerAlt, path: "/admin/dashboard" },
  { name: "Quản lý Người dùng", icon: FaUsers, path: "/admin/users" },
  { name: "Quản lý Bài viết", icon: FaNewspaper, path: "/admin/posts" },
  { name: "Bài viết của tôi", icon: FaNewspaper, path: "/admin/myposts" },
  { name: "Cài đặt Chung", icon: FaCog, path: "/admin/settings" },
];

export default function AdminSidebar() {
  const location = useLocation(); // Hook để biết route hiện tại

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole"); // Xóa cả role nếu bạn có lưu
    // Chuyển hướng về trang đăng nhập
    window.location.href = "/login";
  };

  return (
    <Box
      w={{ base: "full", md: 64 }} // Chiều rộng 64 (256px)
      p={5}
      // Tạo thanh sidebar cố định
      position="fixed"
      top={0}
      h={{ base: "auto", md: "100vh" }}
      borderRightWidth="1px"
      bg="gray.50" // Nền sáng hơn
    >
      <VStack align="stretch" spacing={6}>
        {/* Tiêu đề Dashboard */}
        <Heading size="md" color="blue.600" display="flex" alignItems="center">
          <Icon as={FaUserShield} mr={2} />
          ADMIN PANEL
        </Heading>

        {/* Menu Điều hướng */}
        <VStack align="stretch" spacing={1}>
          {adminMenuItems.map((item) => (
            <ChakraLink
              as={RouterLink}
              to={item.path}
              key={item.path}
              p={3}
              borderRadius="md"
              // Xác định xem đây có phải là route hiện tại không
              bg={location.pathname === item.path ? "blue.500" : "transparent"}
              color={location.pathname === item.path ? "white" : "gray.700"}
              fontWeight={location.pathname === item.path ? "bold" : "normal"}
              _hover={{
                bg: location.pathname === item.path ? "blue.600" : "gray.200",
                color: location.pathname === item.path ? "white" : "gray.800",
              }}
              display="flex"
              alignItems="center"
            >
              <Icon as={item.icon} mr={3} />
              <Text>{item.name}</Text>
            </ChakraLink>
          ))}
        </VStack>

        <Box h="1px" bg="gray.300" my={4} />

        {/* Nút Đăng xuất */}
        <ChakraLink
          p={3}
          borderRadius="md"
          color="red.600"
          fontWeight="medium"
          _hover={{ bg: "red.50" }}
          display="flex"
          alignItems="center"
          onClick={handleLogout}
        >
          <Icon as={FaSignOutAlt} mr={3} />
          Đăng xuất
        </ChakraLink>
      </VStack>
    </Box>
  );
}
