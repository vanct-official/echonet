// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from "react";
import { Box, VStack, Flex, Spinner, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProfileHeader from "../components/Profiles/ProfileHeader";
import Post from "../components/posts/Post";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth(); // ✅ lấy currentUser từ context
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const token = localStorage.getItem("token");

  // 🟡 Lấy thông tin người dùng (profile)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = res.data;
        setUser(userData);

        if (currentUser && currentUser._id) {
          const currentUserId = currentUser._id.toString();
          const followersIds = (userData.followers || [])
            .map((f) => f && f.toString())
            .filter(Boolean);

          setIsFollowing(followersIds.includes(currentUserId));
        }

        setFollowersCount(userData.followers?.length || 0);
        setFollowingCount(userData.followed?.length || 0);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [id, token, currentUser]);

  // 🟡 Lấy bài đăng của user
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/posts/user/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, [id, token]);

  // 🟢 Follow / Unfollow
  const handleFollowToggle = async () => {
    if (!token) return alert("Vui lòng đăng nhập");
    if (!currentUser) return alert("Thông tin người dùng chưa tải xong.");

    try {
      const url = `http://localhost:5000/api/users/${id}/${
        isFollowing ? "unfollow" : "follow"
      }`;
      await axios.post(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(!isFollowing);
      setFollowersCount((prev) => prev + (isFollowing ? -1 : 1));
    } catch (err) {
      console.error("Error toggling follow:", err);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  // 🟣 Hiển thị giao diện
  if (loadingUser)
    return <Spinner size="lg" display="block" mx="auto" mt={10} />;

  if (!user) return <Text textAlign="center">Người dùng không tồn tại.</Text>;

  return (
    <Flex maxW="1200px" mx="auto" mt={5} gap={6} px={4}>
      <Sidebar user={currentUser} />
      <Box flex="1">
        <ProfileHeader
          user={user}
          isCurrentUser={currentUser?._id === user._id}
          isFollowing={isFollowing}
          followersCount={followersCount}
          followingCount={followingCount}
          onFollowToggle={handleFollowToggle}
        />

        <VStack spacing={4} align="stretch">
          {loadingPosts ? (
            <Spinner size="lg" display="block" mx="auto" mt={10} />
          ) : posts.length === 0 ? (
            <Text textAlign="center" color="gray.500">
              Người dùng chưa có bài đăng nào.
            </Text>
          ) : (
            posts.map((post) => <Post key={post._id} post={post} />)
          )}
        </VStack>
      </Box>
    </Flex>
  );
}
