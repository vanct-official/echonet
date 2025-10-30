import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  useToast,
  Input,
  Flex,
  Button,
  Select,
  IconButton,
  Tooltip,
  HStack,
  Text,
} from "@chakra-ui/react";
import {
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaUserShield,
  FaUser,
} from "react-icons/fa";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";

const API_BASE_URL = "http://localhost:5000/api/users/all";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const toast = useToast();
  const token = localStorage.getItem("token");

  // 🔹 Fetch danh sách người dùng
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách người dùng.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // 🔹 Xử lý đổi quyền (Toggle Role)
  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await axios.put(
        `${API_BASE_URL}/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );

      toast({
        title: "Cập nhật thành công",
        description: `Đã đổi quyền người dùng thành ${newRole}.`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error toggling role:", err);
      toast({
        title: "Thất bại",
        description: "Không thể thay đổi quyền người dùng.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // 🔹 Tìm kiếm và lọc
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // 🔹 Loading UI
  if (loading) {
    return (
      <Flex maxW="1500px" mx="auto" minH="100vh">
        <AdminSidebar />
        <Spinner size="xl" m="auto" />
      </Flex>
    );
  }

  // 🔹 Giao diện chính
  return (
    <Flex maxW="1500px" mx="auto" minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Content */}
      <Box flex={1} p={6} bg="white">
        <Heading mb={8}>Quản lý Người dùng</Heading>

        {/* Thanh tìm kiếm và lọc */}
        <Flex mb={6} gap={4}>
          <Input
            placeholder="Tìm kiếm theo Username hoặc Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            flex={1}
          />
          <Select
            placeholder="Lọc theo Quyền"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            w="200px"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
          <Button colorScheme="blue" onClick={fetchUsers}>
            Làm mới
          </Button>
        </Flex>

        {/* Bảng người dùng */}
        <Table variant="striped" colorScheme="gray">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Username</Th>
              <Th>Email</Th>
              <Th>Quyền</Th>
              <Th>Xác minh</Th>
              <Th>Hành động</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.map((user) => (
              <Tr key={user._id}>
                <Td fontSize="xs">{user._id}</Td>
                <Td fontWeight="bold">{user.username}</Td>
                <Td>{user.email}</Td>
                <Td>
                  <Box
                    as="span"
                    px={2}
                    py={1}
                    borderRadius="full"
                    bg={user.role === "admin" ? "red.100" : "blue.100"}
                    color={user.role === "admin" ? "red.700" : "blue.700"}
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    {user.role.toUpperCase()}
                  </Box>
                </Td>
                <Td>
                  <Tooltip
                    label={user.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                  >
                    <Box color={user.isVerified ? "green.500" : "red.500"}>
                      {user.isVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                    </Box>
                  </Tooltip>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Tooltip
                      label={
                        user.role === "admin"
                          ? "Hạ cấp xuống User"
                          : "Nâng cấp lên Admin"
                      }
                    >
                      <IconButton
                        icon={
                          user.role === "admin" ? <FaUser /> : <FaUserShield />
                        }
                        size="sm"
                        colorScheme={
                          user.role === "admin" ? "yellow" : "purple"
                        }
                        onClick={() => handleToggleRole(user._id, user.role)}
                        aria-label="Toggle role"
                      />
                    </Tooltip>

                    <IconButton
                      icon={<FaEdit />}
                      size="sm"
                      colorScheme="blue"
                      aria-label="Edit user"
                    />

                    <IconButton
                      icon={<FaTrash />}
                      size="sm"
                      colorScheme="red"
                      aria-label="Delete user"
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {filteredUsers.length === 0 && (
          <Text textAlign="center" mt={8} color="gray.500">
            Không tìm thấy người dùng nào phù hợp.
          </Text>
        )}
      </Box>
    </Flex>
  );
}
