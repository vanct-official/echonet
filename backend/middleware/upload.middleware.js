// middleware/upload.middleware.js

import multer from "multer";
import path from "path";

const storage = multer.memoryStorage(); // lưu tạm trong memory
const upload = multer({ storage });

export default upload;