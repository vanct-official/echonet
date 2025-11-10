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
  useColorModeValue,
} from "@chakra-ui/react";
import { FaHeart, FaRegHeart, FaComment, FaShare, FaRetweet } from "react-icons/fa";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import EditPostModal from "./EditPostModal.jsx";
import VerifiedBadgeSVG from "/verified-badge-svgrepo-com.svg";
import { deletePost as deletePostAPI } from "../../api/post";

const API_URL = "http://localhost:5000";


const formatTimeAgo = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 1000 / 60);
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

const VerifiedBadgeIcon = () => (
  <Image src={VerifiedBadgeSVG} alt="Verified Badge" w="16px" h="16px" ml={1} display="inline-block" />
);

function RepostBlock({ actorName, repostOf }) {

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const commentBg = useColorModeValue("gray.50", "gray.700");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  
  if (!repostOf?.author) return null;
  return (
    <Box 
      border="1px" 
      borderColor={borderColor} 
      borderRadius="md" 
      bg={commentBg} 
      p={3} 
      mt={2} 
      w="full"
    >
      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
        {actorName} đã repost bài viết của <b>{repostOf.author?.username}</b>
      </Text>
      {repostOf.content && <Text color={textColor}>{repostOf.content}</Text>}
      {Array.isArray(repostOf.images) && repostOf.images.length > 0 && (
        <Image
          src={repostOf.images[0]}
          borderRadius="md"
          mt={2}
          maxH="200px"
          objectFit="cover"
          alt="Repost image"
        />
      )}
    </Box>
  );
}

