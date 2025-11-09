import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import Post from "../components/posts/Post.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CreatePost from "../components/posts/CreatePost.jsx";

export default function HomeFeed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const token = localStorage.getItem("token");
  
    try {
      const res = await axios.get("http://localhost:5000/api/posts", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
  
      let allPosts = res.data;
  
      if (token) {
        const myRes = await axios.get("http://localhost:5000/api/posts/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const myDrafts = myRes.data.filter((p) => p.status === "draft");
        allPosts = [
          ...allPosts,
          ...myDrafts.filter((d) => !allPosts.some((p) => p._id === d._id)),
        ];
      }
  
      allPosts.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
  
      setPosts(allPosts);
    } catch (err) {
      console.error("Lỗi khi lấy bài viết:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPosts();
  }, []);
  

  // ✅ Khi có bài viết mới tạo
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // ✅ Khi bài viết được chỉnh sửa / like / comment / cập nhật trạng thái
  const handlePostUpdated = (updatedPost) => {
    if (!updatedPost || !updatedPost._id) return;

    setPosts((prev) => {
      const exists = prev.some((p) => p._id === updatedPost._id);

      let updatedList;
      if (exists) {
        // Cập nhật bài viết cũ
        updatedList = prev.map((p) =>
          p._id === updatedPost._id ? updatedPost : p
        );
      } else {
        // Nếu chưa có (VD: bài đăng công khai mới được publish)
        updatedList = [updatedPost, ...prev];
      }

      // 🔥 Đảm bảo sắp xếp theo updatedAt mới nhất
      return updatedList.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
    });
  };

  // ✅ Khi bài viết bị xóa (tuỳ chọn)
  const handlePostDeleted = (deletedId, originalId) => {
    setPosts((prev) =>
      prev
        .map((p) => {
          // Nếu bài repost trỏ đến bài gốc vừa bị xóa → bỏ liên kết repostOf
          if (p.repostOf && p.repostOf._id === deletedId) {
            return { ...p, repostOf: null };
          }
          return p;
        })
        // Xoá bài bị xóa (có thể là bài gốc hoặc bài repost)
        .filter((p) => p._id !== deletedId)
    );
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
          posts
            .filter(
              (p) =>
                p.status === "published" ||
                (p.status === "draft" && p.author?._id === currentUser?._id)
            )
            .map((post) => (
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
