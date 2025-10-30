import multer from "multer";

const storage = multer.memoryStorage(); // lưu tạm trong memory
const upload = multer({ storage });

export default upload;
