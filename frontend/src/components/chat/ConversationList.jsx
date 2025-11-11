import { useEffect, useState } from "react";
import { getConversations } from "../../services/chatService";
import { getFollowedUsers } from "../../services/userService";
import { useSocket } from "../../context/SocketContext";
import { Avatar } from "@chakra-ui/react";

const primaryBlue = "#0084ff";
const hoverGray = "#f2f2f2";
const selectedGray = "#e5e5e5";

export default function ConversationList({ onSelectConversation, selectedId }) {
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [following, setFollowing] = useState([]);

  const fetchData = async () => {
    try {
      const resConv = await getConversations();
      setConversations(resConv || []);

      const resFollow = await getFollowedUsers();
      setFollowing(resFollow?.data || resFollow || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách:", err);
      setConversations([]);
      setFollowing([]);
    }
  };

  useEffect(() => {
    fetchData();
    // 🔄 Cập nhật danh sách khi có tin nhắn mới realtime
    socket?.on("receiveMessage", fetchData);
    return () => socket?.off("receiveMessage", fetchData);
  }, [socket]);

  return (
    <div
      style={{
        width: "300px",
        backgroundColor: "white",
        boxShadow: "0 0 10px rgba(0,0,0,0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* --- Người theo dõi --- */}
      <div
        style={{
          padding: "15px",
          fontWeight: "bold",
          fontSize: "18px",
          color: primaryBlue,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        Người bạn đang theo dõi
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {(!following || following.length === 0) ? (
          <div style={{ padding: "15px", color: "#888", fontSize: "14px" }}>
            Chưa theo dõi ai
          </div>
        ) : (
          following.map((user) => (
            <div
              key={user._id}
              onClick={() =>
                onSelectConversation({
                  receiverId: user._id,
                  participants: [user],
                })
              }
              style={{
                padding: "10px 15px",
                cursor: "pointer",
                backgroundColor:
                  selectedId === user._id ? selectedGray : "white",
                display: "flex",
                alignItems: "center",
                borderRadius: "8px",
                margin: "2px 5px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (selectedId !== user._id)
                  e.currentTarget.style.backgroundColor = hoverGray;
              }}
              onMouseLeave={(e) => {
                if (selectedId !== user._id)
                  e.currentTarget.style.backgroundColor = "white";
              }}
            >
              <Avatar size="sm" name={user.username} src={user.avatar} />
              &nbsp;&nbsp;
              <strong>{user.username}</strong>
            </div>
          ))
        )}
      </div>

      {/* --- Cuộc trò chuyện --- */}
      <div
        style={{
          padding: "15px",
          fontWeight: "bold",
          fontSize: "18px",
          color: primaryBlue,
          borderTop: "1px solid #f0f0f0",
        }}
      >
        Cuộc trò chuyện
      </div>

      <div style={{ overflowY: "auto", flex: 2 }}>
        {(!conversations || conversations.length === 0) ? (
          <div style={{ padding: "15px", color: "#888", fontSize: "14px" }}>
            Chưa có tin nhắn nào
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => onSelectConversation(conv)}
              style={{
                padding: "10px 15px",
                cursor: "pointer",
                background: selectedId === conv._id ? selectedGray : "white",
                display: "flex",
                alignItems: "center",
                borderRadius: "8px",
                margin: "2px 5px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (selectedId !== conv._id)
                  e.currentTarget.style.backgroundColor = hoverGray;
              }}
              onMouseLeave={(e) => {
                if (selectedId !== conv._id)
                  e.currentTarget.style.backgroundColor = "white";
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: primaryBlue,
                  marginRight: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                {conv.participants[0].username.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong style={{ fontSize: "15px" }}>
                  {conv.participants.map((p) => p.username).join(", ")}
                </strong>
                <div
                  style={{
                    color: "#777",
                    fontSize: "13px",
                    marginTop: "2px",
                  }}
                >
                  {conv.latestMessage?.content || "Bắt đầu cuộc trò chuyện..."}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
