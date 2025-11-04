import { useState, useRef } from "react";
import {
  Box,
  Input,
  Button,
  HStack,
  VStack,
  Image,
  IconButton,
  useToast,
  Textarea,
  useColorModeValue,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const API_URL = "http://localhost:5000";

  const boxBg = useColorModeValue("white", "gray.700");
  const focusBorderColor = useColorModeValue("blue.400", "blue.300");
  const inputBg = useColorModeValue("white", "gray.800");

  // 🆕 HÀM CHUNG CHO CẢ "ĐĂNG" & "LƯU NHÁP"
  const handleSubmit = async (status = "published") => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để tạo bài viết",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!content.trim() && images.length === 0) {
      toast({
        title: "Thiếu nội dung",
        description: "Vui lòng nhập nội dung hoặc chọn hình ảnh",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("status", status); // 🆕 Gửi trạng thái lên server
      images.forEach((img) => formData.append("images", img));

      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Không thể tạo bài viết");

      const data = await res.json();

      toast({
        title: status === "draft" ? "Đã lưu nháp" : "Đã đăng bài",
        description:
          status === "draft"
            ? "Bài viết được lưu ở trạng thái nháp."
            : "Bài viết đã được đăng thành công.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onPostCreated(data);
      setContent("");
      setImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const newImages = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box mb={4} p={4} borderWidth="1px" borderRadius="md" bg={boxBg} boxShadow="sm">
      <Textarea
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        mb={3}
        borderRadius="md"
        focusBorderColor={focusBorderColor}
        bg={inputBg}
        minHeight="100px"
        isDisabled={isLoading}
      />

      {images.length > 0 && (
        <HStack mb={3} spacing={3} overflowX="auto" pb={2}>
          {images.map((img, i) => (
            <Box key={i} position="relative" flexShrink={0}>
              <Image
                src={URL.createObjectURL(img)}
                boxSize="100px"
                objectFit="cover"
                borderRadius="md"
              />
              <IconButton
                icon={<CloseIcon />}
                size="xs"
                position="absolute"
                top={0}
                right={0}
                colorScheme="red"
                onClick={() => removeImage(i)}
              />
            </Box>
          ))}
        </HStack>
      )}

      <VStack align="stretch" spacing={3}>
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          border="none"
          p={0}
          ref={fileInputRef}
          isDisabled={isLoading}
        />

        <HStack spacing={3}>
          {/* 🆕 Nút Lưu nháp */}
          <Button
            colorScheme="gray"
            onClick={() => handleSubmit("draft")}
            isLoading={isLoading}
            loadingText="Đang lưu..."
          >
            Lưu nháp
          </Button>

          {/* Nút Đăng */}
          <Button
            colorScheme="blue"
            onClick={() => handleSubmit("published")}
            isLoading={isLoading}
            loadingText="Đang đăng..."
          >
            Đăng
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
