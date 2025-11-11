// middleware/upload.middleware.js

import multer from "multer";
import path from "path";

// ✅ Sử dụng Disk Storage để tạo đường dẫn vật lý (req.file.path)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Lưu file tạm thời vào thư mục 'uploads'
        // Đảm bảo thư mục 'uploads/' đã được tạo sẵn trong thư mục gốc của server
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        // Đặt tên file duy nhất: fieldname-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 1024 * 1024 * 20 // Giới hạn 20MB (tùy chọn)
    }
});

export default upload;