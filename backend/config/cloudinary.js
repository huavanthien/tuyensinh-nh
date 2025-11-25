// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  // Lấy từ biến môi trường
  cloud_name: process.env.dkh7q3gzj,
  api_key: process.env.355631845698237,
  api_secret: process.env.ZesBfaXL8TUCfVga5lhzImZbLqg,
  secure: true, // Khuyến nghị: Bật HTTPS cho URL ảnh
});

module.exports = cloudinary;
