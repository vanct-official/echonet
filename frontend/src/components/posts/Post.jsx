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
  Select,
} from "@chakra-ui/react";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaRetweet,
} from "react-icons/fa";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import EditPostModal from "./EditPostModal.jsx";
import LikesModal from "./LikesModal.jsx";
import PostDetail from "./PostDetail.jsx";
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
    : `ngày ${date.getDate()} tháng ${
        date.getMonth() + 1
      } năm ${date.getFullYear()}`;
};

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
        {actorName} đã repost bài viết của{" "}
        <b>
          {repostOf.author?.username}{" "}
          {repostOf.author?.isVerified && <VerifiedBadgeIcon />}
        </b>
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

  const [likeUsers, setLikeUsers] = useState([]);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);

  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [repostText, setRepostText] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  // Report modal state
  const reportDisclosure = useDisclosure();
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = reportDisclosure;
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const viewDisclosure = useDisclosure();
  const editDisclosure = useDisclosure();
  const { isOpen, onOpen, onClose } = viewDisclosure;
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = editDisclosure;

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

  const canRepost = !!(
    currentUser &&
    postData?.author?._id &&
    currentUser._id !== postData.author._id
  );

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
    const nextLikes = isLiked
      ? prevLikes.filter((id) => id !== userId)
      : [...prevLikes, userId];

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
  }, [
    token,
    toast,
    currentUser?._id,
    likes,
    api,
    postData,
    safeUpdateUpstream,
  ]);

  const fetchLikes = async () => {
    try {
      const { data } = await api.get(`/api/posts/${postData._id}/likes`);
      setLikeUsers(data || []);
      setIsLikesModalOpen(true);
    } catch (err) {
      toast({
        title: "Không thể tải danh sách thích",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

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
        description:
          err?.response?.data?.message || "Không thể thực hiện hành động này.",
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
      const { data } = await api.post(`/api/posts/${postData._id}/comment`, {
        text,
      });
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
  }, [
    newComment,
    api,
    postData,
    currentUser,
    comments,
    toast,
    safeUpdateUpstream,
    token,
  ]);

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
      toast({
        title: "Đăng công khai thành công!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
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
      const { data } = await api.post(`/api/posts/${postData._id}/repost`, {
        content: repostText,
      });
      toast({
        title: "Đã chia sẻ lại bài viết!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      if (typeof onPostUpdated === "function") {
        onPostUpdated(data);
        onPostUpdated({
          ...postData,
          repostCount: (postData.repostCount || 0) + 1,
        });
      }
      setIsRepostModalOpen(false);
      onClose();
      setRepostText("");
    } catch (err) {
      toast({
        title: "Lỗi khi repost",
        description:
          err?.response?.data?.message || "Không thể repost bài viết này.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [api, postData, repostText, onPostUpdated, onClose, toast, token]);

  const handleReportSubmit = useCallback(async () => {
    if (!token) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để báo cáo bài viết.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    const reason = (reportReason || "").trim();
    if (!reason) {
      toast({
        title: "Vui lòng chọn lý do báo cáo",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setIsReporting(true);
    try {
      await api.post(`/api/posts/${postData._id}/report`, {
        reason,
        details: reportDetails?.trim() || "",
      });
      toast({
        title: "Đã gửi báo cáo",
        description: "Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // reset & close
      setReportReason("");
      setReportDetails("");
      onReportClose();
    } catch (err) {
      toast({
        title: "Lỗi khi gửi báo cáo",
        description: err?.response?.data?.message || "Không thể gửi báo cáo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsReporting(false);
    }
  }, [token, api, postData._id, reportReason, reportDetails, onReportClose, toast]);

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
            <Avatar
              src={postData.author?.avatar}
              mr={2}
              name={postData.author?.username || "Người dùng"}
            />
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
                  _hover={{
                    textDecoration: "underline",
                    color: "blue.700",
                    cursor: "pointer",
                  }}
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
            <RepostBlock
              actorName={postData.author?.username}
              repostOf={postData.repostOf}
            />
          </>
        ) : postData.wasRepost ? (
          <Box
            border="1px"
            borderColor="gray.200"
            borderRadius="md"
            bg="gray.100"
            p={3}
            mt={2}
          >
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

      {/* use PostDetail component for the detailed modal */}
      <PostDetail
        isOpen={isOpen}
        onClose={onClose}
        postData={postData}
        currentUser={currentUser}
        canEdit={canEdit}
        onEditOpen={onEditOpen}
        handleDelete={handleDelete}
        handlePublish={handlePublish}
        onReportOpen={onReportOpen}
        setIsRepostModalOpen={setIsRepostModalOpen}
        handleRepost={handleRepost}
        liked={liked}
        handleLike={handleLike}
        isLiking={isLiking}
        fetchLikes={fetchLikes}
        likesCount={likesCount}
        comments={comments}
        isCommentLoading={isCommentLoading}
        newComment={newComment}
        setNewComment={setNewComment}
        handleAddComment={handleAddComment}
        setSelectedImage={setSelectedImage}
        setIsImageModalOpen={setIsImageModalOpen}
        onUpdateComments={(updateFn) => {
          setPostData((prev) => {
            const updated = {
              ...prev,
              comments: updateFn(prev.comments || []),
            };
            safeUpdateUpstream(updated);
            return updated;
          });
        }}
      />

      <EditPostModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        post={postData}
        onUpdated={handleUpdatedFromChild}
      />

      <Modal
        isOpen={isRepostModalOpen}
        onClose={() => setIsRepostModalOpen(false)}
      >
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

      {/* Report Modal (remain in Post.jsx) */}
      <Modal isOpen={isReportOpen} onClose={onReportClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Báo cáo bài viết</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" mb={3}>
              Vui lòng chọn lý do và mô tả thêm (nếu cần). Chúng tôi sẽ xem xét báo cáo.
            </Text>
            <Box mb={3}>
              <Text fontSize="sm" mb={1}>
                Lý do
              </Text>
              <Select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Chọn lý do"
              >
                <option value="spam">Spam / Quảng cáo</option>
                <option value="harassment">Quấy rối / Lăng mạ</option>
                <option value="nudity">Nội dung nhạy cảm</option>
                <option value="hate">Ngôn từ thù hận</option>
                <option value="other">Khác</option>
              </Select>
            </Box>

            <Box>
              <Text fontSize="sm" mb={1}>
                Chi tiết (tùy chọn)
              </Text>
              <Textarea
                placeholder="Miêu tả thêm (nơi, thời điểm, nội dung vi phạm...)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
              />
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReportClose}>
              Huỷ
            </Button>
            <Button
              colorScheme="red"
              onClick={handleReportSubmit}
              isLoading={isReporting}
            >
              Gửi báo cáo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <LikesModal
        isOpen={isLikesModalOpen}
        onClose={() => setIsLikesModalOpen(false)}
        users={likeUsers}
      />

      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        size="4xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none" maxW="90vw">
          <ModalCloseButton color="white" zIndex={10} />
          <ModalBody p={0}>
            <Flex
              align="center"
              justify="center"
              bg="blackAlpha.800"
              borderRadius="md"
            >
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
