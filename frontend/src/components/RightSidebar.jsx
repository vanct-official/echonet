import { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Avatar,
  Text,
  Spinner,
  HStack,
  useColorMode,
} from "@chakra-ui/react";
import { getFollowedUsers } from "../services/userService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function RightSidebar({ refreshTrigger }) {
  const { user } = useAuth();
  const { colorMode } = useColorMode();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        setLoading(true);

        // 🧠 Chỉ gọi API nếu đã đăng nhập
        if (!user || !user._id) {
          setFollowing([]);
          setLoading(false);
          return;
        }

        const res = await getFollowedUsers();

        // ✅ Đảm bảo kết quả là mảng
        setFollowing(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách theo dõi:", err);
        setFollowing([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [user, refreshTrigger]); // refreshTrigger giúp reload khi follow/unfollow

  // 🌀 Trạng thái loading
  if (loading) {
    return (
      <Box w="64" py={6} px={4} borderLeftWidth="1px">
        <Spinner display="block" mx="auto" />
      </Box>
    );
  }

  // 🧱 Render giao diện
  return (
    <Box
      w="64"
      px={4}
      py={6}
      borderLeftWidth="1px"
      borderColor={colorMode === "light" ? "gray.200" : "gray.700"}
      h="100vh"
      position="fixed"
      top={0}
      right={0}
      overflowY="auto"
      bg={colorMode === "light" ? "white" : "gray.800"}
      display={{ base: "none", xl: "block" }}
      zIndex={5}
    >
      <Text fontWeight="bold" mb={4} fontSize="lg">
        Đang theo dõi
      </Text>

      {!following || following.length === 0 ? (
        <Text color="gray.500" fontSize="sm">
          Bạn chưa theo dõi ai.
        </Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {following.map((f) => {
            if (!f || !f._id) return null;
            return (
              <HStack
                key={f._id}
                spacing={3}
                p={2}
                borderRadius="md"
                cursor="pointer"
                align="center"
                _hover={{
                  bg: colorMode === "light" ? "gray.50" : "gray.700",
                }}
                onClick={() => navigate(`/user/${f._id}`)}
              >
                <Avatar
                  size="sm"
                  name={`${f.firstname || ""} ${f.lastname || ""}`}
                  src={f.avatar || ""}
                />
                <Box>
                  <Text fontWeight="bold" fontSize="sm">
                    {`${f.firstname || ""} ${f.lastname || ""}`.trim() ||
                      f.username ||
                      "Người dùng"}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    @{f.username || "ẩn danh"}
                  </Text>
                </Box>
              </HStack>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
