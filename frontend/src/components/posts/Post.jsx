import {
  Box,
  Text,
  Image,
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
import { EditIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import axios from "axios";
import EditPostModal from "./EditPostModal.jsx";
import VerifiedBadgeSVG from "/verified-badge-svgrepo-com.svg";

// ✅ Component hiển thị tích xanh
const VerifiedBadgeIcon = () => (
  <Image
    src={VerifiedBadgeSVG}
    alt="Verified Badge"
    w="16px"
    h="16px"
    ml={1}
    display="inline-block"
  />
);

export default function Post({ post, currentUser, onPostUpdated }) {
  const [postData, setPostData] = useState(post || {});
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likes?.length || 0);
  const [comments, setComments] = useState(post?.comments || []);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  const viewDisclosure = useDisclosure();
  const editDisclosure = useDisclosure();
  const { isOpen, onOpen, onClose } = viewDisclosure;
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = editDisclosure;

  const toast = useToast();
  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000";

  // ✅ Đồng bộ postData mỗi khi prop post thay đổi
  useEffect(() => {
    if (post) {
      setPostData(post);
      setLikesCount(Array.isArray(post.likes) ? post.likes.length : 0);
      setComments(Array.isArray(post.comments) ? post.comments : []);
    }
  }, [post]);

  // ✅ Kiểm tra like ban đầu
  useEffect(() => {
    if (currentUser && Array.isArray(postData.likes)) {
      setLiked(postData.likes.includes(currentUser._id));
    }
  }, [currentUser, postData.likes]);

  // ✅ Quyền chỉnh sửa: chính chủ hoặc admin
  const canEdit =
    currentUser &&
    postData?.author &&
    (currentUser._id === postData.author._id || currentUser.role === "admin");

  // ✅ Xử lý Like
  const handleLike = async () => {
    if (!token) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để thích bài viết.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLiking(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/posts/${postData._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedLikes = Array.isArray(res.data.likes) ? res.data.likes : [];
      setLikesCount(updatedLikes.length);
      setLiked(updatedLikes.includes(currentUser._id));
      setPostData((prev) => ({ ...prev, likes: updatedLikes }));
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể thích bài viết",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLiking(false);
    }
  };

  // ✅ Xử lý comment
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập bình luận",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setIsCommentLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${postData._id}/comment`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data) setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể thêm bình luận",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCommentLoading(false);
    }
  };

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN") : "");

  // ✅ Nhận dữ liệu mới khi chỉnh sửa thành công
  const handleUpdated = (updatedPost) => {
    setPostData(updatedPost);
    if (typeof onPostUpdated === "function") {
      onPostUpdated(updatedPost);
    }

  };

  if (!postData || !postData._id) return null;

  return (
    <>
      {/* Khung rút gọn bài viết */}
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
              src={postData.author?.avatar}
              mr={2}
              name={postData.author?.username || "Người dùng"}
            />
            <Flex align="center">
              <Text fontWeight="bold">{postData.author?.username || "Người dùng"}</Text>
              {postData.author?.isVerified && <VerifiedBadgeIcon />}
            </Flex>
          </Flex>
          <Text fontSize="sm" color="gray.500">
            {postData.updatedAt && postData.updatedAt !== postData.createdAt ? (
              <>Đã chỉnh sửa • {formatDate(postData.updatedAt)}</>
            ) : (
              <>{formatDate(postData.createdAt)}</>
            )}
          </Text>

        </Flex>

        {postData?.content && <Text isTruncated>{postData.content}</Text>}

        {Array.isArray(postData.images) && postData.images.length > 0 && (
          <Image
            src={postData.images[0]}
            borderRadius="md"
            mt={2}
            maxH="200px"
            objectFit="cover"
          />
        )}
      </Box>

      {/* Modal chi tiết bài viết */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" justify="space-between">
              <Flex align="center">
                <Text fontWeight="bold">{postData.author?.username || "Người dùng"}</Text>
                {postData.author?.isVerified && <VerifiedBadgeIcon />}
              </Flex>
              <Text fontSize="sm" color="gray.500">
                {formatDate(postData.createdAt)}
              </Text>
            </Flex>

            {/* Nút chỉnh sửa */}
            {canEdit && (
              <IconButton
                icon={<EditIcon />}
                aria-label="Chỉnh sửa bài viết"
                size="sm"
                variant="ghost"
                onClick={() => {
                  onClose();
                  setTimeout(onEditOpen, 200);
                }}
                mt={2}
              />
            )}
          </ModalHeader>

          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={4}>
              {postData?.content && <Text>{postData.content}</Text>}

              {Array.isArray(postData.images) &&
                postData.images.map((img, i) => (
                  <Image
                    key={i}
                    src={img || "/placeholder.svg"}
                    borderRadius="md"
                    alt={`Post image ${i + 1}`}
                  />
                ))}

              {postData?.video && (
                <video
                  src={postData.video}
                  controls
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              )}

              <HStack spacing={4}>
                <IconButton
                  icon={liked ? <FaHeart color="red" /> : <FaRegHeart />}
                  aria-label="Like"
                  variant="ghost"
                  onClick={handleLike}
                  isLoading={isLiking}
                />
                <IconButton icon={<FaComment />} aria-label="Comment" variant="ghost" />
                <IconButton icon={<FaRetweet />} aria-label="Repost" variant="ghost" />
                <IconButton icon={<FaShare />} aria-label="Share" variant="ghost" />
              </HStack>

              <Text fontSize="sm" color="gray.500">
                {likesCount} lượt thích • {comments.length} bình luận
              </Text>

              <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
                {Array.isArray(comments) && comments.length > 0 ? (
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
                            {c.user?.username || "Người dùng"}
                          </Text>
                          {c.user?.isVerified && <VerifiedBadgeIcon />}
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
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

              {/* Input bình luận */}
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

      {/* Modal chỉnh sửa bài viết */}
      <EditPostModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        post={postData}
        onUpdated={handleUpdated}
      />
    </>
  );
}
