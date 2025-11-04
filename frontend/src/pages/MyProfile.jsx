import React, { useEffect, useState } from "react";
import {
  Box,
  Skeleton,
  VStack,
  Text,
  Button,
  Flex,
} from "@chakra-ui/react";
import axios from "axios";
import ProfileHeader from "../components/Profiles/ProfileHeader";
import Sidebar from "../components/Sidebar";
import Post from "../components/posts/Post";
import CreatePost from "../components/posts/CreatePost";

const USER_API_URL = "http://localhost:5000/api/users/me";
const POSTS_API_URL = "http://localhost:5000/api/posts/me";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // --- Lấy thông tin user ---
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
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  // --- Lấy bài đăng của chính mình ---
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

  // ✅ Khi bài viết bị xóa
  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  // --- Loading state ---
  if (loadingUser || loadingPosts) {
    return (
      <Flex maxW="1200px" mx="auto" mt={5} gap={6} px={4}>
        <Sidebar />
        <Box flex="1">
          <Skeleton circle size="20" mb={4} />
          <Skeleton height="24px" width="50%" mb={2} />
          <Skeleton height="20px" width="70%" mb={2} />
          <Skeleton height="40px" width="100%" mt={4} />
          <Skeleton height="40px" width="100%" mt={2} />
        </Box>
      </Flex>
    );
  }

  if (!user) {
    return (
      <Flex maxW="1200px" mx="auto" mt={5} gap={6} px={4}>
        <Sidebar />
        <Box flex="1" textAlign="center" mt={10}>
          Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.
        </Box>
      </Flex>
    );
  }

  // --- Tính toán số lượng ---
  const followersCount = user.followers?.length || 0;
  const followingCount = user.followed?.length || 0;
  const postsCount = posts.length;

  // --- Hiển thị profile + bài đăng ---
  return (
    <Flex maxW="1000px" mx="auto" mt={5} gap={6} px={4}>
      <Sidebar user={user} />
      <Box flex="1">
        <ProfileHeader
          user={user}
          isCurrentUser={true}
          followersCount={followersCount}
          followingCount={followingCount}
          postsCount={postsCount}
        />

        {/* Nút chức năng */}
        <Box my={4}>
          <Button colorScheme="blue" mr={2}>
            Chỉnh sửa profile
          </Button>
        </Box>

        {/* Component tạo bài viết */}
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

        {/* 📰 Tất cả bài viết (đã đăng & nháp) */}
        <VStack align="stretch" spacing={4} mt={6}>
          <Text fontWeight="bold" fontSize="lg" mb={2}>
            📰 Bài viết của bạn
          </Text>

          {posts.length === 0 ? (
            <Text color="gray.500" textAlign="center">
              Bạn chưa có bài viết nào.
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
