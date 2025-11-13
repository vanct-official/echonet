import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Link as ChakraLink,
  Button,
  useColorMode,
  useColorModeValue,
  Avatar,
  Badge,
  Divider,
  Tooltip,
  Switch,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaNewspaper,
  FaCog,
  FaSignOutAlt,
  FaUserShield,
  FaComment,
  FaMoon,
  FaSun,
  FaHome,
} from "react-icons/fa";
import { ChevronDownIcon } from "@chakra-ui/icons";
import EchoNetLight from "/images/EchoNetLight.png";
import { useAuth } from "../context/AuthContext";

// Dữ liệu menu Admin
const adminMenuItems = [
  { name: "Dashboard", icon: FaTachometerAlt, path: "/admin/dashboard" },
  { name: "Quản lý Người dùng", icon: FaUsers, path: "/admin/users" },
  { name: "Quản lý Bài viết", icon: FaNewspaper, path: "/admin/posts" },
  { name: "Bài viết của tôi", icon: FaNewspaper, path: "/admin/myposts" },
  { name: "Trò chuyện", icon: FaComment, path: "/admin/chat" },
  { name: "Cài đặt Chung", icon: FaCog, path: "/admin/settings" },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  // Color mode values
  const sidebarBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const activeBg = useColorModeValue("blue.500", "blue.600");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("blue.50", "blue.900");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    logout();
    window.location.href = "/login";
  };

  return (
    <Box
      w="64"
      px={{ base: 3, md: 4 }}
      py={4}
      position="fixed"
      top={0}
      left={0}
      h="100vh"
      borderRightWidth="1px"
      borderColor={borderColor}
      bg={sidebarBg}
      overflowY="auto"
      boxShadow="sm"
    >
      <VStack align="stretch" spacing={6} h="full">
        {/* Logo & Title */}
        <Box textAlign="center">
          <img src={EchoNetLight} alt="Logo" style={{ width: "120px", marginBottom: "20px" }} />
          <HStack
            bg={cardBg}
            p={3}
            borderRadius="lg"
            justify="center"
            spacing={2}
            mb={2}
          >
            <Icon as={FaUserShield} color="blue.500" boxSize={6} />
            <Heading size="md" color="blue.600">
              Admin
            </Heading>
          </HStack>
          <Badge colorScheme="blue" variant="subtle">
            Panel Control
          </Badge>
        </Box>

        <Divider borderColor={borderColor} />

        {/* Menu Items */}
        <VStack align="stretch" spacing={1} flex="1">
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip
                key={item.path}
                label={item.name}
                placement="right"
                hasArrow
              >
                <ChakraLink
                  as={RouterLink}
                  to={item.path}
                  p={3}
                  borderRadius="md"
                  bg={isActive ? activeBg : "transparent"}
                  color={isActive ? "white" : textColor}
                  fontWeight={isActive ? "bold" : "500"}
                  _hover={{
                    bg: isActive ? "blue.600" : hoverBg,
                    transform: "translateX(4px)",
                    transition: "all 0.2s ease",
                  }}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  transition="all 0.2s ease"
                  pl={isActive ? 4 : 3}
                >
                  <Icon as={item.icon} boxSize={5} />
                  <Text flex="1">{item.name}</Text>
                  {isActive && (
                    <Box
                      w={2}
                      h={2}
                      borderRadius="full"
                      bg="white"
                      animation="pulse 2s infinite"
                    />
                  )}
                </ChakraLink>
              </Tooltip>
            );
          })}
        </VStack>

        <Divider borderColor={borderColor} />

        {/* User Profile Section */}
        <VStack align="stretch" spacing={3} mt="auto">
          <Menu placement="top">
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              w="full"
              variant="ghost"
              p={3}
              height="auto"
              _hover={{ bg: hoverBg }}
              borderRadius="lg"
              justifyContent="flex-start"
            >
              <HStack spacing={3} w="full">
                <Avatar
                  size="md"
                  name={user?.username}
                  src={user?.avatar || undefined}
                  border="2px solid"
                  borderColor="blue.500"
                />
                <VStack align="start" spacing={0} flex="1" overflow="hidden">
                  <Text
                    fontWeight="bold"
                    fontSize="sm"
                    isTruncated
                    color={textColor}
                  >
                    {user?.firstname} {user?.lastname}
                  </Text>
                  <Badge colorScheme="purple" fontSize="10px">
                    Admin
                  </Badge>
                </VStack>
              </HStack>
            </MenuButton>

            <MenuList>
              <MenuItem
                icon={<FaHome />}
                onClick={() => navigate("/")}
              >
                Về trang chính
              </MenuItem>
              <MenuItem icon={<FaUserShield />}>
                Tài khoản Admin
              </MenuItem>

              <MenuDivider />

              <MenuItem closeOnSelect={false}>
                <HStack justify="space-between" w="full">
                  <HStack spacing={2}>
                    {colorMode === "light" ? (
                      <FaSun />
                    ) : (
                      <FaMoon />
                    )}
                    <Text fontSize="sm">
                      {colorMode === "light" ? "☀️ Sáng" : "🌙 Tối"}
                    </Text>
                  </HStack>
                  <Switch
                    isChecked={colorMode === "dark"}
                    onChange={toggleColorMode}
                    size="sm"
                  />
                </HStack>
              </MenuItem>

              <MenuDivider />

              <MenuItem
                icon={<FaSignOutAlt />}
                color="red.500"
                onClick={handleLogout}
                fontWeight="500"
              >
                Đăng xuất
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Quick Stats */}
          <Box
            bg={cardBg}
            p={3}
            borderRadius="lg"
            textAlign="center"
            fontSize="xs"
            color={mutedColor}
          >
            <Text fontWeight="600">EchoNet Admin</Text>
            <Text>© 2025</Text>
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
}
