import React from "react";
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
} from "react-icons/fa";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotification"; // ✅ Import hook
import EchoNetLight from "/images/EchoNetLight.png";
import EchoNetDark from "/images/Echonet.png";

export default function Sidebar() {
  const { user, logout, loading } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications(user); // ✅ Dữ liệu từ socket + API

  if (loading || !user) return null;

  return (
    <Box
      w="64"
      px={2}
      py={4}
      borderRightWidth="1px"
      borderColor="gray.200"
      h="100vh"
      position="fixed"
      top={0}
      left={0}
      bg={colorMode === "light" ? "white" : "gray.800"}
    >
      {/* Logo */}
      <Box mb={6} textAlign="center">
        <img
          src={colorMode === "light" ? EchoNetLight : EchoNetDark}
          alt="EchoNet Logo"
          style={{ width: "120px", height: "auto" }}
        />
      </Box>

      <Box h="1px" bg="gray.200" my={6} />

      {/* Menu chính */}
      <VStack align="start" spacing={4}>
        <Button leftIcon={<FaHome />} variant="ghost" w="full" justifyContent="flex-start" onClick={() => navigate("/")}>
          Home
        </Button>
        <Button leftIcon={<FaSearch />} variant="ghost" w="full" justifyContent="flex-start" onClick={() => navigate("/search")}>
          Search
        </Button>
        <Button leftIcon={<FaUser />} variant="ghost" w="full" justifyContent="flex-start" onClick={() => navigate("/profile")}>
          Profile
        </Button>
        <Button leftIcon={<FaComment />} variant="ghost" w="full" justifyContent="flex-start" onClick={() => navigate("/chat")}>
          Messages
        </Button>

        {/* ✅ Notifications */}
        <Button
  leftIcon={<FaBell id="bell-icon" />} // gán id để rung
  variant="ghost"
  w="full"
  justifyContent="flex-start"
  onClick={() => navigate("/notifications")}
  position="relative"
>
  Notifications
  {unreadCount > 0 && (
    <Badge
      colorScheme="red"
      borderRadius="full"
      position="absolute"
      top="5px"
      right="10px"
      fontSize="0.8em"
    >
      {unreadCount}
    </Badge>
  )}
</Button>

      </VStack>

      <Box h="1px" bg="gray.200" my={6} />

      {/* Menu người dùng */}
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} w="full" variant="ghost" p={0} height="auto">
          <HStack spacing={3} p={1}>
            <Avatar size="sm" name={user.username} src={user.avatar || undefined} />
            <VStack align="start" spacing={0} flex="1" overflow="hidden">
              <Text fontWeight="bold" isTruncated>
                {user.firstname} {user.lastname}
              </Text>
              <Text fontSize="sm" color="gray.500" isTruncated>
                @{user.username}
              </Text>
            </VStack>
          </HStack>
        </MenuButton>

        <MenuList>
          <MenuItem icon={<FaCog />}>Cài đặt tài khoản</MenuItem>
          <MenuItem closeOnSelect={false}>
            <HStack justify="space-between" w="full">
              <HStack spacing={2}>
                {colorMode === "light" ? <FaSun /> : <FaMoon />}
                <Text>Chế độ {colorMode === "light" ? "Sáng" : "Tối"}</Text>
              </HStack>
              <Switch isChecked={colorMode === "dark"} onChange={toggleColorMode} />
            </HStack>
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<FaSignOutAlt />} color="red.500" onClick={logout}>
            Đăng xuất
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
