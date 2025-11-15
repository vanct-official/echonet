import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Avatar,
  Flex,
  Text,
  HStack,
  IconButton,
  Button,
  VStack,
  SimpleGrid,
  Image,
  Box,
  Badge,
  Input,
  useColorModeValue,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { FaComment } from "react-icons/fa";
import VerifiedBadgeSVG from "/verified-badge-svgrepo-com.svg";

const VerifiedBadgeIcon = () => (
  <Image src={VerifiedBadgeSVG} alt="Verified Badge" w="16px" h="16px" ml={1} display="inline-block" />
);

export default function AdminPostDetail(props) {
  const {
    isOpen,
    onClose,
    postData,
    handleDelete,
    likesCount,
    comments,
    isCommentLoading,
    newComment,
    setNewComment,
    handleAddComment,
    setSelectedImage,
    setIsImageModalOpen,
  } = props;

  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.400");
  const commentBg = useColorModeValue("gray.50", "gray.700");
  const commentHoverBg = useColorModeValue("gray.100", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  if (!postData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <Flex align="center" justify="space-between">
            <Flex align="center">
              <Avatar src={postData.author?.avatar} mr={2} name={postData.author?.username || "Người dùng"} />
              <Text fontWeight="bold" color={textColor}>
                {postData.author?.username || "Người dùng"}
              </Text>
              {postData.author?.isVerified && <VerifiedBadgeIcon />}
              {postData.status === "draft" && (
                <Badge ml={2} colorScheme="yellow" variant="subtle">Draft</Badge>
              )}
            </Flex>
            <Text fontSize="sm" color={secondaryTextColor}>
              {postData.createdAt ? new Date(postData.createdAt).toLocaleString("vi-VN") : ""}
            </Text>
          </Flex>

          {/* Chỉ hiển thị nút xóa */}
          <HStack spacing={2} mt={2}>
            <IconButton
              icon={<DeleteIcon />}
              aria-label="Xóa bài viết"
              size="sm"
              variant="ghost"
              color="gray.600"
              _hover={{ color: "red.500" }}
              onClick={handleDelete}
            />
          </HStack>
        </ModalHeader>

        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={4}>
            {/* Nội dung */}
            <Text color={textColor}>{postData.content}</Text>

            {/* Hình ảnh */}
            {Array.isArray(postData.images) && postData.images.length > 0 && (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2} w="full">
                {postData.images.map((img, i) => (
                  <Image
                    key={i}
                    src={img || "/placeholder.svg"}
                    borderRadius="md"
                    alt={`Post image ${i + 1}`}
                    objectFit="cover"
                    w="100%"
                    h="200px"
                    fallbackSrc="/placeholder.svg"
                    cursor="pointer"
                    _hover={{ transform: "scale(1.03)", transition: "0.2s" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage?.(img);
                      setIsImageModalOpen?.(true);
                    }}
                  />
                ))}
              </SimpleGrid>
            )}

            {/* Video */}
            {postData.video && (
              <video src={postData.video} controls style={{ width: "100%", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
            )}

            {/* Thống kê */}
            <Text fontSize="sm" color="gray.500">
              <Text as="span" fontWeight="600">
                {likesCount} lượt thích
              </Text>
              {" • "}
              <Text as="span" fontWeight="600">
                {comments.length} bình luận
              </Text>
            </Text>

            {/* Danh sách bình luận */}
            <VStack align="start" spacing={3} maxH="300px" overflowY="auto" w="full" pl={0}>
              {comments.length > 0 ? (
                comments.map((c) => (
                  <Flex key={c._id} align="flex-start" w="full">
                    <Avatar size="sm" src={c.user?.avatar} name={c.user?.username} mr={3} mt={1} />
                    <Box flex="1" bg={commentBg} p={2} borderRadius="md" boxShadow="sm" _hover={{ bg: commentHoverBg }} borderColor={borderColor} borderWidth="1px">
                      <HStack spacing={1}>
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>{c.user?.username || "Người dùng"}</Text>
                        {c.user?.isVerified && <VerifiedBadgeIcon />}
                      </HStack>
                      <Text fontSize="xs" color={secondaryTextColor}>{c.createdAt ? new Date(c.createdAt).toLocaleString("vi-VN") : ""}</Text>
                      <Text fontSize="sm" color={textColor}>{c.text}</Text>
                    </Box>
                  </Flex>
                ))
              ) : (
                <Text color={secondaryTextColor} fontSize="sm">Chưa có bình luận nào</Text>
              )}
            </VStack>

            {/* Input bình luận */}
            <HStack mt={2} w="full">
              <Input
                placeholder="Viết bình luận..."
                value={newComment}
                onChange={(e) => setNewComment?.(e.target.value)}
                bg={commentBg}
                color={textColor}
                borderColor={borderColor}
                _hover={{ borderColor: "blue.500" }}
                _focus={{ borderColor: "blue.500" }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment?.(); } }}
                isDisabled={isCommentLoading}
              />
              <Button onClick={(e) => { e.stopPropagation(); handleAddComment?.(); }} colorScheme="blue" isLoading={isCommentLoading}>Gửi</Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}