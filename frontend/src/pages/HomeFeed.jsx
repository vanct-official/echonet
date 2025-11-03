import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import Post from "../components/posts/Post.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CreatePost from "../components/posts/CreatePost.jsx";

export default function HomeFeed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/posts", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("Lỗi khi lấy bài viết:", err))
      .finally(() => setLoading(false));
  }, []);

  // ✅ Khi có bài viết mới tạo
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // ✅ Khi bài viết được chỉnh sửa
  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => {
      const updated = prev.map((p) =>
        p._id === updatedPost._id ? updatedPost : p
      );
      // 🔥 Sắp xếp lại thứ tự để bài vừa sửa lên đầu
      return updated.sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt).getTime();
        return bTime - aTime;
      });
    });
  };

  // ✅ Khi bài viết bị xóa (tuỳ chọn)
  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  return (
    <Flex maxW="1000px" mx="auto" mt={5}>
      {/* Sidebar */}
      <Sidebar user={currentUser} />

      {/* Feed */}
      <Box flex={1} p={5}>
        <CreatePost
          isDisabled={!currentUser}
          onPostCreated={handlePostCreated}
        />

        {loading ? (
          <Spinner size="lg" display="block" mx="auto" mt={10} />
        ) : posts.length === 0 ? (
          <Text textAlign="center" color="gray.500" mt={10}>
            Không có bài viết nào để hiển thị.
          </Text>
        ) : (
          posts.map((post) => (
            <Post
              key={post._id}
              post={post}
              currentUser={currentUser}
              onPostUpdated={handlePostUpdated} // ✅ thêm callback
              onPostDeleted={handlePostDeleted} // ✅ (nếu bạn có nút xóa sau này)
            />
          ))
        )}
      </Box>
    </Flex>
  );
}
