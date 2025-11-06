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
  Badge,
} from "@chakra-ui/react";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaRetweet,
} from "react-icons/fa";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import axios from "axios";
import EditPostModal from "./EditPostModal.jsx";
import VerifiedBadgeSVG from "/verified-badge-svgrepo-com.svg";
import { deletePost } from "../../api/post";

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

export default function Post({
  post,
  currentUser,
  onPostUpdated,
  onPostDeleted,
}) {
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
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = editDisclosure;

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

      // ✅ Cập nhật số lượt like và trạng thái like
      setLikesCount(updatedLikes.length); // Update số lượt like
      setLiked(updatedLikes.includes(currentUser._id)); // Update trạng thái like

      // ✅ Tạo object post mới với likes đã cập nhật
      const updatedPost = {
        ...postData,
        likes: updatedLikes,
      };

      // ✅ Cập nhật lại postData
      setPostData(updatedPost);

      // ✅ Gọi callback để update ở HomeFeed/Profile
      if (typeof onPostUpdated === "function") {
        onPostUpdated(updatedPost);
      }
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

      // ✅ Lấy comment mới từ server
      const newCommentObj = res.data;

      // Nếu backend chưa populate user, tự gắn currentUser
      if (!newCommentObj.user || typeof newCommentObj.user === "string") {
        newCommentObj.user = {
          _id: currentUser._id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          isVerified: currentUser.isVerified,
        };
      }

      // ✅ Cập nhật comments
      const updatedComments = [...comments, newCommentObj];
      const updatedPost = { ...postData, comments: updatedComments };

      setComments(updatedComments);
      setNewComment("");
      setPostData(updatedPost);

      // ✅ Báo ngược lên component cha (HomeFeed)
      if (typeof onPostUpdated === "function") {
        onPostUpdated(updatedPost);
      }
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

  // 🕒 Format thời gian hiển thị: "3 giờ trước", "2 ngày trước", "1 tuần trước", hoặc "ngày 5 tháng 6"
  const formatTimeAgo = (isoDate) => {
    if (!isoDate) return "";

    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date; // chênh lệch mili-giây
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    // ✅ Dưới 1 giờ
    if (diffHours < 1) {
      if (diffMin < 1) return "Vừa xong";
      return `${diffMin} phút trước`;
    }

    // ✅ Trong vòng 1 ngày
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }

    // ✅ Trong vòng 7 ngày
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }

    // ✅ Trong vòng 4 tuần
    if (diffWeeks < 4) {
      return `${diffWeeks} tuần trước`;
    }

    // ✅ Cùng năm → hiển thị "ngày X tháng Y"
    const nowYear = now.getFullYear();
    const dateYear = date.getFullYear();

    if (nowYear === dateYear) {
      return `ngày ${date.getDate()} tháng ${date.getMonth() + 1}`;
    }

    // ✅ Khác năm → hiển thị "ngày X tháng Y năm Z"
    return `ngày ${date.getDate()} tháng ${
      date.getMonth() + 1
    } năm ${date.getFullYear()}`;
  };

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
        bg={postData.status === "draft" ? "yellow.50" : "white"}
        _hover={{
          bg: postData.status === "draft" ? "yellow.100" : "gray.100",
        }}
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
              <Text fontWeight="bold">
                {postData.author?.username || "Người dùng"}
              </Text>
              {postData.author?.isVerified && <VerifiedBadgeIcon />}
              {postData.status === "draft" && (
                <Badge ml={2} colorScheme="yellow" variant="subtle">
                  Draft
                </Badge>
              )}
            </Flex>
          </Flex>
          <Text fontSize="sm" color="gray.500">
            {postData.updatedAt && postData.updatedAt !== postData.createdAt ? (
              <>Đã chỉnh sửa • {formatTimeAgo(postData.updatedAt)}</>
            ) : (
              <>{formatTimeAgo(postData.createdAt)}</>
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
                <Text fontWeight="bold">
                  {postData.author?.username || "Người dùng"}
                </Text>
                {postData.author?.isVerified && <VerifiedBadgeIcon />}
                {postData.status === "draft" && (
                  <Badge ml={2} colorScheme="yellow" variant="subtle">
                    Draft
                  </Badge>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.500">
                {formatTimeAgo(postData.createdAt)}
              </Text>
            </Flex>

            {canEdit && (
              <HStack spacing={2}>
                {/* Nút chỉnh sửa */}
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

                {/* Nút xóa bài viết */}
                <IconButton
                  icon={<DeleteIcon />}
                  aria-label="Xóa bài viết"
                  size="sm"
                  variant="ghost"
                  color="gray.600"
                  _hover={{ color: "red.500" }}
                  onClick={async () => {
                    if (
                      !window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")
                    )
                      return;

                    try {
                      const token = localStorage.getItem("token");
                      await deletePost(postData._id, token);

                      toast({
                        title: "Đã xóa bài viết",
                        description: "Bài viết đã được xóa thành công.",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                      });

                      if (typeof onPostDeleted === "function") {
                        onPostDeleted(postData._id);
                      }

                      onClose();
                    } catch (err) {
                      toast({
                        title: "Lỗi khi xóa bài viết",
                        description: err.message || "Không thể xóa bài viết.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                      });
                    }
                  }}
                  mt={2}
                />
              </HStack>
            )}
            {canEdit && postData.status === "draft" && (
              <Button
                colorScheme="green"
                size="sm"
                ml={2}
                mt={2}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const res = await axios.put(
                      `${API_URL}/api/posts/${postData._id}`,
                      { status: "published" },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );

                    const updatedPost = res.data.post || res.data; // 🟢 đảm bảo lấy đúng object bài viết

                    toast({
                      title: "Đăng công khai thành công!",
                      status: "success",
                      duration: 2000,
                      isClosable: true,
                    });

                    // 🟢 Cập nhật lại bài viết trong modal
                    setPostData((prev) => ({
                      ...prev,
                      ...updatedPost,
                      status: "published",
                    }));

                    // 🟢 Cập nhật ở HomeFeed / Profile
                    if (typeof onPostUpdated === "function") {
                      onPostUpdated({
                        ...postData,
                        ...updatedPost,
                        status: "published",
                      });
                    }

                    // 🟢 Đóng modal để tránh flash “mất bài”
                    onClose();
                  } catch (err) {
                    toast({
                      title: "Lỗi khi đăng bài",
                      description:
                        err.response?.data?.message || "Không thể đăng bài.",
                      status: "error",
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }}
              >
                Đăng công khai
              </Button>
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
                {likesCount} lượt thích • {comments.length} bình luận
              </Text>

             <VStack
  align="start"
  spacing={3}
  maxH="300px"
  overflowY="auto"
  w="full"
  pl={0}
>
  {Array.isArray(comments) && comments.length > 0 ? (
    comments.map((c) => (
      <Flex key={c._id} align="flex-start" w="full">
        <Avatar
          size="sm"
          src={c.user?.avatar}
          name={c.user?.username}
          mr={3}
          mt={1}
        />
        <Box
          flex="1"
          bg="gray.50"
          p={2}
          borderRadius="md"
          boxShadow="sm"
          _hover={{ bg: "gray.100" }}
        >
          <HStack spacing={1}>
            <Text fontWeight="bold" fontSize="sm">
              {c.user?.username || "Người dùng"}
            </Text>
            {c.user?.isVerified && <VerifiedBadgeIcon />}
          </HStack>
          <Text fontSize="xs" color="gray.500">
            {formatTimeAgo(c.createdAt)}
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
