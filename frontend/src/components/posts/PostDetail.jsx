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
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";

import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaRetweet,
  FaShare,
} from "react-icons/fa";
import VerifiedBadgeSVG from "/verified-badge-svgrepo-com.svg";

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

/**
 * Props:
 * isOpen, onClose, postData, currentUser, canEdit,
 * onEditOpen, handleDelete, handlePublish, onReportOpen,
 * setIsRepostModalOpen, handleRepost,
 * liked, handleLike, isLiking, fetchLikes, likesCount,
 * comments, isCommentLoading, newComment, setNewComment, handleAddComment,
 * setSelectedImage, setIsImageModalOpen
 */
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

  if (!postData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <Flex align="center" justify="space-between">
            <Flex align="center">
              <Avatar
                src={postData.author?.avatar}
                mr={2}
                name={postData.author?.username || "Người dùng"}
              />
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
              {postData.createdAt
                ? new Date(postData.createdAt).toLocaleString("vi-VN")
                : ""}
            </Text>
          </Flex>

          {canEdit ? (
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
          ) : (
            currentUser &&
            currentUser._id !== postData.author?._id && (
              <HStack spacing={2} mt={2}>
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

        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={4}>
            <Text color={textColor}>{postData.content}</Text>

            {Array.isArray(postData.images) && postData.images.length > 0 && (
              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3 }}
                spacing={3}
                mt={2}
                w="full"
              >
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

            {postData.video && (
              <video
                src={postData.video}
                controls
                style={{ width: "100%", borderRadius: 8 }}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {postData.repostOf && (
              <Box
                w="full"
                p={3}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
                bg={useColorModeValue("gray.50", "gray.700")}
                _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
                cursor="pointer"
                onClick={() => {
                  props.onOpenParentPost?.(postData.repostOf);
                }}
              >
                <HStack align="center" spacing={2} mb={2}>
                  <Avatar
                    size="sm"
                    src={postData.repostOf.author?.avatar}
                    name={postData.repostOf.author?.username}
                  />
                  <Text fontWeight="bold" color={textColor}>
                    {postData.repostOf.author?.username || "Người dùng"}
                  </Text>

                  {postData.repostOf.author?.isVerified && (
                    <VerifiedBadgeIcon />
                  )}
                </HStack>

                <Text fontSize="sm" color={textColor}>
                  {postData.repostOf.content}
                </Text>

                {Array.isArray(postData.repostOf.images) &&
                  postData.repostOf.images.length > 0 && (
                    <SimpleGrid columns={2} spacing={2} mt={2}>
                      {postData.repostOf.images.map((img, i) => (
                        <Image
                          key={i}
                          src={img}
                          alt="Repost image"
                          borderRadius="md"
                          objectFit="cover"
                          h="120px"
                          cursor="pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.setSelectedImage?.(img);
                            props.setIsImageModalOpen?.(true);
                          }}
                        />
                      ))}
                    </SimpleGrid>
                  )}

                {postData.repostOf.video && (
                  <video
                    src={postData.repostOf.video}
                    controls
                    style={{ width: "100%", borderRadius: 8, marginTop: "6px" }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </Box>
            )}

            <HStack spacing={4}>
              <IconButton
                icon={liked ? <FaHeart color="red" /> : <FaRegHeart />}
                aria-label="Like"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike?.();
                }}
                isLoading={isLiking}
              />
              <IconButton
                icon={<FaComment />}
                aria-label="Comment"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
              />
              <IconButton
                icon={
                  <FaRetweet
                    color={
                      postData.author &&
                      postData.author._id !== currentUser?._id
                        ? "teal"
                        : "gray"
                    }
                  />
                }
                aria-label="Repost"
                variant="ghost"
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
                icon={<FaShare />}
                aria-label="Share"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
              />
            </HStack>

            <Text fontSize="sm" color="gray.500">
              <Text
                as="span"
                _hover={{ textDecoration: "underline", cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  fetchLikes?.();
                }}
              >
                {likesCount} lượt thích
              </Text>
              {" • "} {comments.length} bình luận • {postData.repostCount || 0}{" "}
              lượt chia sẻ lại
            </Text>

            <VStack
              align="start"
              spacing={3}
              maxH="300px"
              overflowY="auto"
              w="full"
              pl={0}
            >
              {comments.length > 0 ? (
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
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleString("vi-VN")
                          : ""}
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
                onChange={(e) => setNewComment?.(e.target.value)}
                bg={commentBg}
                color={textColor}
                borderColor={borderColor}
                _hover={{ borderColor: "blue.500" }}
                _focus={{ borderColor: "blue.500" }}
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
                isLoading={isCommentLoading}
              >
                Gửi
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
