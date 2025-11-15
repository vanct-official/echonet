import React, { useState } from "react";
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
  Collapse,
  useToast,
} from "@chakra-ui/react";
import {
  EditIcon,
  DeleteIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@chakra-ui/icons";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaRetweet,
  FaShare,
} from "react-icons/fa";
import VerifiedBadgeSVG from "/verified-badge-svgrepo-com.svg";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

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

export default function PostDetail(props) {
  const {
    isOpen,
    onClose,
    postData,
    currentUser,
    canEdit,
    onEditOpen,
    handleDelete,
    handlePublish,
    onReportOpen,
    setIsRepostModalOpen,
    handleRepost,
    liked,
    handleLike,
    isLiking,
    fetchLikes,
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
  const replyBg = useColorModeValue("gray.100", "gray.600");
  const scrollbarTrack = useColorModeValue("#f1f1f1", "#2d3748");
  const scrollbarThumb = useColorModeValue("#888", "#4a5568");
  const scrollbarThumbHover = useColorModeValue("#555", "#718096");

  const toast = useToast();
  const token = localStorage.getItem("token");

  // State for reply
  const [expandedComments, setExpandedComments] = useState({});
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplyLoading, setIsReplyLoading] = useState(false);
  const [localComments, setLocalComments] = useState(comments);

  // Update localComments when comments prop changes
  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // Toggle reply section visibility
  const toggleReplySection = (commentId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Send reply to comment
  const handleReplyComment = async (commentId) => {
    if (!replyText.trim()) {
      toast({
        title: "Nhập nội dung reply",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    setIsReplyLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/posts/${postData._id}/comments/${commentId}/reply`,
        { text: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update comments locally with the new reply
      if (res.data?.reply && res.data?.commentId) {
        const { reply, commentId: updatedCommentId } = res.data;
        
        // Update local comments state
        setLocalComments((prevComments) =>
          prevComments.map((c) =>
            c._id === updatedCommentId
              ? { ...c, reply: [...(c.reply || []), reply] }
              : c
          )
        );

        // Also update parent component if callback exists
        if (props.onUpdateComments && typeof props.onUpdateComments === 'function') {
          props.onUpdateComments((prevComments) =>
            prevComments.map((c) =>
              c._id === updatedCommentId
                ? { ...c, reply: [...(c.reply || []), reply] }
                : c
            )
          );
        }

        toast({
          title: "Đã reply comment",
          status: "success",
          duration: 2000,
        });
        setReplyText("");
        setReplyingToCommentId(null);
      } else if (res.data?.post) {
        // Fallback: if backend returns full post, update from it
        const updatedComments = res.data.post.comments || comments;
        setLocalComments(updatedComments);
        
        if (props.onUpdateComments && typeof props.onUpdateComments === 'function') {
          props.onUpdateComments(() => updatedComments);
        }

        toast({
          title: "Đã reply comment",
          status: "success",
          duration: 2000,
        });
        setReplyText("");
        setReplyingToCommentId(null);
      }
    } catch (err) {
      console.error("Error replying to comment:", err);
      toast({
        title: "Lỗi khi reply",
        description: err.response?.data?.message || "Không thể reply bình luận",
        status: "error",
        duration: 2000,
      });
    } finally {
      setIsReplyLoading(false);
    }
  };

  if (!postData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} borderRadius="xl" maxH="90vh" boxShadow="2xl">
        <ModalHeader pb={3} borderBottomWidth="1px" borderColor={borderColor}>
          <Flex align="center" justify="space-between" mb={3}>
            <Flex align="center" flex="1">
              <Avatar
                src={postData.author?.avatar}
                mr={3}
                size="md"
                name={postData.author?.username || "Người dùng"}
                borderWidth="2px"
                borderColor={useColorModeValue("blue.200", "blue.600")}
              />
              <VStack align="start" spacing={0}>
                <Flex align="center">
                  <Text fontWeight="bold" fontSize="lg" color={textColor}>
                    {postData.author?.username || "Người dùng"}
                  </Text>
                  {postData.author?.isVerified && <VerifiedBadgeIcon />}
                  {postData.status === "draft" && (
                    <Badge
                      ml={2}
                      colorScheme="yellow"
                      variant="subtle"
                      fontSize="xs"
                    >
                      Draft
                    </Badge>
                  )}
                </Flex>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {postData.createdAt
                    ? new Date(postData.createdAt).toLocaleString("vi-VN")
                    : ""}
                </Text>
              </VStack>
            </Flex>
          </Flex>

          {canEdit ? (
            <HStack spacing={2}>
              <IconButton
                icon={<EditIcon />}
                aria-label="Chỉnh sửa bài viết"
                size="sm"
                variant="ghost"
                colorScheme="blue"
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
                colorScheme="red"
                onClick={handleDelete}
              />
              {postData.status === "draft" && (
                <Button
                  colorScheme="green"
                  size="sm"
                  onClick={handlePublish}
                  ml="auto"
                >
                  Đăng công khai
                </Button>
              )}
            </HStack>
          ) : (
            currentUser &&
            currentUser._id !== postData.author?._id && (
              <HStack spacing={2}>
                <Button
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReportOpen?.();
                  }}
                >
                  Báo cáo
                </Button>
              </HStack>
            )
          )}
        </ModalHeader>

        <ModalCloseButton
          size="lg"
          borderRadius="full"
          _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
        />
        <ModalBody
          overflowY="auto"
          px={6}
          py={4}
          sx={{
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: scrollbarTrack,
            },
            "&::-webkit-scrollbar-thumb": {
              background: scrollbarThumb,
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: scrollbarThumbHover,
            },
          }}
        >
          <VStack align="start" spacing={5}>
            <Text
              color={textColor}
              fontSize="md"
              lineHeight="1.7"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
            >
              {postData.content}
            </Text>

            {Array.isArray(postData.images) && postData.images.length > 0 && (
              <Box w="full">
                <SimpleGrid
                  columns={
                    postData.images.length === 1
                      ? 1
                      : postData.images.length === 2
                      ? 2
                      : { base: 1, sm: 2, md: 3 }
                  }
                  spacing={4}
                  w="full"
                >
                  {postData.images.map((img, i) => (
                    <Box
                      key={i}
                      position="relative"
                      borderRadius="lg"
                      overflow="hidden"
                      cursor="pointer"
                      boxShadow="md"
                      _hover={{
                        transform: "scale(1.02)",
                        transition: "all 0.3s ease",
                        boxShadow: "xl",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage?.(img);
                        setIsImageModalOpen?.(true);
                      }}
                    >
                      <Image
                        src={img || "/placeholder.svg"}
                        borderRadius="lg"
                        alt={`Post image ${i + 1}`}
                        objectFit="cover"
                        w="100%"
                        h={postData.images.length === 1 ? "400px" : "250px"}
                        fallbackSrc="/placeholder.svg"
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {postData.video && (
              <Box w="full" borderRadius="lg" overflow="hidden" boxShadow="md">
                <video
                  src={postData.video}
                  controls
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    maxHeight: "500px",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Box>
            )}

            {postData.repostOf && (
              <Box
                w="full"
                p={4}
                borderRadius="lg"
                borderWidth="2px"
                borderColor={useColorModeValue("blue.200", "blue.700")}
                bg={useColorModeValue("blue.50", "blue.900")}
                _hover={{
                  bg: useColorModeValue("blue.100", "blue.800"),
                  borderColor: useColorModeValue("blue.300", "blue.600"),
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
                cursor="pointer"
                boxShadow="sm"
                onClick={() => {
                  props.onOpenParentPost?.(postData.repostOf);
                }}
              >
                <HStack align="center" spacing={3} mb={3}>
                  <Avatar
                    size="sm"
                    src={postData.repostOf.author?.avatar}
                    name={postData.repostOf.author?.username}
                    borderWidth="2px"
                    borderColor={useColorModeValue("blue.300", "blue.600")}
                  />
                  <VStack align="start" spacing={0}>
                    <Flex align="center">
                      <Text fontWeight="bold" fontSize="sm" color={textColor}>
                        {postData.repostOf.author?.username || "Người dùng"}
                      </Text>
                      {postData.repostOf.author?.isVerified && (
                        <VerifiedBadgeIcon />
                      )}
                    </Flex>
                    <Text fontSize="xs" color={secondaryTextColor}>
                      Bài viết gốc
                    </Text>
                  </VStack>
                </HStack>

                <Text fontSize="sm" color={textColor} mb={2} lineHeight="1.6">
                  {postData.repostOf.content}
                </Text>

                {Array.isArray(postData.repostOf.images) &&
                  postData.repostOf.images.length > 0 && (
                    <SimpleGrid columns={2} spacing={2} mt={3}>
                      {postData.repostOf.images.map((img, i) => (
                        <Box
                          key={i}
                          borderRadius="md"
                          overflow="hidden"
                          cursor="pointer"
                          _hover={{
                            transform: "scale(1.05)",
                            transition: "0.2s",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            props.setSelectedImage?.(img);
                            props.setIsImageModalOpen?.(true);
                          }}
                        >
                          <Image
                            src={img}
                            alt="Repost image"
                            borderRadius="md"
                            objectFit="cover"
                            h="150px"
                            w="100%"
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}

                {postData.repostOf.video && (
                  <Box borderRadius="md" overflow="hidden" mt={3}>
                    <video
                      src={postData.repostOf.video}
                      controls
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        maxHeight: "300px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                )}
              </Box>
            )}

            <Box w="full" pt={4} borderTopWidth="1px" borderColor={borderColor}>
              <HStack spacing={6} mb={3}>
                <IconButton
                  icon={
                    liked ? (
                      <FaHeart color="red" size="18px" />
                    ) : (
                      <FaRegHeart size="18px" />
                    )
                  }
                  aria-label="Like"
                  variant="ghost"
                  colorScheme="red"
                  size="lg"
                  borderRadius="full"
                  _hover={{
                    bg: useColorModeValue("red.50", "red.900"),
                    transform: "scale(1.1)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike?.();
                  }}
                  isLoading={isLiking}
                />
                <IconButton
                  icon={<FaComment size="18px" />}
                  aria-label="Comment"
                  variant="ghost"
                  colorScheme="blue"
                  size="lg"
                  borderRadius="full"
                  _hover={{
                    bg: useColorModeValue("blue.50", "blue.900"),
                    transform: "scale(1.1)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <IconButton
                  icon={
                    <FaRetweet
                      size="18px"
                      color={
                        postData.author &&
                        postData.author._id !== currentUser?._id
                          ? "#14b8a6"
                          : "#9ca3af"
                      }
                    />
                  }
                  aria-label="Repost"
                  variant="ghost"
                  colorScheme="teal"
                  size="lg"
                  borderRadius="full"
                  _hover={{
                    bg: useColorModeValue("teal.50", "teal.900"),
                    transform: "scale(1.1)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRepostModalOpen?.(true);
                  }}
                  isDisabled={
                    !(
                      currentUser &&
                      postData.author &&
                      currentUser._id !== postData.author._id
                    )
                  }
                />
                <IconButton
                  icon={<FaShare size="18px" />}
                  aria-label="Share"
                  variant="ghost"
                  colorScheme="gray"
                  size="lg"
                  borderRadius="full"
                  _hover={{
                    bg: useColorModeValue("gray.100", "gray.700"),
                    transform: "scale(1.1)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </HStack>

              <HStack spacing={4} fontSize="sm" color={secondaryTextColor}>
                <Text
                  as="span"
                  fontWeight="medium"
                  _hover={{
                    textDecoration: "underline",
                    cursor: "pointer",
                    color: useColorModeValue("red.500", "red.300"),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchLikes?.();
                  }}
                >
                  {likesCount} lượt thích
                </Text>
                <Text as="span">•</Text>
                <Text as="span" fontWeight="medium">
                  {localComments.length} bình luận
                </Text>
                <Text as="span">•</Text>
                <Text as="span" fontWeight="medium">
                  {postData.repostCount || 0} lượt chia sẻ lại
                </Text>
              </HStack>
            </Box>

            <Box w="full" pt={4} borderTopWidth="1px" borderColor={borderColor}>
              <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
                Bình luận ({localComments.length})
              </Text>
              <VStack
                align="start"
                spacing={4}
                maxH="400px"
                overflowY="auto"
                w="full"
                pr={2}
                sx={{
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: scrollbarTrack,
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: scrollbarThumb,
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: scrollbarThumbHover,
                  },
                }}
              >
                {localComments.length > 0 ? (
                  localComments.map((c) => (
                    <Box key={c._id} w="full">
                      <Flex align="flex-start" w="full" gap={3}>
                        <Avatar
                          size="sm"
                          src={c.user?.avatar}
                          name={c.user?.username}
                          borderWidth="2px"
                          borderColor={useColorModeValue(
                            "blue.200",
                            "blue.600"
                          )}
                        />
                        <Box
                          flex="1"
                          bg={commentBg}
                          p={3}
                          borderRadius="lg"
                          boxShadow="sm"
                          _hover={{
                            bg: commentHoverBg,
                            boxShadow: "md",
                            transform: "translateX(2px)",
                            transition: "all 0.2s",
                          }}
                          borderColor={borderColor}
                          borderWidth="1px"
                        >
                          <HStack spacing={2} mb={1} align="center">
                            <Text
                              fontWeight="bold"
                              fontSize="sm"
                              color={textColor}
                            >
                              {c.user?.username || "Người dùng"}
                            </Text>
                            {c.user?.isVerified && <VerifiedBadgeIcon />}
                            <Text fontSize="xs" color={secondaryTextColor} ml="auto">
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleString("vi-VN")
                                : ""}
                            </Text>
                          </HStack>
                          <Text
                            fontSize="sm"
                            color={textColor}
                            lineHeight="1.6"
                            whiteSpace="pre-wrap"
                            wordBreak="break-word"
                          >
                            {c.text}
                          </Text>
                        </Box>
                      </Flex>
                      {/* Reply button */}
                      <Button
                        size="xs"
                        variant="link"
                        colorScheme="blue"
                        ms={12}
                        mt={2}
                        fontSize="xs"
                        onClick={() => {
                          setReplyingToCommentId(c._id);
                          toggleReplySection(c._id);
                        }}
                        _hover={{ textDecoration: "underline" }}
                      >
                        <HStack spacing={1}>
                          <Text>Trả lời</Text>
                          {expandedComments[c._id] ? (
                            <ChevronUpIcon />
                          ) : (
                            <ChevronDownIcon />
                          )}
                        </HStack>
                      </Button>
                      {/* Reply section */}
                      <Collapse in={expandedComments[c._id]} animateOpacity>
                        <VStack
                          align="start"
                          spacing={3}
                          mt={3}
                          ml={12}
                          w="94%"
                        >
                          {/* Display existing replies if available */}
                          {c.reply &&
                            Array.isArray(c.reply) &&
                            c.reply.length > 0 && (
                              <VStack align="start" spacing={3} w="full" pl={0}>
                                {c.reply.map((r, idx) => (
                                  <Flex
                                    key={idx}
                                    align="flex-start"
                                    w="full"
                                    gap={2}
                                  >
                                    {/* connector line */}
                                    <Box
                                      w="16px"
                                      display="flex"
                                      justifyContent="center"
                                      mr={1}
                                    >
                                      <Box
                                        w="2px"
                                        bg={useColorModeValue(
                                          "blue.300",
                                          "blue.600"
                                        )}
                                        borderRadius="full"
                                        minH="40px"
                                        mt="8px"
                                      />
                                    </Box>

                                    {/* reply bubble */}
                                    <Box
                                      flex="1"
                                      bg={replyBg}
                                      p={3}
                                      borderRadius="lg"
                                      fontSize="sm"
                                      color={textColor}
                                      boxShadow="sm"
                                      borderWidth="1px"
                                      borderColor={useColorModeValue(
                                        "blue.200",
                                        "blue.700"
                                      )}
                                      _hover={{
                                        boxShadow: "md",
                                        borderColor: useColorModeValue(
                                          "blue.300",
                                          "blue.600"
                                        ),
                                      }}
                                    >
                                      <HStack spacing={2} align="center" mb={1}>
                                        <Avatar
                                          size="sm"
                                          src={r.user?.avatar}
                                          name={r.user?.username}
                                          borderWidth="1px"
                                          borderColor={useColorModeValue(
                                            "blue.300",
                                            "blue.600"
                                          )}
                                        />
                                        <Text
                                          fontWeight="600"
                                          fontSize="sm"
                                          color={textColor}
                                        >
                                          {r.user?.username || "Người dùng"}
                                        </Text>
                                        {r.user?.isVerified && (
                                          <VerifiedBadgeIcon />
                                        )}
                                        <Text
                                          fontSize="xs"
                                          color={secondaryTextColor}
                                          ml="auto"
                                        >
                                          {r.createdAt
                                            ? new Date(
                                                r.createdAt
                                              ).toLocaleString("vi-VN")
                                            : ""}
                                        </Text>
                                      </HStack>

                                      <Text
                                        mt={1}
                                        fontSize="sm"
                                        color={textColor}
                                        whiteSpace="pre-wrap"
                                        lineHeight="1.5"
                                      >
                                        {r.text}
                                      </Text>
                                    </Box>
                                  </Flex>
                                ))}
                              </VStack>
                            )}

                          {/* Reply input form */}
                          {replyingToCommentId === c._id && (
                            <HStack w="full" spacing={2} mt={2}>
                              <Input
                                placeholder="Viết trả lời..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                bg={commentBg}
                                color={textColor}
                                borderColor={borderColor}
                                borderRadius="lg"
                                _focus={{
                                  borderColor: "blue.500",
                                  boxShadow:
                                    "0 0 0 1px var(--chakra-colors-blue-500)",
                                }}
                                size="sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleReplyComment(c._id);
                                  }
                                }}
                                isDisabled={isReplyLoading}
                              />
                              <Button
                                size="sm"
                                colorScheme="blue"
                                borderRadius="lg"
                                onClick={() => handleReplyComment(c._id)}
                                isLoading={isReplyLoading}
                              >
                                Gửi
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                borderRadius="lg"
                                onClick={() => {
                                  setReplyingToCommentId(null);
                                  setReplyText("");
                                }}
                              >
                                Huỷ
                              </Button>
                            </HStack>
                          )}
                        </VStack>
                      </Collapse>
                    </Box>
                  ))
                ) : (
                  <Box
                    w="full"
                    textAlign="center"
                    py={8}
                    color={secondaryTextColor}
                  >
                    <Text fontSize="sm" fontStyle="italic">
                      Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>

            <Box w="full" pt={4} borderTopWidth="1px" borderColor={borderColor}>
              <HStack w="full" spacing={3}>
                <Avatar
                  size="sm"
                  src={currentUser?.avatar}
                  name={currentUser?.username}
                  borderWidth="2px"
                  borderColor={useColorModeValue("blue.200", "blue.600")}
                />
                <Input
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment?.(e.target.value)}
                  bg={commentBg}
                  color={textColor}
                  borderColor={borderColor}
                  borderRadius="full"
                  _hover={{
                    borderColor: "blue.400",
                    boxShadow: "sm",
                  }}
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment?.();
                    }
                  }}
                  isDisabled={isCommentLoading}
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddComment?.();
                  }}
                  colorScheme="blue"
                  borderRadius="full"
                  isLoading={isCommentLoading}
                  px={6}
                >
                  Gửi
                </Button>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
