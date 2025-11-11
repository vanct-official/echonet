import { useEffect, useState, useRef } from "react";
import {
  createOrGetConversation,
  getMessages,
  getMyMessages,
  sendMessage,
  markMessagesAsRead,
} from "../../services/chatService";
import MessageInput from "./MessageInput";
import { useSocket } from "../../context/SocketContext";
import { Avatar } from "@chakra-ui/react";

// Định nghĩa màu sắc cơ bản
const primaryBlue = "#0b84ff"; // màu xanh cho bong bóng người gửi
const chatBackground = "#f0f2f5";

export default function ChatWindow({ conversation, setConversation }) {
  const [messages, setMessages] = useState([]);
  const socket = useSocket();
  const messagesEndRef = useRef();

  // Lấy ID người dùng hiện tại từ localStorage
  const currentUserId = localStorage.getItem("userId") ?? "";

  /* ------------------------------ LOGIC SOCKET & FETCH MESSAGES ----------------------------- */

  useEffect(() => {
    if (!conversation || !socket) return;

    const convId =
      typeof conversation._id === "object"
        ? conversation._id.toString()
        : conversation._id;

    // Nếu socket đã connect ngay lập tức -> emit join
    if (socket.connected) {
      socket.emit("joinConversation", convId);
      console.log(
        "[client] emit joinConversation",
        convId,
        "socketId:",
        socket.id
      );
    } else {
      // Nếu chưa kết nối, đợi tới khi connect rồi join
      const onConnect = () => {
        socket.emit("joinConversation", convId);
        console.log(
          "[client] on connect -> joinConversation",
          convId,
          "socketId:",
          socket.id
        );
      };
      socket.on("connect", onConnect);
      // Cleanup listener phụ
      return () => {
        socket.off("connect", onConnect);
      };
    }

    // Fetch messages ngay sau khi đảm bảo join (vẫn fetch bất kể join để có lịch sử)
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await getMessages(convId);
        console.log("Tin nhắn lấy từ API:", fetchedMessages);
        setMessages(fetchedMessages);
        await markMessagesAsRead(convId);
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn:", error);
      }
    };
    fetchMessages();

    // Handler nhận message: in log để debug
    const handleReceiveMessage = (message) => {
      console.log("[client] receiveMessage event:", message);
      const messageConvId =
        typeof message.conversation === "object"
          ? message.conversation._id
          : message.conversation;

      if (messageConvId?.toString() === convId) {
        setMessages((prev) => {
          // tránh duplicate
          if (prev.some((m) => String(m._id) === String(message._id)))
            return prev;
          return [...prev, message];
        });
        markMessagesAsRead(convId);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    const handleMessageRead = ({ conversationId, readerId }) => {
      if (conversationId?.toString() === convId) {
        console.log(`✅ User ${readerId} đã xem tin nhắn`);
      }
    };
    socket.on("messageRead", handleMessageRead);

    // Cleanup: leave + off khi unmount hoặc đổi conv
    return () => {
      socket.emit("leaveConversation", convId);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageRead", handleMessageRead);
    };
  }, [conversation, socket]);

  // 4. Auto Scroll xuống tin nhắn cuối cùng
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchMyMessages = async () => {
      const myMsgs = await getMyMessages();
      console.log("🟢 Tin nhắn của chính mình:", myMsgs);
    };
    fetchMyMessages();
  }, []);

  /* ----------------------------------- LOGIC GỬI TIN NHẮN ---------------------------------- */
  const handleSend = async (text, file) => {
    if (!text && !file) return;

    let conversationId = conversation?._id;

    // Nếu chưa có conversation (lần đầu nhắn)
    if (!conversationId && conversation?.receiverId) {
      const newConv = await createOrGetConversation(conversation.receiverId);
      conversationId = newConv._id;
      setConversation((prev) => ({ ...prev, _id: newConv._id }));
      socket.emit("joinConversation", newConv._id);
    }

    const payload = { conversation: conversationId, text };
    let newMessage;

    if (file) {
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
      formData.append("file", file);
      newMessage = await sendMessage(formData, true);
    } else {
      newMessage = await sendMessage(payload);
    }

    if (newMessage?.message) {
      socket.emit("sendMessage", newMessage.message);
    }
  };

  /* -------------------------------------- LOGIC RENDER -------------------------------------- */

  if (!conversation)
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#65676b",
        }}
      >
        Chọn một cuộc trò chuyện để bắt đầu nhắn tin
      </div>
    );

  // Tính toán tiêu đề chat
  const otherParticipants = conversation.participants.filter(
    (p) => p._id.toString() !== currentUserId
  );
  const chatTitle =
    otherParticipants.length === 1
      ? otherParticipants[0].username
      : conversation.participants.map((p) => p.username).join(", ");

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "white",
      }}
    >
      {/* Header Messenger */}
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #e4e6eb",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: primaryBlue,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "10px",
            fontWeight: "bold",
          }}
        >
          {otherParticipants[0]?.username.charAt(0).toUpperCase() || "G"}
        </div>
        <strong style={{ fontSize: "16px", color: "#050505" }}>
          {chatTitle}
        </strong>
      </div>

      {/* Vùng hiển thị tin nhắn */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          backgroundColor: chatBackground,
        }}
      >
        {messages.map((m, index) => {
          if (!m || !m.sender || !m._id) return null;
          const isSender = m.sender._id.toString() === currentUserId;
          const previousMessage = messages[index - 1];
          const showNameOrAvatar =
            !isSender &&
            (!previousMessage ||
              previousMessage.sender._id.toString() !==
                m.sender._id.toString());

          return (
            <div key={m._id} style={{ display: "block" }}>
              {/* Hiển thị Tên người gửi (nếu cần) */}
              {showNameOrAvatar && (
                <div
                  style={{
                    marginLeft: "44px",
                    fontSize: "12px",
                    color: "#65676b",
                    marginBottom: "4px",
                  }}
                >
                  <strong>{m.sender.username}</strong>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: isSender ? "flex-end" : "flex-start",
                  marginBottom: showNameOrAvatar ? "4px" : "10px",
                  alignItems: "flex-end",
                }}
              >
                {/* Avatar người gửi (nếu là người nhận) */}
                {!isSender && (
                  <Avatar size="sm" name={m.sender.username} src={m.sender.avatar} />
                )}

                <div
                  style={{
                    background: isSender ? primaryBlue : chatBackground,
                    color: isSender ? "#ffffff" : "#050505",
                    padding: m.mediaURL && !m.content ? "10px" : "10px 15px",
                    maxWidth: "70%",
                    lineHeight: "1.5",
                    borderRadius: isSender
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    boxShadow: isSender
                      ? "0 4px 12px rgba(11,132,255,0.18)"
                      : "0 1px 2px rgba(0,0,0,0.05)",
                    border: isSender
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                    alignSelf: isSender ? "flex-end" : "flex-start",
                    wordBreak: "break-word",
                    fontSize: "15px",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* LOGIC HIỂN THỊ MEDIA */}
                  {m.mediaURL && (
                    <div
                      style={{
                        marginBottom: m.content ? "8px" : "0",
                        overflow: "hidden",
                      }}
                    >
                      {/* Ảnh */}
                      {m.type === "image" && (
                        <img
                          src={m.mediaURL}
                          alt="Ảnh đính kèm"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "300px",
                            borderRadius: "10px",
                            display: "block",
                          }}
                        />
                      )}

                      {/* Video */}
                      {m.type === "video" && (
                        <video
                          controls
                          src={m.mediaURL}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "300px",
                            borderRadius: "10px",
                            display: "block",
                          }}
                        />
                      )}

                      {/* Tài liệu (File) */}
                      {(m.type === "file" ||
                        (m.type === "text" && m.mediaURL)) && (
                        <a
                          href={m.mediaURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: isSender ? "#e6f4ff" : primaryBlue,
                            textDecoration: "underline",
                            fontWeight: "bold",
                            display: "block",
                            wordBreak: "break-all",
                          }}
                        >
                          📎 Tải xuống Tệp đính kèm (
                          {m.type === "file" ? "Tài liệu" : "File"})
                        </a>
                      )}
                    </div>
                  )}

                  {/* Hiển thị nội dung text */}
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

                {/* Khoảng trống giả cho người gửi */}
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
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid #e4e6eb" }}>
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
