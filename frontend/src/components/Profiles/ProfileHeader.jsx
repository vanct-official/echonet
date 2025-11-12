import React, { useState } from "react";
import {
  Box,
  Avatar,
  VStack,
  Text,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Select,
  Flex, // ✅ Thêm Flex để dùng trong modal danh sách chặn
} from "@chakra-ui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import VerifiedBadge from "/verified-badge-svgrepo-com.svg";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { blockUser, unblockUser, getBlockedUsers } from "../../api/user"; // ✅ Thêm getBlockedUsers

const API_URL = "http://localhost:5000";

export default function ProfileHeader({
  user,
  isCurrentUser = false,
  isFollowing = false,
  followersCount = 0,
  followingCount = 0,
  onFollowToggle,
  onProfileUpdate,
}) {
  const { setUser } = useAuth();
  const toast = useToast();

  // Modal control
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLockOpen, setIsLockOpen] = useState(false);
  const [isConfirmBlockOpen, setIsConfirmBlockOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedListOpen, setIsBlockedListOpen] = useState(false);
  const [blockedList, setBlockedList] = useState([]);

  // Form data
  const [editData, setEditData] = useState({
    firstname: user.firstname || "",
    lastname: user.lastname || "",
    phone: user.phone || "",
    dob: user.dob || "",
    gender: user.gender ?? true, // true = Nam
    bio: user.bio || "",
    avatar: user.avatar || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 🟩 Gửi yêu cầu cập nhật hồ sơ
  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Duyệt các field
      for (const key in editData) {
        if (editData[key] !== undefined && editData[key] !== null) {
          formData.append(key, editData[key]);
        }
      }

      const res = await axios.put(
        `${API_URL}/api/auth/edit-profile`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "Cập nhật thông tin thành công",
        status: "success",
        duration: 2000,
      });
      setIsEditOpen(false);
      setUser(res.data.user); // Cập nhật user trong AuthContext

      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi cập nhật thông tin",
        description:
          error.response?.data?.message || "Không thể kết nối tới server",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleLockAccount = () => {
    toast({
      title: "Tài khoản đã bị khóa",
      status: "warning",
      duration: 2000,
    });
    setIsLockOpen(false);
  };

  const handleBlockToggle = async () => {
    console.log("🔹 Gọi block API cho:", user._id);
    try {
      if (isBlocked) {
        await unblockUser(user._id);
        toast({ title: `Đã bỏ chặn ${user.username}`, status: "success" });
        setIsBlocked(false);
      } else {
        await blockUser(user._id);
        toast({ title: `Đã chặn ${user.username}`, status: "warning" });
        setIsBlocked(true);
      }
      setIsConfirmBlockOpen(false);
    } catch (err) {
      console.error("❌ Lỗi khi gọi block API:", err);
      toast({
        title: "Lỗi khi chặn người dùng",
        description:
          err?.response?.data?.message || "Không thể kết nối tới server",
        status: "error",
      });
    }
  };

  // 🧩 Xử lý đổi mật khẩu
  const handleChangePasswordSubmit = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      return toast({
        title: "Vui lòng nhập đầy đủ thông tin",
        status: "warning",
        duration: 3000,
      });
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast({
        title: "Mật khẩu xác nhận không khớp",
        status: "error",
        duration: 3000,
      });
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/auth/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "Đổi mật khẩu thành công",
        status: "success",
        duration: 3000,
      });
      setIsChangePasswordOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi đổi mật khẩu",
        description:
          error.response?.data?.message || "Không thể kết nối tới server",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await unblockUser(userId);
      setBlockedList((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Lỗi khi bỏ chặn:", err);
    }
  };

  return (
    <Box
      w="full"
      textAlign="center"
      py={6}
      borderWidth="1px"
      borderRadius="md"
      mb={4}
      position="relative"
    >
      {/* --- Menu 3 chấm --- */}
      {isCurrentUser && (
        <Box position="absolute" top="10px" right="10px">
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<BsThreeDotsVertical />}
              variant="ghost"
              aria-label="Options"
            />
            <MenuList>
              <MenuItem onClick={() => setIsEditOpen(true)}>
                Thay đổi thông tin cá nhân
              </MenuItem>

              {/* 🧱 Danh sách chặn */}
              <MenuItem
                onClick={async () => {
                  try {
                    const data = await getBlockedUsers();
                    setBlockedList(data);
                    setIsBlockedListOpen(true);
                  } catch (err) {
                    console.error("Lỗi khi tải danh sách chặn:", err);
                  }
                }}
              >
                Danh sách chặn
              </MenuItem>

              <MenuItem onClick={() => setIsChangePasswordOpen(true)}>
                Đổi mật khẩu
              </MenuItem>

              <MenuItem onClick={() => setIsLockOpen(true)} color="red.500">
                Khóa tài khoản
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      )}

      {!isCurrentUser && (
        <Box position="absolute" top="10px" right="10px">
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<BsThreeDotsVertical />}
              variant="ghost"
              aria-label="Options"
            />
            <MenuList>
              <MenuItem
                onClick={() => setIsConfirmBlockOpen(true)}
                color={isBlocked ? "green.500" : "red.500"}
              >
                {isBlocked ? "Bỏ chặn người dùng" : "Chặn người dùng"}
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      )}

      {/* --- Avatar + Name --- */}
      <Avatar
        size="2xl"
        name={user.username}
        src={user.avatar || undefined}
        mb={4}
      />
      <HStack justify="center" spacing={2}>
        <Text fontSize="2xl" fontWeight="bold">
          {user.firstname} {user.lastname}
        </Text>
        {user.isVerified && (
          <img
            src={VerifiedBadge}
            alt="Verified"
            style={{ width: "20px", height: "20px" }}
          />
        )}
        {user.role === "admin" && (
          <Box
            as="span"
            bg="green.500"
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
            ml={2}
          >
            Admin
          </Box>
        )}
      </HStack>

      <Text fontSize="xl" fontWeight="medium">
        @{user.username}
      </Text>

      {user.bio && (
        <Text fontSize="md" color="gray.500" maxW="sm" mx="auto" mt={2}>
          {user.bio}
        </Text>
      )}

      {/* --- Follow / Unfollow --- */}
      {!isCurrentUser && (
        <Button
          mt={4}
          colorScheme={isFollowing ? "gray" : "blue"}
          onClick={onFollowToggle}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </Button>
      )}

      {/* --- Stats --- */}
      <HStack spacing={8} mt={4} justify="center">
        <VStack spacing={0}>
          <Text fontWeight="bold">{followersCount}</Text>
          <Text fontSize="sm" color="gray.500">
            Followers
          </Text>
        </VStack>
        <VStack spacing={0}>
          <Text fontWeight="bold">{followingCount}</Text>
          <Text fontSize="sm" color="gray.500">
            Following
          </Text>
        </VStack>
        <VStack spacing={0}>
          <Text fontWeight="bold">{user.postsCount || 0}</Text>
          <Text fontSize="sm" color="gray.500">
            Posts
          </Text>
        </VStack>
      </HStack>

      {/* --- Modal: Edit Profile --- */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Thay đổi thông tin cá nhân</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box as="form" id="editProfileForm">
              <Box
                display="grid"
                gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
                gap={4}
              >
                <FormControl>
                  <FormLabel>Họ</FormLabel>
                  <Input
                    value={editData.firstname}
                    onChange={(e) =>
                      setEditData({ ...editData, firstname: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Tên</FormLabel>
                  <Input
                    value={editData.lastname}
                    onChange={(e) =>
                      setEditData({ ...editData, lastname: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Số điện thoại</FormLabel>
                  <Input
                    value={editData.phone || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ngày sinh</FormLabel>
                  <Input
                    type="date"
                    value={
                      editData.dob
                        ? new Date(editData.dob).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditData({ ...editData, dob: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Giới tính</FormLabel>
                  <Select
                    value={editData.gender ? "true" : "false"}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        gender: e.target.value === "true",
                      })
                    }
                  >
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Ảnh đại diện</FormLabel>
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditData({ ...editData, avatar: file }); // lưu file thật
                      }
                      console.log("Ảnh đã chọn:", file);
                    }}
                  />
                </FormControl>
              </Box>

              <FormControl mt={4}>
                <FormLabel>Giới thiệu</FormLabel>
                <Textarea
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData({ ...editData, bio: e.target.value })
                  }
                />
              </FormControl>
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleEditSubmit}>
              Lưu thay đổi
            </Button>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
              Hủy
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 🔑 Modal: Đổi mật khẩu */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Đổi mật khẩu</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Mật khẩu hiện tại</FormLabel>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Mật khẩu mới</FormLabel>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleChangePasswordSubmit}
            >
              Lưu thay đổi
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsChangePasswordOpen(false)}
            >
              Hủy
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- Modal: Lock Account --- */}
      <Modal
        isOpen={isLockOpen}
        onClose={() => setIsLockOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Khóa tài khoản</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Bạn có chắc chắn muốn <b>khóa tài khoản</b> này không? Hành động
              này có thể được hoàn tác bởi quản trị viên.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleLockAccount}>
              Khóa tài khoản
            </Button>
            <Button variant="ghost" onClick={() => setIsLockOpen(false)}>
              Hủy
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 🔒 Modal: Danh sách chặn */}
      <Modal
        isOpen={isBlockedListOpen}
        onClose={() => setIsBlockedListOpen(false)}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Danh sách người bị chặn</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {blockedList.length === 0 ? (
              <Text color="gray.500">Bạn chưa chặn ai.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {blockedList.map((user) => (
                  <Flex
                    key={user._id}
                    align="center"
                    justify="space-between"
                    borderWidth="1px"
                    borderRadius="lg"
                    p={3}
                  >
                    <Flex align="center" gap={3}>
                      <Avatar
                        size="sm"
                        src={user.avatar}
                        name={user.username}
                      />
                      <Text fontWeight="500">{user.username}</Text>
                    </Flex>
                    <Button
                      colorScheme="green"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(user._id)}
                    >
                      Bỏ chặn
                    </Button>
                  </Flex>
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* ⚠️ Modal xác nhận chặn / bỏ chặn */}
      <Modal
        isOpen={isConfirmBlockOpen}
        onClose={() => setIsConfirmBlockOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isBlocked ? "Bỏ chặn người dùng" : "Chặn người dùng"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {isBlocked
                ? `Bạn có chắc muốn bỏ chặn ${user.username}?`
                : `Bạn có chắc muốn chặn ${user.username}? Họ sẽ không thể xem hoặc tương tác với bạn.`}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme={isBlocked ? "green" : "red"}
              mr={3}
              onClick={handleBlockToggle}
            >
              {isBlocked ? "Bỏ chặn" : "Chặn"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsConfirmBlockOpen(false)}
            >
              Hủy
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
