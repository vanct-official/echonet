import React, { useEffect, useState } from "react";
import { getFollowedUsers } from "../../services/userService";
import { Box, Text, VStack, Spinner } from "@chakra-ui/react";

const FollowedList = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]); // luôn là mảng
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      try {
        const data = await getFollowedUsers();

        // đảm bảo dữ liệu là mảng
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.warn("Dữ liệu từ API không phải mảng:", data);
          setUsers([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách người đã theo dõi:", err);
        setError("Không thể tải danh sách người theo dõi");
        setUsers([]); // tránh undefined
      } finally {
        setLoading(false);
      }
    };

    fetchFollowedUsers();
  }, []);

  // 🌀 Hiển thị khi đang tải
  if (loading) {
    return (
      <Box textAlign="center" mt={5}>
        <Spinner size="lg" />
        <Text mt={2}>Đang tải danh sách...</Text>
      </Box>
    );
  }

  // ⚠️ Hiển thị khi có lỗi
  if (error) {
    return (
      <Box textAlign="center" mt={5} color="red.500">
        <Text>{error}</Text>
      </Box>
    );
  }

  // ✅ Hiển thị danh sách
  return (
    <Box
      w="250px"
      borderRight="1px solid #ccc"
      p={3}
      h="100vh"
      bg="gray.50"
      overflowY="auto"
    >
      <Text fontWeight="bold" fontSize="lg" mb={3}>
        Người bạn theo dõi
      </Text>

      {users.length === 0 ? (
        <Text color="gray.500" textAlign="center">
          Bạn chưa theo dõi ai.
        </Text>
      ) : (
        <VStack align="stretch" spacing={2}>
          {users.map((user) => (
            <Box
              key={user._id}
              p={2}
              bg="white"
              borderRadius="md"
              boxShadow="sm"
              cursor="pointer"
              _hover={{ bg: "gray.100" }}
              onClick={() => onSelectUser && onSelectUser(user)}
            >
              <Text>{user.username}</Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default FollowedList;
