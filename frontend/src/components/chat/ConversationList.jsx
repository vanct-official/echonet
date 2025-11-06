import { useEffect, useState } from "react";
import { getConversations } from "../../services/chatService";
import { getFollowedUsers } from "../../services/userService";

const primaryBlue = "#0084ff"; // Xanh Messenger
const hoverGray = "#f2f2f2";
const selectedGray = "#e5e5e5";

export default function ConversationList({ onSelectConversation, selectedId }) {
  const [conversations, setConversations] = useState([]);
  const [following, setFollowing] = useState([]); // ✅ luôn là mảng

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resConv = await getConversations();
        setConversations(resConv?.data || []); // ✅ fallback []

        const resFollow = await getFollowedUsers();
        setFollowing(resFollow?.data || resFollow || []); // ✅ fallback []
      } catch (err) {
        console.error("Lỗi khi tải danh sách:", err);
        setConversations([]);
        setFollowing([]);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ 
        width: "300px", 
        borderRight: "none", 
        overflowY: "auto",
        backgroundColor: "white", 
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.05)", 
        height: "100%",
        display: "flex",
        flexDirection: "column",
    }}>
      {/* Danh sách người đã follow */}
      <div style={{ 
        padding: "15px 15px 10px 15px", 
        fontWeight: "bold", 
        fontSize: "18px",
        color: primaryBlue, 
        borderBottom: "1px solid #f0f0f0" 
    }}>
        Người bạn đang theo dõi
      </div>

      <div style={{ overflowY: "auto" }}>
        {(!following || following.length === 0) ? (
          <div style={{ padding: "15px", color: "#888", fontSize: "14px" }}>Chưa theo dõi ai</div>
        ) : (
          following.map((user) => (
            <div
              key={user._id}
              onClick={() => onSelectConversation({ _id: user._id, participants: [user] })}
              style={{
                padding: "10px 15px",
                cursor: "pointer",
                backgroundColor: selectedId === user._id ? selectedGray : "white",
                display: "flex",
                alignItems: "center",
                transition: "background-color 0.2s",
                borderRadius: "8px",
                margin: "2px 5px",
              }}
              onMouseEnter={(e) => { 
                  if (selectedId !== user._id) e.currentTarget.style.backgroundColor = hoverGray; 
              }}
              onMouseLeave={(e) => { 
                  if (selectedId !== user._id) e.currentTarget.style.backgroundColor = "white"; 
              }}
            >
                  <div style={{ // Avatar placeholder
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "50%", 
                      backgroundColor: "#ccc", 
                      marginRight: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                  }}>
                      {user.username.charAt(0).toUpperCase()}
                  </div>
              <strong>{user.username}</strong>
            </div>
          ))
        )}
      </div>

      {/* Danh sách cuộc trò chuyện */}
      <div style={{ 
        padding: "15px 15px 10px 15px", 
        fontWeight: "bold", 
        fontSize: "18px",
        color: primaryBlue,
        borderTop: "1px solid #f0f0f0" 
    }}>
        Cuộc trò chuyện
      </div>

      <div style={{ overflowY: "auto" }}>
        {(!conversations || conversations.length === 0) ? (
          <div style={{ padding: "15px", color: "#888", fontSize: "14px" }}>Chưa có tin nhắn nào</div>
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
                transition: "background-color 0.2s",
                borderRadius: "8px",
                margin: "2px 5px",
              }}
              onMouseEnter={(e) => { 
                  if (selectedId !== conv._id) e.currentTarget.style.backgroundColor = hoverGray; 
              }}
              onMouseLeave={(e) => { 
                  if (selectedId !== conv._id) e.currentTarget.style.backgroundColor = "white"; 
              }}
            >
                  <div style={{ // Avatar placeholder
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
                  }}>
                      {conv.participants[0].username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                      <strong style={{ fontSize: "15px" }}>{conv.participants.map((p) => p.username).join(", ")}</strong>
                      <div style={{ color: "#777", fontSize: "13px", marginTop: "2px" }}>
                          {conv.lastMessage ? conv.lastMessage.text : "Bắt đầu cuộc trò chuyện..."}
                      </div>
                  </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}