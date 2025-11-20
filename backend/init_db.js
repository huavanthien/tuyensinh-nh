const { Pool } = require('pg');
require('dotenv').config();

// Thay thế chuỗi này bằng External Database URL của bạn nếu chưa cấu hình trong .env
// Ví dụ: const connectionString = 'postgres://user:pass@host/db...';
const connectionString = postgresql://db_tuyensinh_nh_user:XyRAgkGvJj6KUTNuyisYfSUGDAIbCewR@dpg-d4e4hqc9c44c73bj5s90-a.oregon-postgres.render.com/db_tuyensinh_nh;

if (!connectionString) {
    console.error("❌ Lỗi: Chưa có biến môi trường DATABASE_URL.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Bắt buộc cho Render
});

const schemaQuery = `
    -- 1. Bảng Học sinh / Hồ sơ
    CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(50) PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        student_dob DATE,
        student_gender VARCHAR(10),
        student_pid VARCHAR(50),
        ethnicity VARCHAR(50),
        place_of_birth VARCHAR(255),
        hometown VARCHAR(255),
        parent_name VARCHAR(255),
        parent_phone VARCHAR(20),
        address TEXT,
        enrollment_type VARCHAR(50),
        enrollment_route VARCHAR(50),
        is_priority BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'Đã nộp',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        birth_cert_url TEXT,
        residence_proof_url TEXT,
        rejection_reason TEXT,
        class_id VARCHAR(50)
    );

    -- 2. Bảng Lớp học
    CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        max_size INTEGER DEFAULT 35
    );

    -- 3. Bảng Nội dung trang web (Thông báo, hướng dẫn)
    CREATE TABLE IF NOT EXISTS site_content (
        id INTEGER PRIMARY KEY DEFAULT 1,
        announcement_title TEXT,
        announcement_details JSONB,
        attachment_url TEXT,
        attachment_name TEXT,
        admitted_list_url TEXT,
        admitted_list_name TEXT,
        guidelines JSONB
    );

    -- 4. Bảng Cài đặt (Logo, Banner, Tên trường)
    CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        school_name TEXT,
        logo_url TEXT,
        banner_url TEXT
    );

    -- 5. Bảng Mã OTP (Cho chức năng đăng nhập)
    CREATE TABLE IF NOT EXISTS otp_codes (
        phone_number VARCHAR(20) PRIMARY KEY,
        otp_code VARCHAR(10),
        expires_at TIMESTAMP
    );

    -- Dữ liệu mẫu ban đầu cho Cài đặt (để trang web không bị lỗi khi load lần đầu)
    INSERT INTO site_settings (id, school_name) 
    VALUES (1, 'TRƯỜNG TIỂU HỌC NGUYỄN HUỆ')
    ON CONFLICT (id) DO NOTHING;

    -- Dữ liệu mẫu cho Nội dung
    INSERT INTO site_content (id, announcement_title, announcement_details, guidelines)
    VALUES (1, 'Thông báo Tuyển sinh', '[]', '[]')
    ON CONFLICT (id) DO NOTHING;
`;

const run = async () => {
    try {
        console.log("🔄 Đang kết nối đến Database trên Render...");
        await pool.query(schemaQuery);
        console.log("✅ Đã tạo thành công 5 bảng: applications, classes, site_content, site_settings, otp_codes");
        console.log("✅ Đã thêm dữ liệu mẫu ban đầu.");
    } catch (err) {
        console.error("❌ Lỗi khi tạo bảng:", err);
    } finally {
        await pool.end();
    }
};

run();