export default function Post({
  post,
  currentUser,
  isFollowing,
  onPostUpdated,
  onPostDeleted,
  onFollowChange,
}) {
    const boxBg = useColorModeValue("white", "gray.700");
  const focusBorderColor = useColorModeValue("blue.400", "blue.300");
  const inputBg = useColorModeValue("white", "gray.800");

// Thêm các biến màu sắc cho theme
const bgColor = useColorModeValue("white", "gray.800");
const hoverBg = useColorModeValue("gray.100", "gray.700");
const borderColor = useColorModeValue("gray.200", "gray.600");
const textColor = useColorModeValue("gray.800", "white");
const secondaryTextColor = useColorModeValue("gray.600", "gray.400");
const commentBg = useColorModeValue("gray.50", "gray.700");
const commentHoverBg = useColorModeValue("gray.100", "gray.600");
const draftBg = useColorModeValue("yellow.50", "yellow.900");
const draftHoverBg = useColorModeValue("yellow.100", "yellow.800");

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

  const token = useMemo(() => localStorage.getItem("token"), []);
  const api = useMemo(
    () =>
      axios.create({
        baseURL: API_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );

  const likes = Array.isArray(postData?.likes) ? postData.likes : [];
  const comments = Array.isArray(postData?.comments) ? postData.comments : [];
  const liked = !!(currentUser && likes.includes(currentUser._id));
  const likesCount = likes.length;

  const canEdit = !!(
    currentUser &&
    postData?.author?._id &&
    (currentUser._id === postData.author._id || currentUser.role === "admin")
  );

  const canRepost = !!(currentUser && postData?.author?._id && currentUser._id !== postData.author._id);

  useEffect(() => {
    if (post) setPostData(post);
  }, [post]);

  useEffect(() => {
    if (post && !post.repostOf && postData.repostOf) {
      setPostData((prev) => ({ ...prev, repostOf: null, wasRepost: true }));
    }
  }, [post, postData.repostOf]);

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

  const handleFollowToggle = async (e, currentFollowState) => {
    e.stopPropagation();
    if (!token) {
      toast({
        title: "Vui lòng đăng nhập để theo dõi",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const nextState = !currentFollowState;

    try {
      const endpoint = nextState
        ? `/api/users/${postData.author._id}/follow`
        : `/api/users/${postData.author._id}/unfollow`;

      await api.post(endpoint);

      toast({
        title: nextState ? "Đã theo dõi" : "Đã bỏ theo dõi",
        status: "success",
        duration: 1500,
        isClosable: true,
      });

      if (typeof onFollowChange === "function") {
        onFollowChange(postData.author._id, nextState);
      }
    } catch (err) {
      toast({
        title: "Lỗi khi cập nhật theo dõi",
        description: err?.response?.data?.message || "Không thể thực hiện hành động này.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

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
    if (!token) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để bình luận.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setIsCommentLoading(true);
    try {
      const { data } = await api.post(`/api/posts/${postData._id}/comment`, { text });
      const incoming = data || {};
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
  }, [newComment, api, postData, currentUser, comments, toast, safeUpdateUpstream, token]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      if (typeof deletePostAPI === "function") {
        await deletePostAPI(postData._id, token);
      } else {
        await api.delete(`/api/posts/${postData._id}`);
      }

      toast({
        title: "Đã xóa bài viết",
        description: "Bài viết đã được xóa thành công.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

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
  }, [api, postData, onPostUpdated, onPostDeleted, onClose, toast, token]);

  const handlePublish = useCallback(async () => {
    try {
      const { data } = await api.put(`/api/posts/${postData._id}/publish`, {});
      const updatedPost = data?.post || data || {};
      toast({ title: "Đăng công khai thành công!", status: "success", duration: 2000, isClosable: true });
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
    if (!token) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để chia sẻ lại bài viết.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    try {
      const { data } = await api.post(`/api/posts/${postData._id}/repost`, { content: repostText });
      toast({ title: "Đã chia sẻ lại bài viết!", status: "success", duration: 2000, isClosable: true });
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
  }, [api, postData, repostText, onPostUpdated, onClose, toast, token]);

  const handleUpdatedFromChild = useCallback(
    (updatedPost) => {
      if (postData?.repostOf && !updatedPost?.repostOf) {
        updatedPost = { ...updatedPost, repostOf: postData.repostOf };
      }
      setPostData(updatedPost);
      safeUpdateUpstream(updatedPost);
    },
    [postData?.repostOf, safeUpdateUpstream]
  );

  if (!postData || !postData._id) return null;

  return (
    <>
      <Box
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        p={4}
        mb={4}
        cursor="pointer"
        bg={postData.status === "draft" ? draftBg : bgColor}
        _hover={{ bg: postData.status === "draft" ? draftHoverBg : hoverBg }}
        onClick={onOpen}
      >
        <Flex align="center" justify="space-between" mb={2}>
          <Flex align="center">
            <Avatar src={postData.author?.avatar} mr={2} name={postData.author?.username || "Người dùng"} />
            <Flex align="center">
              <Link
                to={`/user/${postData.author?._id}`}
                style={{ textDecoration: "none" }}
                onClick={(e) => e.stopPropagation()}
              >
                <Text
                  as="span"
                  fontWeight="bold"
                  color="blue.600"
                  _hover={{ textDecoration: "underline", color: "blue.700", cursor: "pointer" }}
                >
                  {postData.author?.username || "Người dùng"}
                </Text>
              </Link>
              {postData.author?.isVerified && <VerifiedBadgeIcon />}
              {currentUser && currentUser._id !== postData.author?._id && (
                <Text
                  ml={2}
                  fontSize="sm"
                  color={isFollowing ? "gray.500" : "blue.500"}
                  fontWeight="medium"
                  _hover={{
                    textDecoration: "underline",
                    color: isFollowing ? "gray.600" : "blue.700",
                  }}
                  onClick={(e) => handleFollowToggle(e, isFollowing)}
                >
                  {isFollowing ? "Bỏ theo dõi" : "Theo dõi"}
                </Text>
              )}
              {postData.status === "draft" && (
                <Badge ml={2} colorScheme="yellow" variant="subtle">
                  Draft
                </Badge>
              )}
            </Flex>
          </Flex>

          <Text fontSize="sm" color={secondaryTextColor}>
            {postData.updatedAt && postData.updatedAt !== postData.createdAt ? (
              <>Đã chỉnh sửa • {formatTimeAgo(postData.updatedAt)}</>
            ) : (
              <>{formatTimeAgo(postData.createdAt)}</>
            )}
          </Text>
        </Flex>

        {postData.repostOf && postData.repostOf.author ? (
          <>
            {postData?.content && <Text mb={2}>{postData.content}</Text>}
            <RepostBlock actorName={postData.author?.username} repostOf={postData.repostOf} />
          </>
        ) : postData.wasRepost ? (
          <Box border="1px" borderColor="gray.200" borderRadius="md" bg="gray.100" p={3} mt={2}>
            <Text color="gray.600" fontStyle="italic">
              Bài viết gốc đã bị xoá.
            </Text>
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

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader>
            <Flex align="center" justify="space-between">
              <Flex align="center">
                <Text fontWeight="bold" color={textColor}>
                  {postData.author?.username || "Người dùng"}
                </Text>
                {postData.author?.isVerified && <VerifiedBadgeIcon />}
                {postData.status === "draft" && (
                  <Badge ml={2} colorScheme="yellow" variant="subtle">
                    Draft
                  </Badge>
                )}
              </Flex>
              <Text fontSize="sm" color={secondaryTextColor}>
                {formatTimeAgo(postData.createdAt)}
              </Text>
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

          <ModalBody>
            <VStack align="start" spacing={4}>
              <Text color={textColor}>{postData.content}</Text>

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
                <video
                  src={postData.video}
                  controls
                  style={{ width: "100%", borderRadius: 8 }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              {postData.repostOf && postData.repostOf.author ? (
                <RepostBlock actorName={postData.author?.username} repostOf={postData.repostOf} />
              ) : postData.wasRepost ? (
                <Box border="1px" borderColor="gray.200" borderRadius="md" bg="gray.100" p={3} mt={2} w="full">
                  <Text color="gray.600" fontStyle="italic">
                    Bài viết gốc đã bị xoá.
                  </Text>
                </Box>
              ) : null}

              <HStack spacing={4}>
                <IconButton
                  icon={liked ? <FaHeart color="red" /> : <FaRegHeart />}
                  aria-label="Like"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                  }}
                  isLoading={isLiking}
                />
                <IconButton icon={<FaComment />} aria-label="Comment" variant="ghost" onClick={(e) => e.stopPropagation()} />
                <IconButton
                  icon={<FaRetweet color={canRepost ? "teal" : "gray"} />}
                  aria-label="Repost"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canRepost) {
                      toast({
                        title: "Không thể chia sẻ bài viết của chính bạn",
                        status: "info",
                        duration: 2000,
                        isClosable: true,
                      });
                      return;
                    }
                    setIsRepostModalOpen(true);
                  }}
                  isDisabled={!canRepost}
                />
                <IconButton icon={<FaShare />} aria-label="Share" variant="ghost" onClick={(e) => e.stopPropagation()} />
              </HStack>

              <Text fontSize="sm" color="gray.500">
                {likesCount} lượt thích • {comments.length} bình luận • {postData.repostCount || 0} lượt chia sẻ lại
              </Text>

              <VStack align="start" spacing={3} maxH="300px" overflowY="auto" w="full" pl={0}>
                {comments.length > 0 ? (
                  comments.map((c) => (
                    <Flex key={c._id} align="flex-start" w="full">
                      <Avatar size="sm" src={c.user?.avatar} name={c.user?.username} mr={3} mt={1} />
                      <Box 
                        flex="1" 
                        bg={commentBg} 
                        p={2} 
                        borderRadius="md" 
                        boxShadow="sm" 
                        _hover={{ bg: commentHoverBg }}
                        borderColor={borderColor}
                        borderWidth="1px"
                      >
                        <HStack spacing={1}>
                          <Text fontWeight="bold" fontSize="sm" color={textColor}>
                            {c.user?.username || "Người dùng"}
                          </Text>
                          {c.user?.isVerified && <VerifiedBadgeIcon />}
                        </HStack>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          {formatTimeAgo(c.createdAt)}
                        </Text>
                        <Text fontSize="sm" color={textColor}>
                          {c.text}
                        </Text>
                      </Box>
                    </Flex>
                  ))
                ) : (
                  <Text color={secondaryTextColor} fontSize="sm">
                    Chưa có bình luận nào
                  </Text>
                )}
              </VStack>

              <HStack mt={2} w="full">
                <Input
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  bg={commentBg}
                  color={textColor}
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.500" }}
                  _focus={{ borderColor: "blue.500" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  isDisabled={isCommentLoading}
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddComment();
                  }}
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

      <EditPostModal isOpen={isEditOpen} onClose={onEditClose} post={postData} onUpdated={handleUpdatedFromChild} />

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

      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} size="4xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none" maxW="90vw">
          <ModalCloseButton color="white" zIndex={10} />
          <ModalBody p={0}>
            <Flex align="center" justify="center" bg="blackAlpha.800" borderRadius="md">
              <Image src={selectedImage} alt="Preview" maxH="90vh" maxW="100%" objectFit="contain" borderRadius="md" />
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
