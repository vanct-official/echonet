import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Image,
  VStack,
  HStack,
  useToast,
  Box,
  IconButton,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import axios from "axios";

export default function EditPostModal({ isOpen, onClose, post, onUpdated }) {
  const toast = useToast();
  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000";

  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]); // ảnh/video mới
  const [existingMedia, setExistingMedia] = useState([]); // ảnh/video cũ (URL)
  const [videoFile, setVideoFile] = useState(null); // video cũ hoặc mới
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Reset dữ liệu mỗi khi mở modal
  useEffect(() => {
    if (isOpen && post) {
      setContent(post.content || "");
      setExistingMedia(post.images || []);
      setVideoFile(post.video || null);
      setMediaFiles([]);
    }
  }, [isOpen, post]);

  // ✅ Chọn file mới (ảnh hoặc video)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.filter((f) => f.type.startsWith("image/"));
    const newVideos = files.filter((f) => f.type.startsWith("video/"));

    setMediaFiles((prev) => [...prev, ...newImages]);

    if (newVideos.length > 0) {
      // Nếu có video mới, ghi đè video cũ
      setVideoFile(newVideos[0]);
    }
  };

  // ✅ Xóa ảnh (cũ hoặc mới)
  const handleRemoveImage = (index, isExisting) => {
    if (isExisting) {
      setExistingMedia((prev) => prev.filter((_, i) => i !== index));
    } else {
      setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ✅ Xóa video
  const handleRemoveVideo = () => setVideoFile(null);

  // ✅ Gửi dữ liệu cập nhật
  // ✅ Gửi dữ liệu cập nhật
const handleSubmit = async () => {
  if (
    !content.trim() &&
    existingMedia.length === 0 &&
    !videoFile &&
    mediaFiles.length === 0
  ) {
    toast({
      title: "Thiếu nội dung",
      description: "Vui lòng nhập nội dung hoặc chọn ảnh/video.",
      status: "warning",
      duration: 2500,
      isClosable: true,
    });
    return;
  }

  setIsLoading(true);

  try {
    const formData = new FormData();
    formData.append("content", content);
    existingMedia.forEach((url) => formData.append("existingImages", url));

    mediaFiles.forEach((file) => formData.append("media", file));
    if (videoFile instanceof File) {
      formData.append("media", videoFile);
    }

    const res = await axios.put(`${API_URL}/api/posts/${post._id}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    toast({
      title: "Đã cập nhật bài viết",
      status: "success",
      duration: 2000,
      isClosable: true,
    });

    // ✅ Giữ lại dữ liệu bài gốc nếu là repost (tránh mất khi chưa reload)
    const updated = res.data.post || res.data;
    if (post.repostOf && !updated.repostOf) {
      updated.repostOf = post.repostOf;
    }

    if (onUpdated) onUpdated(updated);
    onClose();
  } catch (error) {
    console.error("Lỗi cập nhật bài viết:", error);
    toast({
      title: "Lỗi cập nhật",
      description:
        error.response?.data?.message || "Không thể cập nhật bài viết.",
      status: "error",
      duration: 2500,
      isClosable: true,
    });
  } finally {
    setIsLoading(false);
  }
};

  // ✅ Hợp nhất hiển thị ảnh cũ và mới
  const allImages = [
    ...existingMedia.map((url) => ({ type: "existing", url })),
    ...mediaFiles.map((file) => ({
      type: "new",
      url: URL.createObjectURL(file),
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Chỉnh sửa bài viết</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Nội dung */}
            <FormControl>
              <FormLabel fontWeight="semibold">Nội dung</FormLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung bài viết..."
                resize="vertical"
                minH="120px"
              />
            </FormControl>

            {/* Ảnh / video bài viết */}
            <FormControl>
              <FormLabel fontWeight="semibold" mb={2}>
                Ảnh / video bài viết
              </FormLabel>

              <Button
                as="label"
                htmlFor="mediaInput"
                colorScheme="blue"
                variant="outline"
                cursor="pointer"
                w="fit-content"
                mb={3}
              >
                Chọn tệp
              </Button>
              <Input
                id="mediaInput"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                display="none"
              />

              {/* Hiển thị tất cả ảnh */}
              {allImages.length > 0 && (
                <HStack wrap="wrap" spacing={3}>
                  {allImages.map((img, i) => (
                    <Box key={i} position="relative">
                      <Image
                        src={img.url}
                        boxSize="100px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                      <IconButton
                        icon={<CloseIcon />}
                        size="xs"
                        colorScheme="red"
                        position="absolute"
                        top="2px"
                        right="2px"
                        onClick={() =>
                          handleRemoveImage(
                            i,
                            img.type === "existing"
                          )
                        }
                      />
                    </Box>
                  ))}
                </HStack>
              )}

              {/* Video (chỉ 1) */}
              {videoFile && (
                <Box position="relative" mt={3}>
                  <video
                    src={
                      videoFile instanceof File
                        ? URL.createObjectURL(videoFile)
                        : videoFile
                    }
                    controls
                    style={{ width: "150px", borderRadius: "8px" }}
                  />
                  <IconButton
                    icon={<CloseIcon />}
                    size="xs"
                    colorScheme="red"
                    position="absolute"
                    top="2px"
                    right="2px"
                    onClick={handleRemoveVideo}
                  />
                </Box>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Hủy
          </Button>

          {/* 🆕 Nút Đăng bài (chỉ khi đang ở trạng thái draft) */}
          {post?.status === "draft" && (
            <Button
              colorScheme="green"
              mr={3}
              onClick={async () => {
                try {
                  const res = await axios.put(
                    `${API_URL}/api/posts/${post._id}/publish`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  toast({
                    title: "Đã đăng bài viết",
                    description: "Bài nháp đã được đăng thành công.",
                    status: "success",
                    duration: 2500,
                    isClosable: true,
                  });
                  if (onUpdated) onUpdated(res.data.post);
                  onClose();
                } catch (error) {
                  toast({
                    title: "Lỗi khi đăng bài",
                    description: error.response?.data?.message || "Không thể đăng bài.",
                    status: "error",
                    duration: 2500,
                    isClosable: true,
                  });
                }
              }}
            >
              Đăng bài
            </Button>
          )}

          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
            Lưu thay đổi
          </Button>
        </ModalFooter>

      </ModalContent>
    </Modal>
  );
}
