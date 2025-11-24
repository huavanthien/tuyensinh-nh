// api/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Cấu hình Multer để lưu tệp tạm thời trong bộ nhớ
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload-file', upload.single('attachmentFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không tìm thấy tệp đính kèm.' });
    }

    // Tải tệp lên Cloudinary bằng upload_stream (dành cho Buffer)
    const uploadStream = cloudinary.uploader.upload_stream({
      folder: 'tuyensinh-attachments', // Thư mục lưu trữ trên Cloudinary
      resource_type: 'auto', // Cloudinary tự xác định loại tệp (ảnh, video, raw file)
      // Tên public_id có thể là ID duy nhất trong DB của bạn
      // public_id: req.file.originalname.split('.')[0] 
    }, async (error, result) => {
      if (error || !result) {
        console.error('Cloudinary Upload Error:', error);
        return res.status(500).json({ message: 'Lỗi tải tệp lên Cloudinary.' });
      }

      const fileUrl = result.secure_url; // Lấy URL công khai

      // ⚠️ QUAN TRỌNG: Lưu fileUrl vào Database
      // ... Logic lưu URL vào bảng settings hoặc hồ sơ ...

      res.status(200).json({ 
        message: 'Tải tệp thành công!', 
        fileUrl: fileUrl,
        publicId: result.public_id // ID Cloudinary nếu cần xóa sau này
      });
    });

    // Kết thúc luồng tải lên bằng Buffer của tệp
    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
});

module.exports = router;
