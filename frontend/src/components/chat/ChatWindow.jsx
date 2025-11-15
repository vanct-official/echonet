import { useEffect, useState, useRef } from "react";
import {
  createOrGetConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  updateMessage,
  deleteMessage,
} from "../../services/chatService";
import MessageInput from "./MessageInput";
import { useSocket } from "../../context/SocketContext";
import {
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { FiMoreVertical } from "react-icons/fi";

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
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem("userId") ?? "";
  const toast = useToast();

  // 🧩 Tìm người nhận
  const receiverId = conversation?.participants?.find(
    (p) => p._id !== currentUserId
  )?._id;

  // Fetch messages when conversation changes + join socket room
  useEffect(() => {
    if (!conversation || !socket) return;
    const convId = conversation._id;

    const handleJoinAndFetch = async () => {
      try {
        if (socket?.connected) socket.emit("joinConversation", convId);

        const fetched = await getMessages(convId);
        setMessages(fetched || []);

        // mark as read (fire and forget)
        markMessagesAsRead(convId).catch(console.error);
      } catch (err) {
        console.error("Lỗi khi tải tin nhắn:", err);
        setMessages([]);
      }
    };

    handleJoinAndFetch();

    const handleReceiveMessage = (newMessage) => {
      // add only if not exists
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === newMessage._id);
        return exists ? prev : [...prev, newMessage];
      });
    };

    const handleUpdateMessage = ({ _id, content }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === _id ? { ...m, content } : m))
      );
    };

    const handleDeleteMessageEvent = (messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("updateMessage", handleUpdateMessage);
    socket.on("deleteMessage", handleDeleteMessageEvent);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("updateMessage", handleUpdateMessage);
      socket.off("deleteMessage", handleDeleteMessageEvent);
      socket.emit("leaveConversation", convId);
    };
  }, [conversation, socket]);

  // scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                isDeleted: true,
                content: "Tin nhắn đã được xóa",
                mediaURL: null,
              }
            : m
        )
      );
    });

    return () => socket.off("messageDeleted");
  }, [socket]);

  // Send message
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
        // emit so other clients in room receive it (backend may already broadcast)
        socket?.emit("sentMessage", newMessage);
      }
    } catch (error) {
      console.error("❌ Lỗi khi gửi tin nhắn:", error.message || error);
      toast({ title: "Lỗi gửi tin nhắn", status: "error", duration: 2000 });
    }
  };

  // Edit message
  const handleEditMessage = async (msg) => {
    const oldText = typeof msg.content === "string" ? msg.content : "";

    const newText = prompt("Nhập nội dung mới:", oldText);
    if (!newText || newText.trim() === oldText) return;

    try {
      const updated = await updateMessage(msg._id, newText.trim());
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? updated : m)));
    } catch (error) {
      console.error("❌ Lỗi update tin nhắn:", error);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Bạn muốn xóa tin nhắn này?")) return;
    try {
      await deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: "Tin nhắn đã được xóa" }
            : m
        )
      );
      socket?.emit("deleteMessage", {
        messageId,
        conversationId: conversation?._id,
      });
      toast({ title: "Đã xóa tin nhắn", status: "info", duration: 1500 });
    } catch (err) {
      console.error("❌ Lỗi xóa tin nhắn:", err);
      toast({ title: "Lỗi khi xóa", status: "error", duration: 2000 });
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
            const isDeleted = m.isDeleted === true;

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
                      backgroundColor: isDeleted
                        ? "#e6e6e6" // XÁM CHO TIN ĐÃ XOÁ
                        : isSender
                        ? primaryBlue
                        : "white",
                      color: isDeleted
                        ? "#777" // Text xám
                        : isSender
                        ? "white"
                        : "black",

                      padding: "10px 12px",
                      borderRadius: "18px",
                      borderBottomLeftRadius: isSender ? "18px" : "2px",
                      borderBottomRightRadius: isSender ? "2px" : "18px",
                      wordBreak: "break-word",
                      boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.13)",
                      position: "relative",
                      fontStyle: isDeleted ? "italic" : "normal",
                    }}
                  >
                    {/* 🔥 Nếu đã xoá → KHÔNG hiển thị media */}
                    {!isDeleted && m.mediaURL && (
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

                    {/* 🔥 Nội dung text */}
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {isDeleted ? "Tin nhắn đã được xóa" : m.content}
                    </div>

                    {/* 🔥 Thời gian + bạn */}
                    <div
                      style={{
                        fontSize: "11px",
                        color: isDeleted
                          ? "#999" // màu nhẹ cho timestamp tin xoá
                          : isSender
                          ? "#d0e4ff"
                          : "#666",
                        marginTop: "6px",
                        textAlign: isSender ? "right" : "left",
                        display: "flex",
                        justifyContent: isSender ? "flex-end" : "flex-start",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      {isSender && !isDeleted && (
                        <span style={{ fontWeight: 600, opacity: 0.9 }}>
                          Bạn
                        </span>
                      )}
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  {isSender && (
                    <div
                      style={{
                        marginRight: "6px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="Message actions"
                          icon={<FiMoreVertical />}
                          size="sm"
                          variant="ghost"
                        />
                        <MenuList>
                          <MenuItem onClick={() => handleEditMessage(m)}>
                            Chỉnh sửa
                          </MenuItem>
                          <MenuItem onClick={() => handleDeleteMessage(m._id)}>
                            Xóa
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </div>
                  )}
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
