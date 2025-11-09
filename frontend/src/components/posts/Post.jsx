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
  ModalFooter,
  Textarea,
  useDisclosure,
  useToast,
  SimpleGrid,
  Badge,
} from "@chakra-ui/react";
import { FaHeart, FaRegHeart, FaComment, FaShare, FaRetweet } from "react-icons/fa";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import EditPostModal from "./EditPostModal.jsx";
import VerifiedBadgeSVG from "/verified-badge-svgrepo-com.svg";
import { deletePost } from "../../api/post";

/** ---------- Utils ---------- */
const API_URL = "http://localhost:5000";

const formatTimeAgo = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffHours < 1) return diffMin < 1 ? "Vừa xong" : `${diffMin} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffWeeks < 4) return `${diffWeeks} tuần trước`;

  const sameYear = now.getFullYear() === date.getFullYear();
  return sameYear
    ? `ngày ${date.getDate()} tháng ${date.getMonth() + 1}`
    : `ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
};

// ✅ Tích xanh
const VerifiedBadgeIcon = () => (
  <Image src={VerifiedBadgeSVG} alt="Verified Badge" w="16px" h="16px" ml={1} display="inline-block" />
);

export default function Post({ post, currentUser, onPostUpdated, onPostDeleted }) {
  /** ---------- Local state ---------- */
  const [postData, setPostData] = useState(post || {});
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [repostText, setRepostText] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const viewDisclosure = useDisclosure();
  const editDisclosure = useDisclosure();
  const { isOpen, onOpen, onClose } = viewDisclosure;
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = editDisclosure;

  const toast = useToast();

  /** ---------- Derived values ---------- */
  const token = useMemo(() => localStorage.getItem("token"), []);
  const api = useMemo(
    () =>
      axios.create({
        baseURL: API_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );

  const likes = useMemo(() => (Array.isArray(postData?.likes) ? postData.likes : []), [postData?.likes]);
  const comments = useMemo(() => (Array.isArray(postData?.comments) ? postData.comments : []), [postData?.comments]);

  const liked = useMemo(() => {
    if (!currentUser) return false;
    return likes.includes(currentUser._id);
  }, [likes, currentUser]);

  const likesCount = likes.length;

  const canEdit = useMemo(() => {
    const authorId = postData?.author?._id;
    return Boolean(currentUser && authorId && (currentUser._id === authorId || currentUser.role === "admin"));
  }, [currentUser, postData?.author?._id]);

  const canRepost = useMemo(() => {
    const authorId = postData?.author?._id;
    return Boolean(currentUser && authorId && currentUser._id !== authorId);
  }, [currentUser, postData?.author?._id]);

  /** ---------- Effects ---------- */
  // Sync khi prop post đổi
  useEffect(() => {
    if (!post) return;
    setPostData(post);
  }, [post]);

  // Nếu backend trả về bài repost đã mất repostOf (do gốc bị xoá) nhưng local còn
  useEffect(() => {
    if (post && !post.repostOf && postData.repostOf) {
      setPostData((prev) => ({ ...prev, repostOf: null, wasRepost: true }));
    }
  }, [post, postData.repostOf]);

  /** ---------- Handlers ---------- */
  const safeUpdateUpstream = useCallback(
    (updated) => {
      if (typeof onPostUpdated === "function") onPostUpdated(updated);
    },
    [onPostUpdated]
  );

  const handleLike = useCallback(async () => {
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

    // ✅ Optimistic update
    setIsLiking(true);
    const userId = currentUser?._id;
    const prevLikes = likes;
    const isLiked = prevLikes.includes(userId);
    const nextLikes = isLiked ? prevLikes.filter((id) => id !== userId) : [...prevLikes, userId];

    setPostData((p) => ({ ...p, likes: nextLikes }));

    try {
      const { data } = await api.put(`/api/posts/${postData._id}/like`, {});
      const serverLikes = Array.isArray(data?.likes) ? data.likes : nextLikes;
      setPostData((p) => ({ ...p, likes: serverLikes }));
      safeUpdateUpstream({ ...postData, likes: serverLikes });
    } catch (err) {
      // rollback
      setPostData((p) => ({ ...p, likes: prevLikes }));
      toast({
        title: "Lỗi",
        description: err?.response?.data?.message || "Không thể thích bài viết",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLiking(false);
    }
  }, [token, toast, currentUser?._id, likes, api, postData, safeUpdateUpstream]);

  const handleAddComment = useCallback(async () => {
    const text = newComment.trim();
    if (!text) {
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
      const { data } = await api.post(`/api/posts/${postData._id}/comment`, { text });
      const incoming = data || {};

      // Nếu backend chưa populate user
      const normalized = {
        ...incoming,
        user:
          incoming.user && typeof incoming.user === "object"
            ? incoming.user
            : {
                _id: currentUser?._id,
                username: currentUser?.username,
                avatar: currentUser?.avatar,
                isVerified: currentUser?.isVerified,
              },
      };

      const updated = { ...postData, comments: [...comments, normalized] };
      setPostData(updated);
      setNewComment("");
      safeUpdateUpstream(updated);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.message || "Không thể thêm bình luận",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCommentLoading(false);
    }
  }, [newComment, api, postData, currentUser, comments, toast, safeUpdateUpstream]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    try {
      // ưu tiên dùng API helper nếu đã có
      await deletePost?.(postData._id, token) ??
        api.delete(`/api/posts/${postData._id}`);

      toast({
        title: "Đã xóa bài viết",
        description: "Bài viết đã được xóa thành công.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Nếu là repost, cập nhật count cho bài gốc
      if (postData?.repostOf && typeof onPostUpdated === "function") {
        const updatedOriginal = {
          ...postData.repostOf,
          repostCount: Math.max((postData.repostOf.repostCount || 1) - 1, 0),
        };
        onPostUpdated(updatedOriginal);
      }

      if (typeof onPostDeleted === "function") {
        onPostDeleted(postData._id, postData.repostOf?._id);
      }

      onClose();
    } catch (err) {
      toast({
        title: "Lỗi khi xóa bài viết",
        description: err?.response?.data?.message || "Không thể xóa bài viết.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [api, deletePost, postData, onPostUpdated, onPostDeleted, onClose, toast, token]);

  const handlePublish = useCallback(async () => {
    try {
      const { data } = await api.put(`/api/posts/${postData._id}/publish`, {});
      const updatedPost = data?.post || data || {};
  
      toast({
        title: "Đăng công khai thành công!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
  
      // giữ nguyên merge logic
      const merged = { ...postData, ...updatedPost, status: "published" };
      setPostData(merged);
      safeUpdateUpstream(merged);
      onClose();
    } catch (err) {
      toast({
        title: "Lỗi khi đăng bài",
        description: err?.response?.data?.message || "Không thể đăng bài.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [api, postData, onClose, toast, safeUpdateUpstream]);
  

  const handleRepost = useCallback(async () => {
    try {
      const { data } = await api.post(`/api/posts/${postData._id}/repost`, { content: repostText });

      toast({ title: "Đã chia sẻ lại bài viết!", status: "success", duration: 2000, isClosable: true });

      // Bắn lên parent 1) bài repost mới 2) tăng repostCount gốc
      if (typeof onPostUpdated === "function") {
        onPostUpdated(data);
        onPostUpdated({ ...postData, repostCount: (postData.repostCount || 0) + 1 });
      }

      setIsRepostModalOpen(false);
      onClose();
      setRepostText("");
    } catch (err) {
      toast({
        title: "Lỗi khi repost",
        description: err?.response?.data?.message || "Không thể repost bài viết này.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [api, postData, repostText, onPostUpdated, onClose, toast]);

  const handleUpdatedFromChild = useCallback(
    (updatedPost) => {
      // Nếu là repost mà dữ liệu trả về chưa có bài gốc -> giữ lại từ post cũ
      if (postData?.repostOf && !updatedPost?.repostOf) {
        updatedPost = { ...updatedPost, repostOf: postData.repostOf };
      }
      setPostData(updatedPost);
      safeUpdateUpstream(updatedPost);
    },
    [postData?.repostOf, safeUpdateUpstream]
  );

  if (!postData || !postData._id) return null;

  /** ---------- Render ---------- */
  return (
    <>
      {/* Card rút gọn */}
      <Box
        borderWidth="1px"
        borderRadius="md"
        p={4}
        mb={4}
        cursor="pointer"
        bg={postData.status === "draft" ? "yellow.50" : "white"}
        _hover={{ bg: postData.status === "draft" ? "yellow.100" : "gray.100" }}
        onClick={onOpen}
      >
        <Flex align="center" justify="space-between" mb={2}>
          <Flex align="center">
            <Avatar src={postData.author?.avatar} mr={2} name={postData.author?.username || "Người dùng"} />
            <Flex align="center">
              <Text fontWeight="bold">{postData.author?.username || "Người dùng"}</Text>
              {postData.author?.isVerified && <VerifiedBadgeIcon />}
              {postData.status === "draft" && (
                <Badge ml={2} colorScheme="yellow" variant="subtle">
                  Draft
                </Badge>
              )}
            </Flex>
          </Flex>
          <Text fontSize="sm" color="gray.500">
            {postData.updatedAt && postData.updatedAt !== postData.createdAt
              ? <>Đã chỉnh sửa • {formatTimeAgo(postData.updatedAt)}</>
              : <>{formatTimeAgo(postData.createdAt)}</>}
          </Text>
        </Flex>

        {/* Nội dung card */}
        {postData.repostOf && postData.repostOf.author ? (
          <>
            {postData?.content && <Text mb={2}>{postData.content}</Text>}
            <Box border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50" p={3} mt={2}>
              <Text fontSize="sm" color="gray.600" mb={1}>
                {postData.author?.username} đã repost bài viết của <b>{postData.repostOf?.author?.username}</b>
              </Text>
              {postData.repostOf?.content && <Text>{postData.repostOf.content}</Text>}
              {Array.isArray(postData.repostOf?.images) && postData.repostOf.images.length > 0 && (
                <Image
                  src={postData.repostOf.images[0]}
                  borderRadius="md"
                  mt={2}
                  maxH="200px"
                  objectFit="cover"
                  alt="Repost image"
                />
              )}
            </Box>
          </>
        ) : postData.wasRepost ? (
          <Box border="1px" borderColor="gray.200" borderRadius="md" bg="gray.100" p={3} mt={2}>
            <Text color="gray.600" fontStyle="italic">Bài viết gốc đã bị xoá.</Text>
          </Box>
        ) : (
          <>
            {postData?.content && <Text isTruncated>{postData.content}</Text>}
            {Array.isArray(postData.images) && postData.images.length > 0 && (
              <Image
                src={postData.images[0]}
                borderRadius="md"
                mt={2}
                maxH="200px"
                objectFit="cover"
                alt="Post image"
              />
            )}
          </>
        )}
      </Box>

      {/* Modal chi tiết */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" justify="space-between">
              <Flex align="center">
                <Text fontWeight="bold">{postData.author?.username || "Người dùng"}</Text>
                {postData.author?.isVerified && <VerifiedBadgeIcon />}
                {postData.status === "draft" && (
                  <Badge ml={2} colorScheme="yellow" variant="subtle">
                    Draft
                  </Badge>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.500">{formatTimeAgo(postData.createdAt)}</Text>
            </Flex>

            {canEdit && (
              <HStack spacing={2} mt={2}>
                <IconButton
                  icon={<EditIcon />}
                  aria-label="Chỉnh sửa bài viết"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onClose();
                    setTimeout(onEditOpen, 200);
                  }}
                />
                <IconButton
                  icon={<DeleteIcon />}
                  aria-label="Xóa bài viết"
                  size="sm"
                  variant="ghost"
                  color="gray.600"
                  _hover={{ color: "red.500" }}
                  onClick={handleDelete}
                />
                {postData.status === "draft" && (
                  <Button colorScheme="green" size="sm" onClick={handlePublish}>
                    Đăng công khai
                  </Button>
                )}
              </HStack>
            )}
          </ModalHeader>

          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={4}>
              {postData?.content && <Text>{postData.content}</Text>}

              {Array.isArray(postData.images) && postData.images.length > 0 && (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2}>
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
                        setSelectedImage(img);
                        setIsImageModalOpen(true);
                      }}
                    />
                  ))}
                </SimpleGrid>
              )}

              {postData?.video && (
                <video src={postData.video} controls style={{ width: "100%", borderRadius: 8 }} />
              )}

              {/* Repost block */}
              {postData.repostOf && postData.repostOf.author ? (
                <Box border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50" p={3} mt={2} w="full">
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    {postData.author?.username} đã repost bài viết của <b>{postData.repostOf?.author?.username}</b>
                  </Text>
                  {postData.repostOf?.content && <Text>{postData.repostOf.content}</Text>}
                  {Array.isArray(postData.repostOf?.images) && postData.repostOf.images.length > 0 && (
                    <Image
                      src={postData.repostOf.images[0]}
                      borderRadius="md"
                      mt={2}
                      maxH="200px"
                      objectFit="cover"
                      alt="Repost image"
                    />
                  )}
                </Box>
              ) : postData.wasRepost ? (
                <Box border="1px" borderColor="gray.200" borderRadius="md" bg="gray.100" p={3} mt={2} w="full">
                  <Text color="gray.600" fontStyle="italic">Bài viết gốc đã bị xoá.</Text>
                </Box>
              ) : null}

              {/* Actions */}
              <HStack spacing={4}>
                <IconButton
                  icon={liked ? <FaHeart color="red" /> : <FaRegHeart />}
                  aria-label="Like"
                  variant="ghost"
                  onClick={handleLike}
                  isLoading={isLiking}
                />
                <IconButton icon={<FaComment />} aria-label="Comment" variant="ghost" />
                <IconButton
                  icon={<FaRetweet color={canRepost ? "teal" : "gray"} />}
                  aria-label="Repost"
                  variant="ghost"
                  onClick={() => {
                    if (!canRepost) {
                      toast({ title: "Không thể chia sẻ bài viết của chính bạn", status: "info", duration: 2000, isClosable: true });
                      return;
                    }
                    setIsRepostModalOpen(true);
                  }}
                  isDisabled={!canRepost}
                />
                <IconButton icon={<FaShare />} aria-label="Share" variant="ghost" />
              </HStack>

              <Text fontSize="sm" color="gray.500">
                {likesCount} lượt thích • {comments.length} bình luận • {postData.repostCount || 0} lượt chia sẻ lại
              </Text>

              {/* Comments */}
              <VStack align="start" spacing={3} maxH="300px" overflowY="auto" w="full" pl={0}>
                {comments.length > 0 ? (
                  comments.map((c) => (
                    <Flex key={c._id} align="flex-start" w="full">
                      <Avatar size="sm" src={c.user?.avatar} name={c.user?.username} mr={3} mt={1} />
                      <Box flex="1" bg="gray.50" p={2} borderRadius="md" boxShadow="sm" _hover={{ bg: "gray.100" }}>
                        <HStack spacing={1}>
                          <Text fontWeight="bold" fontSize="sm">{c.user?.username || "Người dùng"}</Text>
                          {c.user?.isVerified && <VerifiedBadgeIcon />}
                        </HStack>
                        <Text fontSize="xs" color="gray.500">{formatTimeAgo(c.createdAt)}</Text>
                        <Text fontSize="sm">{c.text}</Text>
                      </Box>
                    </Flex>
                  ))
                ) : (
                  <Text color="gray.500" fontSize="sm">Chưa có bình luận nào</Text>
                )}
              </VStack>

              {/* Comment input */}
              <HStack mt={2} w="full">
                <Input
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  isDisabled={isCommentLoading}
                />
                <Button onClick={handleAddComment} colorScheme="blue" isLoading={isCommentLoading}>
                  Gửi
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal chỉnh sửa */}
      <EditPostModal isOpen={isEditOpen} onClose={onEditClose} post={postData} onUpdated={handleUpdatedFromChild} />

      {/* Modal repost */}
      <Modal isOpen={isRepostModalOpen} onClose={() => setIsRepostModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chia sẻ lại bài viết</ModalHeader>
          <ModalBody>
            <Textarea
              placeholder="Thêm lời chia sẻ của bạn (tùy chọn)..."
              value={repostText}
              onChange={(e) => setRepostText(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleRepost}>
              Đăng
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal xem ảnh to */}
      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} size="4xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none" maxW="90vw">
          <ModalCloseButton color="white" zIndex={10} />
          <ModalBody p={0}>
            <Flex align="center" justify="center" bg="blackAlpha.800" borderRadius="md">
              <Image
                src={selectedImage}
                alt="Preview"
                maxH="90vh"
                maxW="100%"
                objectFit="contain"
                borderRadius="md"
              />
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
