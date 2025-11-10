import { useEffect, useState, useRef } from "react";
import { getMessages, sendMessage, markMessagesAsRead } from "../../services/chatService"; 
import MessageInput from "./MessageInput";
import { useSocket } from "../../context/SocketContext";

// Định nghĩa màu sắc cơ bản
const primaryBlue = "#0084ff";
const chatBackground = "#f0f2f5"; 

export default function ChatWindow({ conversation }) {
    const [messages, setMessages] = useState([]);
    const socket = useSocket();
    const messagesEndRef = useRef();

    // Lấy ID người dùng hiện tại từ localStorage
    const currentUserId = localStorage.getItem("userId") ?? ''; 

    /* ------------------------------ LOGIC SOCKET & FETCH MESSAGES ----------------------------- */
    
    useEffect(() => {
        if (!conversation) return;
        
        const fetchMessages = async () => {
            try {
                const fetchedMessages = await getMessages(conversation._id); 
                setMessages(fetchedMessages); 
                // Đánh dấu tin nhắn là đã đọc (Mark Read)
                await markMessagesAsRead(conversation._id);
            } catch (error) {
                console.error("Lỗi khi tải tin nhắn:", error);
            }
        };

        fetchMessages();
        
        // 1. Join Conversation Room
        socket?.emit("joinConversation", conversation._id);
        
        // 2. Listener nhận tin nhắn mới
        socket?.on("receiveMessage", (message) => {
            if (message.conversation === conversation._id) {
                markMessagesAsRead(conversation._id);
                setMessages((prev) => [...prev, message]);
            }
        });

        // 3. Listener trạng thái đã đọc (Tùy chọn)
        socket?.on("messageRead", ({ conversationId, readerId }) => {
            if (conversationId === conversation._id) {
                console.log(`User ${readerId} đã xem tin nhắn`);
            }
        });

        // Cleanup
        return () => {
            socket?.off("receiveMessage");
            socket?.off("messageRead");
        };
    }, [conversation, socket]);

    // 4. Auto Scroll xuống tin nhắn cuối cùng
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ----------------------------------- LOGIC GỬI TIN NHẮN ---------------------------------- */

    const handleSend = async (text, file) => {
        if (!conversation) return;
        
        let newMessage;
        
        if (file) {
            // Xử lý gửi tệp (File Upload)
            const formData = new FormData();
            formData.append("conversation", conversation._id); 
            formData.append("file", file); // Key 'file' phải khớp với route backend
            if (text) {
                formData.append("text", text);
            }
            
            newMessage = await sendMessage(formData, true); 
        } else if (text) {
            // Xử lý gửi tin nhắn text thông thường (JSON)
            const messageData = {
                conversation: conversation._id, 
                text,
            };
            newMessage = await sendMessage(messageData);
        } else {
            return; 
        }
        
        // Cập nhật state và gửi qua Socket.IO
        if (newMessage) {
            socket?.emit("sendMessage", newMessage); 
            setMessages((prev) => [...prev, newMessage]);
        }
    };

    /* -------------------------------------- LOGIC RENDER -------------------------------------- */
    
    if (!conversation)
        return (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#65676b" }}>
                Chọn một cuộc trò chuyện để bắt đầu nhắn tin
            </div>
        );

    // Tính toán tiêu đề chat
    const otherParticipants = conversation.participants.filter(p => p._id.toString() !== currentUserId);
    const chatTitle = otherParticipants.length === 1 
        ? otherParticipants[0].username 
        : conversation.participants.map(p => p.username).join(", ");
    
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "white" }}>
            
            {/* Header Messenger */}
            <div style={{ padding: "10px 20px", borderBottom: "1px solid #e4e6eb", display: "flex", alignItems: "center" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: primaryBlue, color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", fontWeight: 'bold' }}>
                    {otherParticipants[0]?.username.charAt(0).toUpperCase() || 'G'}
                </div>
                <strong style={{ fontSize: "16px", color: "#050505" }}>{chatTitle}</strong>
            </div>

            {/* Vùng hiển thị tin nhắn */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", backgroundColor: chatBackground }}>
                {messages.map((m, index) => {
                    if (!m || !m.sender || !m._id) return null; 
                    const isSender = m.sender._id.toString() === currentUserId; 
                    const previousMessage = messages[index - 1];
                    const showNameOrAvatar = !isSender && 
                                             (!previousMessage || previousMessage.sender._id.toString() !== m.sender._id.toString());
                    
                    return (
                        <div key={m._id} style={{ display: 'block' }}>
                            
                            {/* Hiển thị Tên người gửi (nếu cần) */}
                            {showNameOrAvatar && (
                                <div style={{ marginLeft: '44px', fontSize: '12px', color: '#65676b', marginBottom: '4px' }}>
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
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", fontSize: "14px", fontWeight: "bold", visibility: showNameOrAvatar ? 'visible' : 'hidden' }}>
                                        {m.sender.username.charAt(0).toUpperCase() || 'A'}
                                    </div>
                                )}

                                <div
                                    style={{
                                        background: isSender ? primaryBlue : "#e4e6eb",
                                        color: isSender ? "white" : "black",
                                        // Điều chỉnh padding nếu chỉ có media
                                        padding: (m.mediaURL && !m.content) ? "10px" : "10px 15px", 
                                        maxWidth: "65%", 
                                        lineHeight: "1.4",
                                        borderRadius: "20px",
                                    }}
                                >
                                    {/* LOGIC HIỂN THỊ MEDIA */}
                                    {m.mediaURL && (
                                        <div style={{ marginBottom: m.content ? '8px' : '0', overflow: 'hidden' }}>
                                            
                                            {/* Ảnh */}
                                            {m.type === 'image' && (
                                                <img 
                                                    src={m.mediaURL} 
                                                    alt="Ảnh đính kèm" 
                                                    style={{ 
                                                        maxWidth: '100%', maxHeight: '300px', borderRadius: '10px', display: 'block'
                                                    }} 
                                                />
                                            )}
                                            
                                            {/* Video */}
                                            {m.type === 'video' && (
                                                <video 
                                                    controls 
                                                    src={m.mediaURL} 
                                                    style={{ 
                                                        maxWidth: '100%', maxHeight: '300px', borderRadius: '10px', display: 'block'
                                                    }} 
                                                />
                                            )}
                                            
                                            {/* Tài liệu (File) */}
                                            {(m.type === 'file' || (m.type === 'text' && m.mediaURL)) && (
                                                <a 
                                                    href={m.mediaURL} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    style={{ 
                                                        color: isSender ? 'white' : primaryBlue, 
                                                        textDecoration: 'underline', 
                                                        fontWeight: 'bold',
                                                        display: 'block',
                                                        wordBreak: 'break-all'
                                                    }}
                                                >
                                                    📎 Tải xuống Tệp đính kèm ({m.type === 'file' ? 'Tài liệu' : 'File'})
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Hiển thị nội dung text */}
                                    {m.content}
                                </div>
                                
                                {/* Khoảng trống giả cho người gửi */}
                                {isSender && <div style={{ width: "32px", height: "32px", visibility: 'hidden', marginLeft: '10px' }} />} 
                            </div>
                        </div>
                    )
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