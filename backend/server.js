
require('./config/cloudinary');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
// --- Cloudinary ---
console.log(`Cloudinary Configured: ${!!process.env.CLOUDINARY_CLOUD_NAME}`);
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT} with PostgreSQL`);
});

// --- Ensure Uploads Directory Exists ---
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('Created uploads directory.');
}

// --- PostgreSQL Setup ---
if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL environment variable is not set. Database features will fail.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test DB Connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
    } else {
        console.log('Successfully connected to PostgreSQL Database on Render/Local');
        release();
    }
});

// --- Twilio Setup ---
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const isTwilioConfigured = !!(twilioAccountSid && twilioAuthToken && twilioPhoneNumber);

if (isTwilioConfigured) {
    console.log("Twilio is configured. OTPs will be sent via SMS.");
} else {
    console.log("Twilio NOT configured. OTPs will be shown in Console logs.");
}

let twilioClient = null;
if (isTwilioConfigured) {
    try {
        twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);
    } catch (e) {
        console.error("Lỗi khởi tạo Twilio Client:", e);
    }
}

// --- Middleware ---
app.use(cors()); // Allow all origins for simplicity in this setup
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Multer Setup ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${Date.now()}-${uuidv4()}-${safeName}`);
    }
});
const upload = multer({ storage });

// --- Helper: Map DB Row to Frontend Object ---
const mapAppFromDB = (row) => ({
    id: row.id,
    studentName: row.student_name,
    studentDob: row.student_dob, // Date object
    studentGender: row.student_gender,
    studentPID: row.student_pid || '',
    ethnicity: row.ethnicity || '',
    placeOfBirth: row.place_of_birth || '',
    hometown: row.hometown || '',
    parentName: row.parent_name,
    parentPhone: row.parent_phone,
    address: row.address,
    enrollmentType: row.enrollment_type,
    enrollmentRoute: row.enrollment_route,
    isPriority: row.is_priority,
    status: row.status,
    submittedAt: row.submitted_at,
    birthCertUrl: row.birth_cert_url,
    residenceProofUrl: row.residence_proof_url,
    rejectionReason: row.rejection_reason,
    classId: row.class_id
});

// --- Routes ---

app.get('/', (req, res) => {
    res.send(`
        <h1>Backend Server is Running on Render</h1>
        <p>Status: Online</p>
        <p>Twilio Configured: ${isTwilioConfigured ? 'Yes' : 'No'}</p>
        <p>Node Version: ${process.version}</p>
    `);
});

// GET ALL DATA (Aggregated)
app.get('/api/data', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const [appsRes, classesRes, contentRes, settingsRes] = await Promise.all([
                client.query('SELECT * FROM applications ORDER BY submitted_at DESC'),
                client.query('SELECT * FROM classes ORDER BY name ASC'),
                client.query('SELECT * FROM site_content WHERE id = 1'),
                client.query('SELECT * FROM site_settings WHERE id = 1')
            ]);

            const content = contentRes.rows[0] || {};
            const settings = settingsRes.rows[0] || {};

            res.json({
                applications: appsRes.rows.map(mapAppFromDB),
                classes: classesRes.rows.map(c => ({ id: c.id, name: c.name, maxSize: c.max_size })),
                announcement: {
                    title: content.announcement_title || "Thông báo",
                    details: content.announcement_details || [],
                    attachmentUrl: content.attachment_url,
                    attachmentName: content.attachment_name,
                    admittedListUrl: content.admitted_list_url,
                    admittedListName: content.admitted_list_name
                },
                guidelines: content.guidelines || [],
                settings: {
                    schoolName: settings.school_name || "TRƯỜNG TIỂU HỌC NGUYỄN HUỆ",
                    logoUrl: settings.logo_url,
                    bannerUrl: settings.banner_url
                }
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ message: "Lỗi kết nối cơ sở dữ liệu" });
    }
});

