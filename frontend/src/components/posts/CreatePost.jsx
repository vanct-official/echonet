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
  Textarea, // 💡 Import Textarea
  useColorModeValue, // 💡 Import hook để hỗ trợ Dark Mode
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const API_URL = "http://localhost:5000";

  // 💡 Lấy giá trị màu nền thích hợp cho Light/Dark Mode
  const boxBg = useColorModeValue("white", "gray.700");
  const focusBorderColor = useColorModeValue("blue.400", "blue.300");
  const inputBg = useColorModeValue("white", "gray.800");

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để tạo bài viết",
        status: "error",
        duration: 3,
        isClosable: true,
      });
      return;
    }

    if (!content.trim() && images.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung hoặc chọn hình ảnh",
        status: "warning",
        duration: 3,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        // Lưu ý: Không đặt Content-Type cho FormData, browser sẽ tự thêm boundary
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Xử lý lỗi HTTP (bao gồm 4xx và 5xx)
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${res.status}`
        );
      }

      const data = await res.json();

      toast({
        title: "Thành công",
        description: "Bài viết đã được tạo",
        status: "success",
        duration: 3,
        isClosable: true,
      });

      onPostCreated(data);
      setContent("");
      setImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tạo bài viết. Vui lòng thử lại.",
        status: "error",
        duration: 3,
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
    // ... (logic xóa ảnh giữ nguyên)
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
  };

  const handleKeyDown = (e) => {
    // Gửi bằng Ctrl+Enter (hoặc Cmd+Enter trên Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Box
      mb={4}
      p={4}
      borderWidth="1px"
      borderRadius="md"
      bg={boxBg} // 💡 Áp dụng nền thích ứng Dark Mode
      boxShadow="sm"
    >
      {/* Content Input chuyển sang Textarea */}
      <Textarea // 💡 Đã đổi thành Textarea
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        mb={3}
        borderRadius="md"
        focusBorderColor={focusBorderColor} // 💡 Áp dụng màu viền focus thích ứng
        bg={inputBg} // 💡 Áp dụng nền input thích ứng
        minHeight="100px" // Đặt chiều cao tối thiểu cho Textarea
        isDisabled={isLoading}
      />

      {/* Preview hình ảnh (Giữ nguyên) */}
      {images.length > 0 && (
        <HStack mb={3} spacing={3} overflowX="auto" pb={2}>
          {images.map((img, i) => (
            <Box key={`${i}-${img.name}`} position="relative" flexShrink={0}>
              <Image
                src={URL.createObjectURL(img) || "/placeholder.svg"}
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
                aria-label="Remove image"
                onClick={() => removeImage(i)}
                isDisabled={isLoading}
              />
            </Box>
          ))}
        </HStack>
      )}

      {/* Upload & Submit */}
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
        <Button
          colorScheme="blue"
          onClick={handleSubmit}
          isDisabled={!content.trim() && images.length === 0}
          isLoading={isLoading}
          loadingText="Đang đăng..."
        >
          Đăng
        </Button>
      </VStack>
    </Box>
  );
}
