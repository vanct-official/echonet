import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react"; // 💡 Thêm Spinner và Text
import Post from "../components/posts/Post.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CreatePost from "../components/posts/CreatePost.jsx";

// 💡 Đổi tên prop nhận vào thành { currentUser } để đồng bộ với tên bạn sử dụng
export default function HomeFeed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true); // Thêm state loading

  useEffect(() => {
    // Tối ưu hóa: Lấy token để gửi kèm, đề phòng API cần xác thực
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/posts", {
        // Gửi token nếu có
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("Lỗi khi lấy bài viết:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Flex maxW="1000px" mx="auto" mt={5}>
      {/* Sidebar */}
      {/* Truyền prop currentUser xuống Sidebar */}
      <Sidebar user={currentUser} />

      {/* Feed */}
      <Box flex={1} p={5}>
        <CreatePost
          // Chắc chắn chỉ cho phép đăng bài nếu đã đăng nhập
          isDisabled={!currentUser}
          onPostCreated={(newPost) => setPosts([newPost, ...posts])}
        />

        {loading ? (
          // Hiển thị loading spinner
          <Spinner size="lg" display="block" mx="auto" mt={10} />
        ) : posts.length === 0 ? (
          // Hiển thị thông báo khi không có bài đăng
          <Text textAlign="center" color="gray.500" mt={10}>
            Không có bài viết nào để hiển thị.
          </Text>
        ) : (
          // 💡 SỬA LỖI: Đã truyền currentUser xuống component Post
          posts.map((post) => (
            <Post key={post._id} post={post} currentUser={currentUser} />
          ))
        )}
      </Box>
    </Flex>
  );
}
