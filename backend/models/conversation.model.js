import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    // 1. NGƯỜI THAM GIA
    participants: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true
        }
    ],

    // 2. PHÂN LOẠI
    isGroupChat: { 
        type: Boolean, 
        default: false 
    },
    groupName: { 
        type: String, 
        trim: true,
        default: null 
    },
    
    // 3. TIN NHẮN GẦN NHẤT (Tham chiếu)
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },

    // 4. METADATA
    // Có thể thêm trường 'admin' cho chat nhóm nếu cần
}, { timestamps: true }); // Mongoose sẽ tự thêm createdAt và updatedAt
const Conversation = mongoose.model("Conversation", ConversationSchema);

export default Conversation;