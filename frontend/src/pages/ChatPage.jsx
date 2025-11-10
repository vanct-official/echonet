// src/pages/ChatPage.js
import { useState } from "react";
// ✅ IMPORT CHAKRA UI COMPONENTS
import { Flex, Box } from "@chakra-ui/react"; 
import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";
import FollowedList from "../components/chat/FollowedList";
import Sidebar from "../components/Sidebar";

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <Flex w="100%" minH="100vh">
      {/* ⚠️ Cảnh báo: Biến 'user' không được định nghĩa trong component này. 
            Tôi đã loại bỏ nó để tránh lỗi, bạn cần truyền nó từ component cha hoặc context */}
      <Sidebar /> 
      <Box ml="250px" flex="1" p={6}>
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {/* Cột trái: danh sách cuộc trò chuyện */}
      <ConversationList
        onSelectConversation={setSelectedConversation}
        selectedId={selectedConversation?._id}
      />

      {/* Khung giữa: nội dung chat */}
      <ChatWindow conversation={selectedConversation} />


    </div>
    </Box>
    </Flex>
  );
}