// POST Application
app.post('/api/applications', upload.fields([{ name: 'birthCert', maxCount: 1 }, { name: 'residenceProof', maxCount: 1 }]), async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            // Generate ID: NH25xxx
            const countRes = await client.query('SELECT COUNT(*) FROM applications');
            const count = parseInt(countRes.rows[0].count, 10);
            const newId = `NH25${String(count + 1).padStart(3, '0')}`;
            
            const { 
                studentName, studentDob, studentGender, studentPID, ethnicity, placeOfBirth, hometown,
                parentName, parentPhone, address, enrollmentType, enrollmentRoute, isPriority 
            } = req.body;

            const birthCertUrl = req.files.birthCert ? `/uploads/${req.files.birthCert[0].filename}` : null;
            const residenceProofUrl = req.files.residenceProof ? `/uploads/${req.files.residenceProof[0].filename}` : null;

            const query = `
                INSERT INTO applications (
                    id, student_name, student_dob, student_gender, student_pid, ethnicity, place_of_birth, hometown,
                    parent_name, parent_phone, address, enrollment_type, enrollment_route, is_priority,
                    status, submitted_at, birth_cert_url, residence_proof_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Đã nộp', NOW(), $15, $16)
                RETURNING *
            `;
            
            const values = [
                newId, studentName, studentDob, studentGender, studentPID, ethnicity, placeOfBirth, hometown,
                parentName, parentPhone, address, enrollmentType, enrollmentRoute, isPriority === 'on',
                birthCertUrl, residenceProofUrl
            ];

            const result = await client.query(query, values);
            res.status(201).json(mapAppFromDB(result.rows[0]));
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lưu hồ sơ" });
    }
});
// PUT Bulk Update (Class Assignment)
app.put('/api/applications/bulk-update', async (req, res) => {
    const { updates } = req.body; // Array of { id, classId, status }
    if (!Array.isArray(updates)) return res.status(400).json({ message: "Dữ liệu không hợp lệ" });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];
        for (const update of updates) {
            const res = await client.query(
                'UPDATE applications SET class_id = $1, status = $2 WHERE id = $3 RETURNING *',
                [update.classId, update.status, update.id]
            );
            if (res.rows[0]) results.push(mapAppFromDB(res.rows[0]));
        }
        await client.query('COMMIT');
        res.json(results);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi phân lớp hàng loạt" });
    } finally {
        client.release();
    }
});

// PUT Application
app.put('/api/applications/:id', async (req, res) => {
    try {
        const { status, rejectionReason, classId } = req.body;
        const client = await pool.connect();
        try {
            const query = `
                UPDATE applications 
                SET status = COALESCE($1, status),
                    rejection_reason = COALESCE($2, rejection_reason),
                    class_id = COALESCE($3, class_id)
                WHERE id = $4
                RETURNING *
            `;
            const result = await client.query(query, [status, rejectionReason, classId, req.params.id]);
            
            if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy hồ sơ" });
            res.json(mapAppFromDB(result.rows[0]));
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật hồ sơ" });
    }
});



// CONFIRM PAYMENT
app.post('/api/applications/:id/confirm-payment', async (req, res) => {
    try {
        const client = await pool.connect();
        const resDb = await client.query(
            "UPDATE applications SET status = 'Đã nộp lệ phí' WHERE id = $1 RETURNING *",
            [req.params.id]
        );
        client.release();
        if (resDb.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy hồ sơ" });
        res.json(mapAppFromDB(resDb.rows[0]));
    } catch (error) {
        res.status(500).json({ message: "Lỗi xác nhận thanh toán" });
    }
});

// --- Class Routes ---
app.post('/api/classes', async (req, res) => {
    try {
        const { name, maxSize } = req.body;
        const id = `CLASS_${Date.now()}`;
        const client = await pool.connect();
        const result = await client.query(
            'INSERT INTO classes (id, name, max_size) VALUES ($1, $2, $3) RETURNING *',
            [id, name, maxSize]
        );
        client.release();
        const row = result.rows[0];
        res.status(201).json({ id: row.id, name: row.name, maxSize: row.max_size });
    } catch (error) {
        res.status(500).json({ message: "Lỗi tạo lớp" });
    }
});

app.put('/api/classes/:id', async (req, res) => {
    try {
        const { name, maxSize } = req.body;
        const client = await pool.connect();
        const result = await client.query(
            'UPDATE classes SET name = $1, max_size = $2 WHERE id = $3 RETURNING *',
            [name, maxSize, req.params.id]
        );
        client.release();
        const row = result.rows[0];
        res.json({ id: row.id, name: row.name, maxSize: row.max_size });
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật lớp" });
    }
});

app.delete('/api/classes/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        // Check if students exist
        const check = await client.query('SELECT 1 FROM applications WHERE class_id = $1', [req.params.id]);
        if (check.rowCount > 0) {
            client.release();
            return res.status(400).json({ message: "Không thể xóa lớp đang có học sinh" });
        }
        await client.query('DELETE FROM classes WHERE id = $1', [req.params.id]);
        client.release();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Lỗi xóa lớp" });
    }
});

