import React, { useEffect } from "react";
import {
  Box,
  VStack,
  Button,
  Avatar,
  Text,
  HStack,
  Switch,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  useColorMode,
  useColorModeValue,
  Divider,
  Tooltip,
  keyframes,
} from "@chakra-ui/react";
import {
  FaHome,
  FaUser,
  FaComment,
  FaCog,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaSearch,
  FaBell,
  FaEllipsisH,
} from "react-icons/fa";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotification";
import EchoNetLight from "/images/EchoNetLight.png";
import EchoNetDark from "/images/Echonet.png";

// Animation rung chuông
const shake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
`;

export default function Sidebar() {
  const { user, logout, loading } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications(user);

  const sidebarBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const activeColor = useColorModeValue("blue.500", "blue.300");
  const mutedColor = useColorModeValue("gray.600", "gray.400");

  const menuItems = [
    { icon: FaHome, label: "Home", path: "/" },
    { icon: FaSearch, label: "Search", path: "/search" },
    { icon: FaUser, label: "Profile", path: "/profile" },
    { icon: FaComment, label: "Messages", path: "/chat" },
    { icon: FaBell, label: "Notifications", path: "/notifications", badge: unreadCount },
  ];

  // Hiệu ứng rung chuông
  useEffect(() => {
    if (unreadCount > 0) {
      const bellIcon = document.getElementById("bell-icon");
      if (bellIcon) {
        bellIcon.style.animation = `${shake} 0.5s ease-in-out infinite`;
      }
    } else {
      const bellIcon = document.getElementById("bell-icon");
      if (bellIcon) {
        bellIcon.style.animation = "none";
      }
    }
  }, [unreadCount]);

  if (loading || !user) return null;

  return (
    <Box
      w="64"
      px={{ base: 2, md: 4 }}
      py={4}
      borderRightWidth="1px"
      borderColor={borderColor}
      h="100vh"
      position="fixed"
      top={0}
      left={0}
      bg={sidebarBg}
      overflowY="auto"
      boxShadow="sm"
    >
      {/* Logo với styling lebih đẹp */}
      <Box mb={8} textAlign="center">
        <img
          src={colorMode === "light" ? EchoNetLight : EchoNetDark}
          alt="EchoNet Logo"
          style={{
            width: "120px",
            height: "auto",
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        />
      </Box>

      <Divider borderColor={borderColor} my={6} />

      {/* Menu chính */}
      <VStack align="stretch" spacing={2} mb={6}>
        {menuItems.map((item) => (
          <Tooltip key={item.path} label={item.label} placement="right">
            <Button
              leftIcon={<item.icon />}
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              onClick={() => navigate(item.path)}
              _hover={{
                bg: hoverBg,
                pl: 4,
                transition: "all 0.2s ease",
              }}
              _active={{
                bg: "blue.100",
                _dark: { bg: "blue.900" },
              }}
              position="relative"
              fontWeight="500"
            >
              <Text flex="1" textAlign="left">
                {item.label}
              </Text>
              {item.badge && item.badge > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  ml={2}
                  animation={`${shake} 0.5s ease-in-out infinite`}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </Badge>
              )}
            </Button>
          </Tooltip>
        ))}
      </VStack>

      <Divider borderColor={borderColor} my={6} />

      {/* User Profile Section */}
      <VStack align="stretch" spacing={4} mt="auto">
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
                name={user.username}
                src={user.avatar || undefined}
                border="2px solid"
                borderColor={activeColor}
              />
              <VStack align="start" spacing={0} flex="1" overflow="hidden">
                <Text fontWeight="bold" fontSize="sm" isTruncated color={textColor}>
                  {user.firstname} {user.lastname}
                </Text>
                <Text fontSize="xs" color={mutedColor} isTruncated>
                  @{user.username}
                </Text>
              </VStack>
            </HStack>
          </MenuButton>

          <MenuList>
            <MenuItem
              icon={<FaUser />}
              onClick={() => navigate("/profile")}
            >
              Hồ sơ cá nhân
            </MenuItem>
            <MenuItem icon={<FaCog />}>
              Cài đặt tài khoản
            </MenuItem>

            <MenuDivider />

            <MenuItem closeOnSelect={false}>
              <HStack justify="space-between" w="full">
                <HStack spacing={2}>
                  {colorMode === "light" ? <FaSun /> : <FaMoon />}
                  <Text fontSize="sm">
                    {colorMode === "light" ? "Sáng" : "Tối"}
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
              onClick={logout}
              fontWeight="500"
            >
              Đăng xuất
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Footer info */}
        <Text fontSize="xs" color={mutedColor} textAlign="center" px={2}>
          EchoNet © 2025
        </Text>
      </VStack>
    </Box>
  );
}
