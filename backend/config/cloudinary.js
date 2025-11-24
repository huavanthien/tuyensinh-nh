// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  // Lấy từ biến môi trường
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Khuyến nghị: Bật HTTPS cho URL ảnh
});

module.exports = cloudinary;
