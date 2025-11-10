import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import Post from "../components/posts/Post.jsx";
import Sidebar from "../components/Sidebar.jsx";
import RightSidebar from "../components/RightSidebar.jsx";
import CreatePost from "../components/posts/CreatePost.jsx";

export default function HomeFeed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshSidebar, setRefreshSidebar] = useState(0); // 🆕 thêm state để reload sidebar
  const [followedUsers, setFollowedUsers] = useState(new Set());

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

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    if (!updatedPost || !updatedPost._id) return;

    setPosts((prev) => {
      const exists = prev.some((p) => p._id === updatedPost._id);

      let updatedList;
      if (exists) {
        updatedList = prev.map((p) =>
          p._id === updatedPost._id ? updatedPost : p
        );
      } else {
        updatedList = [updatedPost, ...prev];
      }

      return updatedList.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
    });
  };

  const handlePostDeleted = (deletedId, originalId) => {
    setPosts((prev) =>
      prev
        .map((p) => {
          if (p.repostOf && p.repostOf._id === deletedId) {
            return { ...p, repostOf: null };
          }
          return p;
        })
        .filter((p) => p._id !== deletedId)
    );
  };

  // 🆕 Khi follow/unfollow xong
  const handleFollowChange = (userId, nextState) => {
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (nextState) next.add(userId);
      else next.delete(userId);
      return next;
    });
    setRefreshSidebar(prev => prev + 1);
  };
  

  return (
    <Flex w="100%" minH="100vh">
      <Sidebar user={currentUser} />
      <Box ml="250px" mr="250px" flex="1" p={6}>
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
              isFollowing={followedUsers.has(post.author._id)} // ✅ truyền trạng thái
              onFollowChange={handleFollowChange}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
            ))
        )}
      </Box>

      {/* Sidebar phải */}
      <RightSidebar refreshTrigger={refreshSidebar} /> {/* 🆕 truyền trigger */}
    </Flex>
  );
}
