import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  useToast,
  Avatar,
  Text,
  Flex,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  ModalHeader,
  ModalFooter,
  VStack,
  HStack,
  Badge,
  
} from "@chakra-ui/react";
import { DeleteIcon, ViewIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { deletePost, fetchAllPosts, fetchPostReports } from "../../api/post";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPostDetail from "../../components/posts/AdminPostDetail.jsx";

const POSTS_PER_PAGE = 10;

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Reports modal state
  const {
    isOpen: isReportsOpen,
    onOpen: onReportsOpen,
    onClose: onReportsClose,
  } = useDisclosure();
  const [reportsForModal, setReportsForModal] = useState([]);
  const [reportsPost, setReportsPost] = useState(null);

  // Detail modal state (for AdminPostDetail)
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const [selectedPostDetail, setSelectedPostDetail] = useState(null);

  // 🟢 Load tất cả bài viết
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetchAllPosts("/posts/admin/all");
        // Sắp xếp từ mới nhất xuống cũ nhất
        const sortedPosts = res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(sortedPosts);
        setCurrentPage(1); // Reset về trang 1 khi load dữ liệu mới
      } catch (err) {
        toast({
          title: "Lỗi khi tải bài viết",
          description: err.message || "Không thể tải danh sách bài viết.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  // Mở modal danh sách báo cáo (fetch on demand)
  const openReports = async (post) => {
    try {
      setReportsPost(post);

      const data = await fetchPostReports(post._id); // luôn dùng GET
      setReportsForModal(data.reports);

      onReportsOpen();
    } catch (err) {
      toast({
        title: "Lỗi khi lấy báo cáo",
        description: err?.message || "Không thể tải danh sách báo cáo.",
        status: "error",
      });
    }
  };

  // Mở modal chi tiết bài viết (AdminPostDetail)
  const openDetail = (post) => {
    setSelectedPostDetail(post);
    onDetailOpen();
  };

  // 🗑️ Xử lý xóa bài viết
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    try {
      await deletePost(id, token);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      // Reset về trang 1 nếu trang hiện tại trống
      setCurrentPage(1);
      toast({
        title: "Đã xóa bài viết",
        description: "Bài viết đã được xóa thành công.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Lỗi khi xóa bài viết",
        description: err.message || "Không thể xóa bài viết.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 🖼️ Mở preview ảnh hoặc video
  const openPreview = (url) => {
    setPreviewMedia(url);
    onOpen();
  };

  // Tính toán phân trang
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Flex w="100%" minH="100vh">
      {/* 1. ADMIN SIDEBAR */}
      <AdminSidebar />
      <Box ml="250px" flex="1" p={6}>
        <Heading size="lg" mb={6}>
          🛠️ Quản lý bài viết (Admin)
        </Heading>

        {posts.length === 0 ? (
          <Text color="gray.500">Không có bài viết nào.</Text>
        ) : (
          <>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Người đăng</Th>
                  <Th>Nội dung</Th>
                  <Th>Phương tiện</Th>
                  <Th>Báo cáo</Th>
                  <Th>Ngày tạo</Th>
                  <Th>Hành động</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentPosts.map((post) => (
                  <Tr key={post._id}>
                    {/* 🧍 Người đăng */}
                    <Td>
                      <Flex align="center">
                        <Avatar size="sm" src={post.author?.avatar} mr={2} />
                        <Text fontWeight="medium">{post.author?.username}</Text>
                      </Flex>
                    </Td>

                    {/* 📝 Nội dung */}
                    <Td maxW="300px">
                      <Text noOfLines={2}>{post.content || "(Không có nội dung)"}</Text>
                    </Td>

                    {/* 🖼️ Phương tiện */}
                    <Td>
                      {/* Ảnh */}
                      {Array.isArray(post.images) && post.images.length > 0 && (
                        <Flex gap={2} wrap="wrap">
                          {post.images.slice(0, 5).map((img, i) => (
                            <Box key={i} boxSize="70px" cursor="pointer" onClick={() => openPreview(img)}>
                              <Image src={img} alt={`image-${i}`} w="100%" h="100%" objectFit="cover" borderRadius="6px" />
                            </Box>
                          ))}
                        </Flex>
                      )}

                      {/* Video */}
                      {post.video && (
                        <Box mt={2} cursor="pointer" onClick={() => openPreview(post.video)}>
                          <video src={post.video} style={{ width: "120px", borderRadius: "6px", objectFit: "cover" }} />
                        </Box>
                      )}
                    </Td>

                    {/* 🔎 Báo cáo */}
                    <Td>
                      {post.reports && post.reports.length > 0 ? (
                        <HStack spacing={3}>
                          <Badge colorScheme="red">{post.reports.length}</Badge>
                          <Button size="sm" leftIcon={<ViewIcon />} onClick={() => openReports(post)}>
                            Xem
                          </Button>
                        </HStack>
                      ) : (
                        <Text color="gray.500">Không có báo cáo</Text>
                      )}
                    </Td>

                    {/* 📅 Ngày tạo */}
                    <Td>{new Date(post.createdAt).toLocaleString("vi-VN")}</Td>

                    {/* ❌ Hành động */}
                    <Td>
                      <HStack>
                        <Button size="sm" leftIcon={<ViewIcon />} onClick={() => openDetail(post)}>
                          Xem
                        </Button>
                        <Button
                          leftIcon={<DeleteIcon />}
                          color="gray.600"
                          variant="ghost"
                          _hover={{ color: "red.500" }}
                          onClick={() => handleDelete(post._id)}
                        >
                          Xóa
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {/* Phần phân trang */}
            <Flex justify="center" align="center" mt={8} gap={4}>
              <Button
                leftIcon={<ChevronLeftIcon />}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                isDisabled={currentPage === 1}
              >
                Trước
              </Button>

              <HStack spacing={2}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    colorScheme={currentPage === page ? "blue" : "gray"}
                    variant={currentPage === page ? "solid" : "outline"}
                    size="sm"
                    minW="40px"
                  >
                    {page}
                  </Button>
                ))}
              </HStack>

              <Button
                rightIcon={<ChevronRightIcon />}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                isDisabled={currentPage === totalPages}
              >
                Sau
              </Button>

              <Text ml={4} fontSize="sm" color="gray.600">
                Trang {currentPage} / {totalPages} ({posts.length} bài viết)
              </Text>
            </Flex>
          </>
        )}

        {/* 🔍 Modal xem preview */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <ModalBody p={4}>
              {previewMedia?.match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={previewMedia} controls style={{ width: "100%", borderRadius: "8px" }} />
              ) : (
                <Image src={previewMedia} alt="Preview" w="100%" borderRadius="8px" />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Modal danh sách báo cáo */}
        <Modal isOpen={isReportsOpen} onClose={onReportsClose} size="lg" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Danh sách báo cáo</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {!reportsForModal || reportsForModal.length === 0 ? (
                <Text>Không có báo cáo</Text>
              ) : (
                <VStack align="stretch" spacing={4}>
                  {reportsForModal.map((r, idx) => {
                    const user = r.user || {};
                    const status = r.status || "pending";
                    const statusColor = status === "pending" ? "yellow" : status === "resolved" ? "green" : "red";
                    return (
                      <Box key={r._id || idx} p={3} borderRadius="md" borderWidth="1px" _hover={{ boxShadow: "sm" }}>
                        <HStack spacing={3} align="start">
                          <Avatar size="sm" src={r.user.avatar || undefined} name={r.user.username || r.user._id || "Người dùng"} />
                          <Box flex="1">
                            <HStack justify="space-between" align="start">
                              <Box>
                                <Text fontWeight="600">{user.username || "Người dùng ẩn"}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {user.role ? user.role : "role: -"}
                                </Text>
                              </Box>

                              <VStack spacing={1} align="end">
                                <Badge colorScheme={statusColor} variant="subtle" px={2}>
                                  {status === "pending" ? "Đang chờ" : status === "resolved" ? "Đã xử lý" : status}
                                </Badge>
                                <Badge colorScheme="red" variant="outline" px={2}>
                                  {r.reason}
                                </Badge>
                              </VStack>
                            </HStack>

                            {r.details && (
                              <Text mt={2} whiteSpace="pre-wrap">
                                {r.details}
                              </Text>
                            )}

                            <HStack mt={3} justify="space-between">
                              <Text fontSize="sm" color="gray.500">
                                {r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN") : ""}
                              </Text>

                              <HStack>
                                {user._id && (
                                  <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/users/${user._id}`)}>
                                    Xem người dùng
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      toast({ title: "Đánh dấu đã xử lý (chưa gọi API)", status: "info" });
                                    } catch (err) {
                                      toast({ title: "Lỗi", description: err?.message, status: "error" });
                                    }
                                  }}
                                >
                                  Đánh dấu đã xử lý
                                </Button>
                              </HStack>
                            </HStack>
                          </Box>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onReportsClose}>Đóng</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Post detail modal (opened from action "Xem") */}
        <AdminPostDetail
          isOpen={isDetailOpen}
          onClose={() => {
            setSelectedPostDetail(null);
            onDetailClose();
          }}
          postData={selectedPostDetail}
          handleDelete={() => selectedPostDetail && handleDelete(selectedPostDetail._id)}
          likesCount={selectedPostDetail ? (selectedPostDetail.likes?.length || 0) : 0}
          comments={selectedPostDetail ? (selectedPostDetail.comments || []) : []}
          isCommentLoading={false}
          newComment={""}
          setNewComment={() => {}}
          handleAddComment={() => {}}
          setSelectedImage={() => {}}
          setIsImageModalOpen={() => {}}
        />
      </Box>
    </Flex>
  );
}
