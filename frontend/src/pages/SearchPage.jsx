// src/pages/SearchPage.jsx

import React, { useState } from "react";
import {
  Box,
  Input,
  Button,
  Flex,
  VStack,
  Text,
  Spinner,
  Avatar,
  HStack,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { FaSearch, FaComment } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";

export default function SearchPage({ currentUser }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const token = localStorage.getItem("token");

  const handleSearch = async () => {
    if (!searchTerm.trim()) return setResults([]);
    setLoading(true);

    if (!token) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để tìm kiếm.",
        status: "error",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/search?q=${searchTerm}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const filteredResults = res.data.filter(
        (u) => u._id !== currentUser?._id
      );
      setResults(filteredResults);
    } catch (err) {
      console.error("Error searching users:", err);
      toast({
        title: "Lỗi tìm kiếm",
        description: "Không thể kết nối đến API tìm kiếm.",
        status: "error",
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Chuyển hướng đến trang cá nhân
  const handleViewProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  // ✅ Hoặc bắt đầu chat
  const handleStartChat = (targetUser) => {
    navigate(`/chat/${targetUser._id}`);
  };

  const UserResultItem = ({ user }) => (
    <HStack
      p={3}
      borderWidth="1px"
      borderRadius="md"
      justifyContent="space-between"
      alignItems="center"
      w="full"
      _hover={{ bg: "gray.50", cursor: "pointer" }}
      onClick={() => handleViewProfile(user._id)} // 👈 Click toàn dòng để mở profile
    >
      <HStack spacing={4}>
        <Avatar name={user.username} src={user.avatar} />
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold">
            {user.firstname} {user.lastname}
          </Text>
          <Text fontSize="sm" color="gray.500">
            @{user.username}
          </Text>
        </VStack>
      </HStack>
      <Button
        leftIcon={<FaComment />}
        colorScheme="blue"
        size="sm"
        onClick={(e) => {
          e.stopPropagation(); // ⚠️ Ngăn click lan sang mở profile
          handleStartChat(user);
        }}
      >
        Chat
      </Button>
    </HStack>
  );

  return (
    <Flex maxW="1000px" mx="auto" mt={5} gap={6}>
      <Box w="250px" display={{ base: "none", md: "block" }}>
        <Sidebar user={currentUser} />
      </Box>

      <VStack flex={1} p={5} spacing={5} align="stretch">
        <Heading size="lg" mb={4}>
          Tìm kiếm Người dùng
        </Heading>
        <HStack>
          <Input
            placeholder="Nhập tên người dùng hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            colorScheme="blue"
            isLoading={loading}
            leftIcon={<FaSearch />}
          >
            Tìm kiếm
          </Button>
        </HStack>

        <VStack spacing={3} mt={4} align="stretch">
          {loading ? (
            <Spinner size="md" />
          ) : results.length > 0 ? (
            results.map((user) => <UserResultItem key={user._id} user={user} />)
          ) : (
            <Text color="gray.500">
              {searchTerm
                ? "Không tìm thấy kết quả phù hợp."
                : "Hãy nhập từ khóa để tìm kiếm."}
            </Text>
          )}
        </VStack>
      </VStack>
    </Flex>
  );
}
