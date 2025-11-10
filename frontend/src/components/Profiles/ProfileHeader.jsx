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
} from "@chakra-ui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import VerifiedBadge from "/verified-badge-svgrepo-com.svg";
import axios from "axios";

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
  const toast = useToast();

  // Modal control
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLockOpen, setIsLockOpen] = useState(false);

  // Form data (lưu ý gender là boolean)
  const [editData, setEditData] = useState({
    firstname: user.firstname || "",
    lastname: user.lastname || "",
    phone: user.phone || "",
    dob: user.dob || "",
    gender: user.gender ?? true, // Mặc định true = Nam
    bio: user.bio || "",
    avatar: user.avatar || "",
  });

  // 🟩 Gửi yêu cầu cập nhật hồ sơ
  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/api/auth/edit-profile`,
        editData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "Cập nhật thông tin thành công",
        description: `${res.data.firstname} ${res.data.lastname}`,
        status: "success",
        duration: 2000,
      });
      setIsEditOpen(false);

      // 🔁 Gọi callback để reload lại dữ liệu user ngoài
      if (onProfileUpdate) onProfileUpdate(res.data);
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
              <MenuItem onClick={() => setIsLockOpen(true)} color="red.500">
                Khóa tài khoản
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
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} isCentered>
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

                {/* ✅ Giới tính boolean */}
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
                  <FormLabel>Ảnh đại diện (URL)</FormLabel>
                  <Input
                    value={editData.avatar}
                    onChange={(e) =>
                      setEditData({ ...editData, avatar: e.target.value })
                    }
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

      {/* --- Modal: Lock Account --- */}
      <Modal isOpen={isLockOpen} onClose={() => setIsLockOpen(false)} isCentered>
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
    </Box>
  );
}