// --- Site Content ---
app.put('/api/site-content', upload.fields([{ name: 'attachment', maxCount: 1 }, { name: 'admittedList', maxCount: 1 }]), async (req, res) => {
    try {
        const announcement = JSON.parse(req.body.announcementData);
        const guidelines = JSON.parse(req.body.guidelinesData);
        
        // Build update query components
        let attachmentUrl = undefined;
        let attachmentName = undefined;
        let admittedListUrl = undefined;
        let admittedListName = undefined;

        const client = await pool.connect();
        // Fetch current to keep existing if not changing
        const currentRes = await client.query('SELECT * FROM site_content WHERE id = 1');
        const current = currentRes.rows[0] || {};

        if (req.files && req.files['attachment']) {
            attachmentUrl = `/uploads/${req.files['attachment'][0].filename}`;
            attachmentName = req.files['attachment'][0].originalname;
        } else if (req.body.removeAttachment === 'true') {
            attachmentUrl = null;
            attachmentName = null;
        } else {
            attachmentUrl = current.attachment_url;
            attachmentName = current.attachment_name;
        }

        if (req.files && req.files['admittedList']) {
            admittedListUrl = `/uploads/${req.files['admittedList'][0].filename}`;
            admittedListName = req.files['admittedList'][0].originalname;
        } else if (req.body.removeAdmittedList === 'true') {
            admittedListUrl = null;
            admittedListName = null;
        } else {
            admittedListUrl = current.admitted_list_url;
            admittedListName = current.admitted_list_name;
        }

        // Upsert
        const query = `
            INSERT INTO site_content (id, announcement_title, announcement_details, attachment_url, attachment_name, admitted_list_url, admitted_list_name, guidelines)
            VALUES (1, $1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
                announcement_title = EXCLUDED.announcement_title,
                announcement_details = EXCLUDED.announcement_details,
                attachment_url = EXCLUDED.attachment_url,
                attachment_name = EXCLUDED.attachment_name,
                admitted_list_url = EXCLUDED.admitted_list_url,
                admitted_list_name = EXCLUDED.admitted_list_name,
                guidelines = EXCLUDED.guidelines
            RETURNING *
        `;
        
        await client.query(query, [
            announcement.title, 
            JSON.stringify(announcement.details),
            attachmentUrl, attachmentName, admittedListUrl, admittedListName,
            JSON.stringify(guidelines)
        ]);
        
        client.release();
        res.json({ message: "Success" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi cập nhật nội dung" });
    }
});

// --- Settings ---
app.put('/api/settings', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
    try {
        const client = await pool.connect();
        const currentRes = await client.query('SELECT * FROM site_settings WHERE id = 1');
        const current = currentRes.rows[0] || { school_name: "TRƯỜNG TIỂU HỌC NGUYỄN HUỆ" };

        let schoolName = req.body.schoolName || current.school_name;
        let logoUrl = current.logo_url;
        let bannerUrl = current.banner_url;

        const reqFiles = req.files || {}; // Safety check

        if (reqFiles['logo']) logoUrl = `/uploads/${reqFiles['logo'][0].filename}`;
        else if (req.body.removeLogo === 'true') logoUrl = null;

        if (reqFiles['banner']) bannerUrl = `/uploads/${reqFiles['banner'][0].filename}`;
        else if (req.body.removeBanner === 'true') bannerUrl = null;

        const query = `
            INSERT INTO site_settings (id, school_name, logo_url, banner_url)
            VALUES (1, $1, $2, $3)
            ON CONFLICT (id) DO UPDATE SET
                school_name = EXCLUDED.school_name,
                logo_url = EXCLUDED.logo_url,
                banner_url = EXCLUDED.banner_url
            RETURNING *
        `;
        
        const result = await client.query(query, [schoolName, logoUrl, bannerUrl]);
        client.release();
        
        const row = result.rows[0];
        res.json({ schoolName: row.school_name, logoUrl: row.logo_url, bannerUrl: row.banner_url });

    } catch (error) {
        console.error("Settings Update Error:", error);
        res.status(500).json({ message: "Lỗi cập nhật cài đặt" });
    }
});

// --- OTP Routes with DB ---
app.post('/api/auth/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

    try {
        const client = await pool.connect();
        await client.query(
            `INSERT INTO otp_codes (phone_number, otp_code, expires_at) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (phone_number) DO UPDATE SET otp_code = $2, expires_at = $3`,
            [phoneNumber, otp, expiresAt]
        );
        client.release();

        // Send via Twilio or Fallback
        if (!isTwilioConfigured) {
            console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
            return res.json({ message: 'Dev Mode', devOtp: otp });
        }

        let toPhoneNumber = phoneNumber.startsWith('0') ? '+84' + phoneNumber.substring(1) : phoneNumber;
        await twilioClient.messages.create({
            body: `Mã xác thực: ${otp}`,
            from: twilioPhoneNumber,
            to: toPhoneNumber
        });
        res.json({ message: 'OTP Sent' });

    } catch (error) {
        console.error("Twilio Error:", error);
        // If Twilio fails (e.g., unverified number), fall back to dev mode for testing
        if (error.code === 21608 || error.status === 400) {
            console.log(`[FALLBACK] Twilio failed. OTP for ${phoneNumber}: ${otp}`);
            return res.json({ message: 'Twilio Error Fallback', devOtp: otp });
        }
        res.status(500).json({ message: "Lỗi gửi OTP" });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    const { phoneNumber, otp } = req.body;
    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM otp_codes WHERE phone_number = $1', 
            [phoneNumber]
        );
        
        if (result.rows.length === 0) {
            client.release();
            return res.status(400).json({ message: "Mã OTP không hợp lệ" });
        }

        const record = result.rows[0];
        if (new Date() > new Date(record.expires_at)) {
            client.release();
            return res.status(400).json({ message: "Mã OTP đã hết hạn" });
        }

        if (record.otp_code === otp) {
            await client.query('DELETE FROM otp_codes WHERE phone_number = $1', [phoneNumber]);
            client.release();
            res.json({ message: "Login successful" });
        } else {
            client.release();
            res.status(400).json({ message: "Sai mã OTP" });
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi xác thực" });
    }
});

// --- QR Code (Keep as is) ---
app.get('/api/qr-code/:applicationId', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT student_name FROM applications WHERE id = $1', [req.params.applicationId]);
        client.release();
        
        if (result.rows.length === 0) return res.status(404).json({ message: 'Application not found' });
        
        const app = result.rows[0];
        const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

        const transferInfo = {
            bin: '970405', 
            accountNo: '5304205050813',
            accountName: 'HUA VAN THIEN',
            amount: 200000,
            description: `${req.params.applicationId} ${removeAccents(app.student_name)}`
        };
        
        const qrUrl = `https://img.vietqr.io/image/${transferInfo.bin}-${transferInfo.accountNo}-compact.png?amount=${transferInfo.amount}&addInfo=${encodeURIComponent(transferInfo.description)}&accountName=${encodeURIComponent(transferInfo.accountName)}`;
        
        const qrRes = await fetch(qrUrl);
        const buffer = await qrRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        res.json({ qrDataURL: `data:image/png;base64,${base64}` });

    } catch(error) {
        console.error("QR Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT} with PostgreSQL`);
});
