// src/components/chat/MessageInput.js

import { useState, useRef } from "react";

const primaryBlue = "#0084ff"; 

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const fileInputRef = useRef(null); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim(), null); 
      setText("");
    }
  };

  // Xử lý khi chọn file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onSend(text.trim() || null, file); 
      setText("");
    }
    e.target.value = null; 
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
      {/* 1. Input Tệp Ẩn */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      />

      {/* 2. Nút/Icon Gửi Tệp */}
      <button
        type="button"
        onClick={handleButtonClick}
        style={{ 
            background: 'none', border: 'none', color: primaryBlue, 
            fontSize: '24px', marginRight: '8px', cursor: 'pointer',
            padding: '8px'
        }}
      >
        📎
      </button>
      
      {/* 3. Input Text */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập tin nhắn..."
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          padding: "10px",
          borderRadius: "20px",
          background: "#f0f2f5",
          marginRight: '8px'
        }}
      />
      
      {/* 4. Nút Gửi */}
      <button
        type="submit"
        style={{
          background: primaryBlue,
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "20px",
          cursor: "pointer",
          fontWeight: 'bold'
        }}
      >
        Gửi
      </button>
    </form>
  );
}