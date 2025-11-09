import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Text,
  Button,
  Flex,
  Skeleton,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import CreatePost from "../../components/posts/CreatePost";
import Post from "../../components/posts/Post";

const USER_API_URL = "http://localhost:5000/api/users/me";
const POSTS_API_URL = "http://localhost:5000/api/posts/me";

export default function AdminMyPost() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const toast = useToast();

  // --- Lấy thông tin admin ---
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setLoadingUser(false);

      try {
        const res = await axios.get(USER_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
        toast({
          title: "Không thể tải thông tin Admin",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [toast]);

  // --- Lấy danh sách bài viết của Admin ---
  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setLoadingPosts(false);

      try {
        const res = await axios.get(POSTS_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  // --- Khi bài đăng bị xóa ---
  const handlePostDeleted = (deletedId) => {
    setPosts((prev) =>
      prev
        .map((p) =>
          p.repostOf?._id === deletedId
            ? { ...p, repostOf: undefined, wasRepost: true }
            : p
        )
        .filter((p) => p._id !== deletedId)
    );
  };

  // --- Loading ---
  if (loadingUser || loadingPosts) {
    return (
      <Flex w="100%" minH="100vh">
        <AdminSidebar />
        <Box ml="250px" flex="1" p={6}>
          <Skeleton height="24px" width="50%" mb={3} />
          <Skeleton height="20px" width="80%" mb={2} />
          <Skeleton height="40px" width="100%" mt={4} />
          <Skeleton height="40px" width="100%" mt={2} />
        </Box>
      </Flex>
    );
  }

  // --- Nếu chưa có user ---
  if (!user) {
    return (
      <Flex w="100%" minH="100vh">
        <AdminSidebar />
        <Box ml="250px" flex="1" textAlign="center" mt={10}>
          Không thể tải thông tin quản trị viên. Vui lòng đăng nhập lại.
        </Box>
      </Flex>
    );
  }

  // --- Hiển thị giao diện chính ---
  return (
    <Flex w="100%" minH="100vh">
      <AdminSidebar />
      <Box ml="250px" flex="1" p={6}>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>
          ✏️ Tạo Bài Đăng Mới (Admin)
        </Text>

        {/* Nút chức năng (nếu muốn mở rộng sau này) */}
        <Box my={4}>
          <Button colorScheme="green" mr={2}>
            Quản lý bài viết
          </Button>
        </Box>

        {/* Form tạo bài viết */}
        <CreatePost
          onPostCreated={(newPost) => {
            const populatedPost = {
              ...newPost,
              author: {
                _id: user._id,
                username: user.username,
                avatar: user.avatar,
                isVerified: user.isVerified,
              },
            };

            setPosts((prev) => {
              const updated = [populatedPost, ...prev];
              return updated.sort(
                (a, b) =>
                  new Date(b.updatedAt || b.createdAt) -
                  new Date(a.updatedAt || a.createdAt)
              );
            });
          }}
        />

        {/* Danh sách bài viết */}
        <VStack align="stretch" spacing={4} mt={6}>
          <Text fontWeight="bold" fontSize="lg" mb={2}>
            📰 Bài viết do Admin tạo
          </Text>

          {posts.length === 0 ? (
            <Text color="gray.500" textAlign="center">
              Chưa có bài viết nào được tạo.
            </Text>
          ) : (
            posts
              .sort(
                (a, b) =>
                  new Date(b.updatedAt || b.createdAt) -
                  new Date(a.updatedAt || a.createdAt)
              )
              .map((post) => (
                <Post
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onPostUpdated={(updatedPost) => {
                    const populatedPost = {
                      ...updatedPost,
                      author: {
                        _id: user._id,
                        username: user.username,
                        avatar: user.avatar,
                        isVerified: user.isVerified,
                      },
                    };

                    setPosts((prev) => {
                      const updated = prev.map((p) =>
                        p._id === populatedPost._id ? populatedPost : p
                      );
                      return updated.sort(
                        (a, b) =>
                          new Date(b.updatedAt || b.createdAt) -
                          new Date(a.updatedAt || a.createdAt)
                      );
                    });
                  }}
                  onPostDeleted={handlePostDeleted}
                />
              ))
          )}
        </VStack>
      </Box>
    </Flex>
  );
}
