import React, { useMemo, useState } from "react";
import {
  Box,
  Heading,
  VStack,
  Text,
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Badge,
  StackDivider,
  useColorModeValue,
  Spacer,
  Center,
  SlideFade,
} from "@chakra-ui/react";
import { FiCheck, FiCheckCircle, FiBell } from "react-icons/fi";
import Sidebar from "../components/Sidebar.jsx";
import { useNotifications } from "../hooks/useNotification";

const formatTimeAgo = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString();
};

export default function NotificationPage({ currentUser }) {
  const { notifications = [], markAsRead } = useNotifications(currentUser);
  const [loadingAll, setLoadingAll] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const bg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const accent = useColorModeValue("blue.500", "teal.300");
  const muted = useColorModeValue("gray.600", "gray.300");

  const handleMarkAll = async () => {
    if (!notifications.length) return;
    setLoadingAll(true);
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => markAsRead(n._id)));
    } finally {
      setLoadingAll(false);
    }
  };

  return (
    <Flex w="100%" minH="100vh" bg={bg}>
      <Sidebar user={currentUser} />
      <Box ml="250px" flex="1" p={{ base: 4, md: 8 }}>
        <Flex align="center" mb={6}>
          <HStack spacing={3}>
            <Box
              bg={accent}
              color="white"
              borderRadius="md"
              p={3}
              boxShadow="md"
            >
              <FiBell size={20} />
            </Box>
            <Heading size="lg">Thông báo</Heading>
            {unreadCount > 0 && (
              <Badge colorScheme="red" ml={2}>
                {unreadCount} mới
              </Badge>
            )}
          </HStack>
          <Spacer />
          <HStack>
            <Button
              size="sm"
              leftIcon={<FiCheck />}
              colorScheme="blue"
              variant="outline"
              onClick={handleMarkAll}
              isLoading={loadingAll}
              isDisabled={unreadCount === 0}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          </HStack>
        </Flex>

        <Box
          bg={cardBg}
          borderRadius="md"
          boxShadow="sm"
          p={{ base: 4, md: 6 }}
        >
          {notifications.length === 0 ? (
            <Center flexDir="column" py={16}>
              <Box
                mb={4}
                fontSize="48px"
                color={useColorModeValue("gray.300", "gray.500")}
              >
                🔔
              </Box>
              <Heading size="md" mb={2}>
                Không có thông báo
              </Heading>
              <Text color={muted} mb={4} textAlign="center" maxW="600px">
                Bạn sẽ nhận được thông báo khi có hoạt động liên quan đến
                bài viết, lượt thích hoặc lượt bình luận. Hãy khám phá và tương
                tác để nhận thông báo.
              </Text>
              <Button colorScheme="blue" onClick={() => window.location.assign("/")}>
                Về trang chính
              </Button>
            </Center>
          ) : (
            <VStack
              align="stretch"
              spacing={3}
              divider={<StackDivider borderColor={useColorModeValue("gray.100", "gray.600")} />}
            >
              {notifications.map((n) => (
                <SlideFade key={n._id} in offsetY="10px">
                  <Flex
                    align="start"
                    p={4}
                    bg={n.isRead ? useColorModeValue("gray.50", "gray.700") : useColorModeValue("yellow.50", "gray.600")}
                    borderRadius="md"
                    _hover={{ boxShadow: "md" }}
                    transition="all .15s"
                  >
                    <Box mr={4} mt={1}>
                      <Box
                        bg={n.isRead ? "transparent" : accent}
                        color={n.isRead ? muted : "white"}
                        borderRadius="full"
                        p={2}
                        display="inline-flex"
                      >
                        <FiCheckCircle />
                      </Box>
                    </Box>

                    <Box flex="1">
                      <Text fontWeight={n.isRead ? "semibold" : "bold"} mb={1}>
                        {n.message}
                      </Text>
                      <Text fontSize="sm" color={muted}>
                        {formatTimeAgo(n.createdAt)}
                      </Text>
                    </Box>

                    <Box ml={4} alignSelf="center">
                      {!n.isRead ? (
                        <Button size="sm" onClick={() => markAsRead(n._id)}>
                          Đã đọc
                        </Button>
                      ) : (
                        <Text fontSize="sm" color="green.400">
                          Đã đọc
                        </Text>
                      )}
                    </Box>
                  </Flex>
                </SlideFade>
              ))}
            </VStack>
          )}
        </Box>
      </Box>
    </Flex>
  );
}