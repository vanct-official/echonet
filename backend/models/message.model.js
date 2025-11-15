import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    // 1. THAM CHIẾU CUỘC TRÒ CHUYỆN
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },

    // 2. NGƯỜI GỬI
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // 3. NỘI DUNG
    content: {
        type: String,
        trim: true
    },
    
    // 4. PHƯƠNG TIỆN (MEDIA)
    mediaURL: {
        type: String,
        default: null
    },
    type: { // 'text', 'image', 'video'
        type: String,
        default: 'text'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },

    // 5. TRẠNG THÁI ĐỌC
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
}, { timestamps: true }); // Mongoose sẽ tự thêm createdAt (thời gian gửi) và updatedAt

const Message = mongoose.model("Message", MessageSchema);

export default Message;