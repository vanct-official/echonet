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

export default function RightSidebar() {
  const { user } = useAuth();
  const { colorMode } = useColorMode();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowing = async () => {
      const res = await getFollowedUsers();
      setFollowing(res);
      setLoading(false);
    };
    fetchFollowing();
  }, []);

  if (loading)
    return (
      <Box w="64" py={6} px={4} borderLeftWidth="1px">
        <Spinner display="block" mx="auto" />
      </Box>
    );

  return (
    <Box
      w="250px"
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

      {following.length === 0 ? (
        <Text color="gray.500" fontSize="sm">
          Bạn chưa theo dõi ai.
        </Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {following.map((f) => (
            <HStack
              key={f._id}
              spacing={3}
              p={2}
              borderRadius="md"
              cursor="pointer"
              align="center"
              _hover={{ bg: colorMode === "light" ? "gray.50" : "gray.700" }}
              onClick={() => navigate(`/user/${f._id}`)} // ✅ cập nhật đường dẫn đúng dạng của bạn
            >
              <Avatar size="sm" name={`${f.firstname} ${f.lastname}`} />
              <Box>
                <Text fontWeight="bold" fontSize="sm">
                  {f.firstname} {f.lastname}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  @{f.username}
                </Text>
              </Box>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
