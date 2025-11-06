// src/components/chat/ChatWindow.js (ĐÃ SỬA HOÀN TOÀN)
import { useEffect, useState, useRef } from "react";
import { getMessages, sendMessage, markMessagesAsRead } from "../../services/chatService";
import MessageInput from "./MessageInput";
import { useSocket } from "../../context/SocketContext";

const primaryBlue = "#0084ff";
const chatBackground = "#f0f2f5"; 

export default function ChatWindow({ conversation }) {
  const [messages, setMessages] = useState([]);
  const socket = useSocket();
  const messagesEndRef = useRef();

  // ✅ LẤY ID NGƯỜI DÙNG: Đảm bảo luôn là chuỗi, khắc phục lỗi null.toString()
  const currentUserId = localStorage.getItem("userId") ?? ''; 

  useEffect(() => {
    if (!conversation) return;
    // ... (Phần logic fetchMessages và Socket.IO giữ nguyên) ...
    const fetchMessages = async () => {
      const fetchedMessages = await getMessages(conversation._id); 
      setMessages(fetchedMessages); 
      await markMessagesAsRead(conversation._id);
    };
    fetchMessages();
    socket?.emit("joinConversation", conversation._id);
    socket?.on("receiveMessage", (message) => {
      if (message.conversation === conversation._id) {
        markMessagesAsRead(conversation._id);
        setMessages((prev) => [...prev, message]);
      }
    });
    socket?.on("messageRead", ({ conversationId, readerId }) => {
      if (conversationId === conversation._id) {
        console.log(`User ${readerId} đã xem tin nhắn`);
      }
    });
    return () => {
      socket?.off("receiveMessage");
      socket?.off("messageRead");
    };
  }, [conversation, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text) => {
    const messageData = {
      conversationId: conversation._id,
      text,
    };
    
    const newMessage = await sendMessage(messageData); 
    socket?.emit("sendMessage", newMessage); 
    setMessages((prev) => [...prev, newMessage]);
  };

  if (!conversation)
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#65676b" }}>Chọn một cuộc trò chuyện để bắt đầu nhắn tin</div>;

  // Logic lấy tên đối tác trò chuyện cho Header
  // ✅ SỬA LỖI: Ép p._id thành chuỗi trước khi so sánh
  const otherParticipants = conversation.participants.filter(p => p._id.toString() !== currentUserId);
  const chatTitle = otherParticipants.length === 1 
    ? otherParticipants[0].username 
    : conversation.participants.map(p => p.username).join(", ");
  
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "white" }}>
        {/* Header Messenger */}
        <div style={{ /* ... styles ... */ }}>
            <div style={{ /* ... styles ... */ }}>
                {otherParticipants[0]?.username.charAt(0).toUpperCase() || 'G'}
            </div>
            <strong style={{ fontSize: "16px", color: "#050505" }}>{chatTitle}</strong>
        </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px", backgroundColor: chatBackground }}>
        {messages.map((m, index) => {
          // Kiểm tra an toàn
          if (!m || !m.sender || !m._id) return null; 
          
          // ✅ CĂN CHỈNH VỊ TRÍ: So sánh chuỗi ID người gửi với chuỗi ID của bạn
          const isSender = m.sender._id.toString() === currentUserId; 
          
          // LOGIC MESSENGER: Hiển thị tên/avatar nếu tin nhắn trước không phải của người này
          const previousMessage = messages[index - 1];
          const showNameOrAvatar = !isSender && 
                                  (!previousMessage || previousMessage.sender._id.toString() !== m.sender._id.toString());
          
          return (
          <div key={m._id}>
                {/* HIỂN THỊ TÊN NGƯỜI GỬI (Chỉ khi là tin nhắn đầu tiên của cụm bên trái) */}
                {showNameOrAvatar && (
                    <div style={{ marginLeft: '44px', fontSize: '12px', color: '#65676b', marginBottom: '4px' }}>
                        <strong>{m.sender.username}</strong>
                    </div>
                )}

            <div
              style={{
                display: "flex",
                justifyContent: isSender ? "flex-end" : "flex-start", // Căn phải/trái
                marginBottom: showNameOrAvatar ? "4px" : "10px", // Giảm khoảng cách nếu có tên
                alignItems: "flex-end", 
              }}
            >
                {/* Avatar Người Khác (Ẩn nếu tin nhắn liên tục) */}
                {!isSender && (
                    <div style={{
                        width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#ccc", 
                        marginRight: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: "bold", fontSize: "12px", 
                        // Ẩn avatar nếu tin nhắn liên tục (tức là showNameOrAvatar là false)
                        opacity: showNameOrAvatar ? 1 : 0, 
                        marginBottom: "4px" 
                    }}>
                        {m.sender.username.charAt(0).toUpperCase() || 'A'}
                    </div>
                )}

            <div
              style={{
                background: isSender ? primaryBlue : "#e4e6eb",
                color: isSender ? "white" : "black",
                padding: "10px 15px", 
                maxWidth: "65%", 
                lineHeight: "1.4",
                // ✅ BO GÓC SỬA: Góc trên bên ngoài (gần avatar/tên) sẽ bo tròn 4px nếu không phải tin đầu cụm
                borderTopLeftRadius: isSender ? "20px" : (showNameOrAvatar ? "4px" : "4px"),
                borderTopRightRadius: isSender ? "4px" : (showNameOrAvatar ? "20px" : "4px"),
                borderBottomLeftRadius: isSender ? "20px" : "20px",
                borderBottomRightRadius: isSender ? "20px" : "20px",
              }}
            >
              {m.content}
            </div>
                {/* Khoảng trống cho Avatar Người Dùng */}
                {isSender && <div style={{ width: "36px" }} />} 
          </div>
        </div>
        )})}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area */}
      <div style={{ /* ... styles ... */ }}>
            <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}