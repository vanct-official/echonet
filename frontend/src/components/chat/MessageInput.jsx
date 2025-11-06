// src/components/chat/MessageInput.js
import { useState } from "react";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div
      style={{
        display: "flex",
        borderTop: "1px solid #ccc",
        padding: "8px",
        alignItems: "center",
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Nhập tin nhắn..."
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          padding: "10px",
          borderRadius: "20px",
          background: "#f0f2f5",
        }}
      />
      <button
        onClick={handleSend}
        style={{
          marginLeft: "8px",
          background: "#0084ff",
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "20px",
          cursor: "pointer",
        }}
      >
        Gửi
      </button>
    </div>
  );
}
