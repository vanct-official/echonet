import {
  Box,
  Text,
  Image, // Đảm bảo Image được import để dùng cho tích xanh
  Avatar,
  Flex,
  VStack,
  HStack,
  IconButton,
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaRetweet,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import axios from "axios";

// 💡 1. IMPORT file SVG với tên mới để tránh trùng lặp
import VerifiedBadgeSVG from "/verified-badge-svgrepo-com.svg";

// 💡 2. Component hiển thị Tích Xanh sử dụng Image
const VerifiedBadgeIcon = () => (
  <Image
    src={VerifiedBadgeSVG}
    alt="Verified Badge"
    w="16px" // Điều chỉnh kích thước
    h="16px"
    ml={1}
    display="inline-block"
  />
);

// Lưu ý: Post component phải nhận currentUser để kiểm tra trạng thái like ban đầu
export default function Post({ post, currentUser }) {
  // Khởi tạo state liked (sẽ được cập nhật trong useEffect)
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000";

  // LOGIC MỚI: Khởi tạo trạng thái liked
  useEffect(() => {
    // Chỉ kiểm tra nếu currentUser tồn tại
    if (
      currentUser &&
      currentUser._id &&
      post.likes?.includes(currentUser._id)
    ) {
      setLiked(true);
    }
  }, [currentUser, post.likes]);

  const handleLike = async () => {
    if (!token) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập",
        status: "error",
        duration: 3,
        isClosable: true,
      });
      return;
    }

    setIsLiking(true);
    try {
      const endpoint = `${API_URL}/api/posts/${post._id}/like`;

      const res = await axios.put(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cập nhật state dựa trên kết quả API
      setLikesCount(res.data.likes?.length || res.data.likes || 0);
      setLiked(res.data.likes?.includes(currentUser._id) || !liked);

      toast({
        title: "Thành công",
        status: "success",
        duration: 2,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể thích bài viết",
        status: "error",
        duration: 3,
        isClosable: true,
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    // ... (logic comment giữ nguyên)
    if (!newComment.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập bình luận",
        status: "warning",
        duration: 2,
        isClosable: true,
      });
      return;
    }

    // ... (logic API call comment giữ nguyên)
    setIsCommentLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${post._id}/comment`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data) {
        setComments((prev) => [...prev, res.data]);
      }
      setNewComment("");
      toast({
        title: "Thành công",
        description: "Bình luận đã được thêm",
        status: "success",
        duration: 2,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể thêm bình luận",
        status: "error",
        duration: 3,
        isClosable: true,
      });
    } finally {
      setIsCommentLoading(false);
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleString("vi-VN");

  return (
    <>
      {/* Post summary */}
      <Box
        borderWidth="1px"
        borderRadius="lg"
        p={4}
        mb={4}
        maxWidth={1200}
        cursor="pointer"
        _hover={{ bg: "gray.100" }}
        onClick={onOpen}
      >
        <Flex align="center" justify="space-between" mb={2}>
          <Flex align="center">
            <Avatar
              src={post.author?.avatar}
              mr={2}
              name={post.author?.username}
            />
            <Flex align="center">
              <Text fontWeight="bold">{post.author?.username}</Text>
              {/* 💡 SỬ DỤNG COMPONENT MỚI */}
              {post.author?.isVerified && <VerifiedBadgeIcon />}
            </Flex>
          </Flex>
          <Text fontSize="sm" color="gray.500">
            {formatDate(post.createdAt)}
          </Text>
        </Flex>
        {post && <Text isTruncated>{post.content}</Text>}
      </Box>

      {/* Modal chi tiết post */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" justify="space-between">
              <Flex align="center">
                <Text fontWeight="bold">{post.author?.username}</Text>
                {/* 💡 SỬ DỤNG COMPONENT MỚI */}
                {post.author?.isVerified && <VerifiedBadgeIcon />}
              </Flex>
              <Text fontSize="sm" color="gray.500">
                {formatDate(post.createdAt)}
              </Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={4}>
              {post && <Text>{post.content}</Text>}
              {post?.images?.map((img, i) => (
                <Image
                  key={i}
                  src={img || "/placeholder.svg"}
                  borderRadius="md"
                  alt={`Post image ${i + 1}`}
                />
              ))}

              <HStack spacing={4}>
                <IconButton
                  icon={liked ? <FaHeart color="red" /> : <FaRegHeart />}
                  aria-label="Like"
                  variant="ghost"
                  onClick={handleLike}
                  isLoading={isLiking}
                />
                <IconButton
                  icon={<FaComment />}
                  aria-label="Comment"
                  variant="ghost"
                />
                <IconButton
                  icon={<FaRetweet />}
                  aria-label="Repost"
                  variant="ghost"
                />
                <IconButton
                  icon={<FaShare />}
                  aria-label="Share"
                  variant="ghost"
                />
              </HStack>

              <Text fontSize="sm" color="gray.500">
                {likesCount} likes • {comments.length} comments
              </Text>

              {/* Danh sách comment */}
              <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
                {comments.length > 0 ? (
                  comments.map((c) => (
                    <Flex key={c._id} align="flex-start">
                      <Avatar
                        size="sm"
                        src={c.user?.avatar}
                        mr={2}
                        name={c.user?.username}
                      />
                      <Box flex={1}>
                        <HStack spacing={1}>
                          <Text fontWeight="bold" fontSize="sm">
                            {c.user?.username || "Anonymous"}
                          </Text>
                          {/* 💡 SỬ DỤNG COMPONENT MỚI */}
                          {c.user?.isVerified && <VerifiedBadgeIcon />}
                        </HStack>
                        <Text
                          fontWeight="medium"
                          fontSize="xs"
                          color="gray.500"
                        >
                          {formatDate(c.createdAt)}
                        </Text>
                        <Text fontSize="sm">{c.text}</Text>
                      </Box>
                    </Flex>
                  ))
                ) : (
                  <Text color="gray.500" fontSize="sm">
                    Chưa có bình luận nào
                  </Text>
                )}
              </VStack>

              {/* Input comment */}
              <HStack mt={2} w="full">
                <Input
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  isDisabled={isCommentLoading}
                />
                <Button
                  onClick={handleAddComment}
                  colorScheme="blue"
                  isLoading={isCommentLoading}
                >
                  Gửi
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
