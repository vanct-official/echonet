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
} from "@chakra-ui/react";
import { DeleteIcon, ArrowBackIcon } from "@chakra-ui/icons";
import { deletePost, fetchAllPosts } from "../../api/post";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMedia, setPreviewMedia] = useState(null);
  const toast = useToast();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const { isOpen, onOpen, onClose } = useDisclosure();

  // 🟢 Load tất cả bài viết
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetchAllPosts("/posts/admin/all");
        setPosts(res);
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

  // 🗑️ Xử lý xóa bài viết
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    try {
      await deletePost(id, token);
      setPosts((prev) => prev.filter((p) => p._id !== id));
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
          <AdminSidebar/>
      <Box ml="250px" flex="1" p={6}>
      <Heading size="lg" mb={6}>
        🛠️ Quản lý bài viết (Admin)
      </Heading>

      {posts.length === 0 ? (
        <Text color="gray.500">Không có bài viết nào.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Người đăng</Th>
              <Th>Nội dung</Th>
              <Th>Phương tiện</Th>
              <Th>Ngày tạo</Th>
              <Th>Hành động</Th>
            </Tr>
          </Thead>
          <Tbody>
            {posts.map((post) => (
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
                  <Text noOfLines={2}>
                    {post.content || "(Không có nội dung)"}
                  </Text>
                </Td>

                {/* 🖼️ Phương tiện */}
                <Td>
                  {/* Ảnh */}
                  {Array.isArray(post.images) && post.images.length > 0 && (
                    <Flex gap={2} wrap="wrap">
                      {post.images.slice(0, 3).map((img, i) => (
                        <Box
                          key={i}
                          boxSize="70px"
                          cursor="pointer"
                          onClick={() => openPreview(img)}
                        >
                          <Image
                            src={img}
                            alt={`image-${i}`}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                            borderRadius="6px"
                          />
                        </Box>
                      ))}
                    </Flex>
                  )}

                  {/* Video */}
                  {post.video && (
                    <Box mt={2} cursor="pointer" onClick={() => openPreview(post.video)}>
                      <video
                        src={post.video}
                        style={{
                          width: "120px",
                          borderRadius: "6px",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  )}
                </Td>

                {/* 📅 Ngày tạo */}
                <Td>{new Date(post.createdAt).toLocaleString("vi-VN")}</Td>

                {/* ❌ Hành động */}
                <Td>
                  <Button
                    leftIcon={<DeleteIcon />}
                    color="gray.600"
                    variant="ghost"
                    _hover={{ color: "red.500" }}
                    onClick={() => handleDelete(post._id)}
                  >
                    Xóa
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* 🔍 Modal xem preview */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={4}>
            {previewMedia?.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                src={previewMedia}
                controls
                style={{ width: "100%", borderRadius: "8px" }}
              />
            ) : (
              <Image
                src={previewMedia}
                alt="Preview"
                w="100%"
                borderRadius="8px"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
    </Flex>
  );
}
