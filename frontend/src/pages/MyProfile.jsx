import React, { useEffect, useState } from "react";
import {
  Box,
  Skeleton,
  VStack,
  Text,
  Button,
  Flex, // 💡 Thêm Flex
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

  // --- Xử lý Loading và Layout ---
  // Tôi đang sử dụng lại layout Flex từ UserProfilePage để Sidebar và Nội dung đặt cạnh nhau

  if (loadingUser || loadingPosts) {
    return (
      <Flex maxW="1200px" mx="auto" mt={5} gap={6} px={4}>
        <Sidebar />{" "}
        {/* Sidebar sẽ là loading skeleton nếu nó cũng fetch data */}
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

  // 💡 KHẮC PHỤC LỖI: Tính toán số lượng Followers và Following
  const followersCount = user.followers?.length || 0;
  const followingCount = user.followed?.length || 0;
  // Giả sử user.postsCount không có sẵn, chúng ta dùng độ dài mảng posts
  const postsCount = posts.length;

  // --- Hiển thị profile + bài đăng ---
  return (
    <Flex maxW="1000px" mx="auto" mt={5} gap={6} px={4}>
      <Sidebar user={user} />
      <Box flex="1">
        {/* 💡 SỬA LỖI: Truyền các props thống kê cần thiết */}
        <ProfileHeader
          user={user}
          isCurrentUser={true} // Đây là trang cá nhân
          followersCount={followersCount}
          followingCount={followingCount}
          postsCount={postsCount} // Truyền số lượng bài đăng
        />

        {/* Nút chức năng */}
        <Box my={4}>
          <Button colorScheme="blue" mr={2}>
            Chỉnh sửa profile
          </Button>
        </Box>

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

        {/* Danh sách bài đăng */}
        <VStack align="stretch" spacing={4} mt={4}>
          {posts.length === 0 ? (
            <Text color="gray.500" textAlign="center" mt={10}>
              Bạn chưa có bài đăng nào.
            </Text>
          ) : (
            posts
              .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
              .map((post) => (
                <Post
                  key={post._id}
                  post={post}
                  currentUser={user} // ✅ để hiển thị nút chỉnh sửa
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

                />
              ))

          )}
        </VStack>
      </Box>
    </Flex>
  );
}
