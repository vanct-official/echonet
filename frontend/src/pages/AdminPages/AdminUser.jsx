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
  Avatar,
} from "@chakra-ui/react";
import {
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaUserShield,
  FaUser,
  FaLock,
  FaUnlock,
} from "react-icons/fa";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";

const API_BASE_URL = "http://localhost:5000/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const toast = useToast();
  const token = localStorage.getItem("token");

  // 🟩 Fetch danh sách người dùng
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/users/all`, {
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

  // 🟨 Đổi quyền (admin <-> user)
  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await axios.put(
        `${API_BASE_URL}/admin/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );

      toast({
        title: "Cập nhật thành công",
        description: `Đã đổi quyền thành ${newRole}.`,
        status: "success",
        duration: 2000,
      });
    } catch (err) {
      console.error("Error toggling role:", err);
      toast({
        title: "Thất bại",
        description: "Không thể thay đổi quyền người dùng.",
        status: "error",
        duration: 2000,
      });
    }
  };

  // 🟦 Toggle Active / Lock Account
  const handleToggleActive = async (userId, isActive) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/admin/${userId}/active`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data.user;
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: updated.isActive } : u
        )
      );

      toast({
        title: updated.isActive
          ? "Đã kích hoạt tài khoản"
          : "Đã khóa tài khoản",
        status: updated.isActive ? "success" : "warning",
        duration: 2000,
      });
    } catch (err) {
      console.error("Error toggling active:", err);
      toast({
        title: "Lỗi hệ thống",
        description: "Không thể cập nhật trạng thái tài khoản.",
        status: "error",
        duration: 2000,
      });
    }
  };
  const getAvatarUrl = (avatar) => {
    if (!avatar) return "https://via.placeholder.com/40";
    return avatar;
  };

  // 🔍 Tìm kiếm & lọc
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading)
    return (
      <Flex maxW="1500px" mx="auto" minH="100vh">
        <AdminSidebar />
        <Spinner size="xl" m="auto" />
      </Flex>
    );

  return (
    <Flex w="100%" minH="100vh">
      <AdminSidebar />
      <Box ml="250px" flex="1" p={6}>
        <Heading mb={8}>Quản lý Người dùng</Heading>

        {/* Bộ lọc & tìm kiếm */}
        <Flex mb={6} gap={4}>
          <Input
            placeholder="Tìm kiếm Username hoặc Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            flex={1}
          />
          <Select
            placeholder="Lọc theo quyền"
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
              <Th>Avatar</Th>
              <Th>Username</Th>
              <Th>Giới tính</Th>
              <Th>Email</Th>
              <Th>Quyền</Th>
              <Th>Trạng thái</Th>
              <Th>Xác minh</Th>
              <Th>Hành động</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.map((user) => (
              <Tr key={user._id}>
                <Td>
                  <Avatar
                    size="sm"
                    name={user.username}
                    src={getAvatarUrl(user.avatar)}
                  />
                </Td>
                <Td fontWeight="bold">{user.username}</Td>
                <Td>
                  {user.gender === true
                    ? "Nam"
                    : user.gender === false
                    ? "Nữ"
                    : "Chưa rõ"}
                </Td>
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

                {/* ✅ Cột Trạng thái */}
                <Td>
                  <Box
                    as="span"
                    px={2}
                    py={1}
                    borderRadius="full"
                    bg={user.isActive ? "green.100" : "gray.200"}
                    color={user.isActive ? "green.700" : "gray.600"}
                    fontWeight="medium"
                  >
                    {user.isActive ? "Hoạt động" : "Bị khóa"}
                  </Box>
                </Td>

                {/* Xác minh */}
                <Td>
                  <Tooltip
                    label={user.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                  >
                    <Box color={user.isVerified ? "green.500" : "red.500"}>
                      {user.isVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                    </Box>
                  </Tooltip>
                </Td>

                {/* Các hành động */}
<Td>
  {user.role !== "admin" ? (
    <HStack spacing={2}>
      {/* Nút đổi quyền */}
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

      {/* Nút active / lock */}
      <Tooltip
        label={
          user.isActive
            ? "Khóa tài khoản"
            : "Kích hoạt lại tài khoản"
        }
      >
        <IconButton
          icon={user.isActive ? <FaLock /> : <FaUnlock />}
          size="sm"
          colorScheme={user.isActive ? "red" : "green"}
          onClick={() =>
            handleToggleActive(user._id, user.isActive)
          }
          aria-label="Toggle active"
        />
      </Tooltip>
    </HStack>
  ) : (
    <Text fontSize="sm" color="gray.500">
      (Admin)
    </Text>
  )}
</Td>

              </Tr>
            ))}
          </Tbody>
        </Table>

        {filteredUsers.length === 0 && (
          <Text textAlign="center" mt={8} color="gray.500">
            Không tìm thấy người dùng phù hợp.
          </Text>
        )}
      </Box>
    </Flex>
  );
}
