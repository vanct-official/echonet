import { useEffect, useState, useRef } from "react";
import {
  createOrGetConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "../../services/chatService";
import MessageInput from "./MessageInput";
import { useSocket } from "../../context/SocketContext";
import { Avatar } from "@chakra-ui/react";

const primaryBlue = "#0b84ff";
const chatBackground = "#f0f2f5";

// 🖼️ Modal xem ảnh (Lightbox)
const ImageModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        cursor: "zoom-out",
      }}
    >
      <img
        src={src}
        alt="Full size"
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          borderRadius: "8px",
          boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default function ChatWindow({ conversation, setConversation }) {
  const [messages, setMessages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const socket = useSocket();
  const messagesEndRef = useRef();
  const currentUserId = localStorage.getItem("userId") ?? "";

  // 🧩 Tìm người nhận
  const receiverId = conversation?.participants?.find(
    (p) => p._id !== currentUserId
  )?._id;

  /* ----------------------------- SOCKET & FETCH MESSAGES ---------------------------- */
  useEffect(() => {
    if (!conversation || !socket) return;
    const convId = conversation._id.toString();

    const handleJoinAndFetch = async () => {
      if (socket.connected) socket.emit("joinConversation", convId);

      try {
        const fetchedMessages = await getMessages(convId);
        setMessages(fetchedMessages || []);
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn:", error);
        setMessages([]);
      }

      markMessagesAsRead(convId).catch(console.error);
    };

    handleJoinAndFetch();
    socket.on("connect", handleJoinAndFetch);

    // ✅ Nhận tin nhắn realtime, chống trùng
    const handleReceiveMessage = (newMessage) => {
      const senderId = newMessage.sender?._id || newMessage.sender;
      if (senderId === currentUserId) return; // bỏ qua chính mình

      setMessages((prev) => {
        const exists = prev.some((m) => m._id === newMessage._id);
        return exists ? prev : [...prev, newMessage];
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("connect", handleJoinAndFetch);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.emit("leaveConversation", convId);
    };
  }, [conversation, socket, currentUserId]);

  // ✅ Tự động cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ----------------------------- GỬI TIN NHẮN ---------------------------- */
  const handleSend = async (text, file) => {
    if (!text && !file) return;
    let conversationId = conversation?._id;

    // Nếu chưa có conversation → tạo mới
    if (!conversationId && conversation?.receiverId) {
      try {
        const newConv = await createOrGetConversation(conversation.receiverId);
        conversationId = newConv._id;
        setConversation(newConv);
        socket?.emit("joinConversation", newConv._id);
      } catch (err) {
        console.error("Lỗi tạo conversation:", err);
        return;
      }
    }

    if (!conversationId)
      return console.error("Không thể xác định Conversation ID");

    try {
      let newMessage;
      if (file) {
        const formData = new FormData();
        formData.append("conversation", conversationId);
        if (text) formData.append("text", text);
        formData.append("file", file);
        newMessage = await sendMessage(formData, true);
      } else {
        newMessage = await sendMessage({ conversation: conversationId, text });
      }

      if (newMessage && newMessage._id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
          return exists ? prev : [...prev, newMessage];
        });
      }
    } catch (error) {
      console.error("❌ Lỗi khi gửi tin nhắn:", error.message || error);
    }
  };

  /* ----------------------------- UI HIỂN THỊ ---------------------------- */
  if (!conversation) {
    return (
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: chatBackground,
          fontSize: "18px",
          color: "#777",
        }}
      >
        Chọn một cuộc trò chuyện để bắt đầu
      </div>
    );
  }

  const receiver = conversation.participants.find(
    (p) => p._id !== currentUserId
  );

  return (
    <>
      <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />

      <div
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: chatBackground,
          height: "100%",
          borderLeft: "1px solid #e4e6eb",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #e4e6eb",
            display: "flex",
            alignItems: "center",
            backgroundColor: "white",
          }}
        >
          <Avatar
            size="sm"
            name={receiver?.username || "Người dùng"}
            src={receiver?.avatar}
            style={{ marginRight: "10px" }}
          />
          <strong>{receiver?.username || "Người dùng"}</strong>
        </div>

        {/* Message Area */}
        <div
          style={{
            flexGrow: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.map((m, index) => {
            const senderId = m.sender?._id || m.sender;
            const isSender = senderId === currentUserId;

            return (
              <div
                key={m._id || `${index}-${m.createdAt}`}
                style={{
                  display: "flex",
                  justifyContent: isSender ? "flex-end" : "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: isSender ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    maxWidth: "70%",
                  }}
                >
                  {!isSender && (
                    <Avatar
                      size="xs"
                      name={m.sender?.username || "User"}
                      src={m.sender?.avatar}
                      style={{
                        marginRight: "10px",
                        width: "32px",
                        height: "32px",
                      }}
                    />
                  )}
                  {isSender && (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        visibility: "hidden",
                        marginLeft: "10px",
                      }}
                    />
                  )}

                  {/* Bong bóng tin nhắn */}
                  <div
                    style={{
                      backgroundColor: isSender ? primaryBlue : "white",
                      color: isSender ? "white" : "black",
                      padding: "10px 12px",
                      borderRadius: "18px",
                      borderBottomLeftRadius: isSender ? "18px" : "2px",
                      borderBottomRightRadius: isSender ? "2px" : "18px",
                      wordBreak: "break-word",
                      boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.13)",
                    }}
                  >
                    {/* Hiển thị media */}
                    {m.mediaURL && (
                      <div style={{ marginBottom: m.content ? "8px" : "0" }}>
                        {m.type === "image" && (
                          <img
                            src={m.mediaURL}
                            alt="media"
                            onClick={() => setSelectedImage(m.mediaURL)}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "250px",
                              borderRadius: "8px",
                              display: "block",
                              cursor: "zoom-in",
                            }}
                          />
                        )}
                        {m.type === "video" && (
                          <video
                            controls
                            src={m.mediaURL}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "250px",
                              borderRadius: "8px",
                              display: "block",
                            }}
                          />
                        )}
                        {(m.type === "file" || m.type === "document") && (
                          <a
                            href={m.mediaURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: isSender ? "white" : primaryBlue,
                              textDecoration: "underline",
                            }}
                          >
                            📎 Tải xuống tệp đính kèm
                          </a>
                        )}
                      </div>
                    )}

                    {/* Nội dung text */}
                    {m.content}
                    <div
                      style={{
                        fontSize: "11px",
                        color: isSender ? "#d0e4ff" : "#666",
                        marginTop: "6px",
                        textAlign: isSender ? "right" : "left",
                      }}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "10px 20px", borderTop: "1px solid #e4e6eb" }}>
          <MessageInput
            onSend={handleSend}
            currentConversationId={conversation?._id}
            receiverId={receiverId}
          />
        </div>
      </div>
    </>
  );
}
