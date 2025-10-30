import React, { useState, useEffect } from "react";
import { Box, VStack, Flex, Spinner, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProfileHeader from "../components/Profiles/ProfileHeader";
import Post from "../components/posts/Post";
import Sidebar from "../components/Sidebar";

export default function UserProfilePage({ currentUser }) {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const token = localStorage.getItem("token");

  // Lấy thông tin user và khởi tạo isFollowing
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);

        // Set trạng thái follow và followers count
        // 💡 SỬA LỖI TẠI ĐÂY: Đảm bảo so sánh ID chính xác
        if (currentUser && currentUser._id) {
          // 1. Chuẩn hóa ID của người dùng hiện tại
          const currentUserId = currentUser._id.toString();

          // 2. Chuẩn hóa mảng Followers (Lọc bỏ null/undefined và đảm bảo là chuỗi)
          const followersIds = (res.data.followers || [])
            .map((f) => f && f.toString())
            .filter(Boolean); // Lọc bỏ giá trị null/undefined/rỗng

          // 3. Thiết lập trạng thái
          setIsFollowing(followersIds.includes(currentUserId));
        } else {
          // Trường hợp currentUser chưa được tải hoặc không tồn tại
          setIsFollowing(false);
        }

        setFollowersCount(res.data.followers?.length || 0);
        setFollowingCount(res.data.followed?.length || 0);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [id, token, currentUser]); // Thêm currentUser vào dependency array là đúng

  // Lấy posts (Giữ nguyên)
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

  // handleFollowToggle (Đã sửa lỗi token ở bước trước, giữ nguyên logic này)
  const handleFollowToggle = async () => {
    if (!token) {
      alert("Vui lòng đăng nhập");
      return;
    }

    // Đảm bảo currentUser có tồn tại
    if (!currentUser) {
      alert("Thông tin người dùng hiện tại chưa được tải. Vui lòng thử lại.");
      return;
    }

    try {
      if (!isFollowing) {
        await axios.post(
          `http://localhost:5000/api/users/${id}/follow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      } else {
        await axios.post(
          `http://localhost:5000/api/users/${id}/unfollow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

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
