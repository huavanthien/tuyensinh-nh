
require('dotenv').config(); // Nạp biến môi trường ngay dòng đầu tiên
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// --- Ensure Uploads Directory Exists ---
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('Created uploads directory.');
}

// --- Twilio Setup ---
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Kiểm tra xem cấu hình có đầy đủ không
const isTwilioConfigured = !!(twilioAccountSid && twilioAuthToken && twilioPhoneNumber);

console.log('---------------------------------------');
console.log('Kiểm tra cấu hình Twilio:');
console.log('- Account SID:', twilioAccountSid ? 'Đã nạp' : 'Thiếu');
console.log('- Auth Token:', twilioAuthToken ? 'Đã nạp' : 'Thiếu');
console.log('- Phone Number:', twilioPhoneNumber ? twilioPhoneNumber : 'Thiếu');
console.log('- Trạng thái:', isTwilioConfigured ? 'SẴN SÀNG' : 'CHƯA CẤU HÌNH (Sẽ chạy chế độ giả lập)');
console.log('---------------------------------------');

let twilioClient = null;
if (isTwilioConfigured) {
    try {
        twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);
    } catch (e) {
        console.error("Lỗi khởi tạo Twilio Client:", e);
        isTwilioConfigured = false;
    }
}

// --- In-memory OTP store ---
const otpStore = {}; 

// --- Middleware ---
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Database Helpers ---
const readDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        const initialData = { applications: [], classes: [], announcement: {}, guidelines: [], settings: {} };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
};
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- Multer Setup for File Uploads ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${Date.now()}-${uuidv4()}-${safeName}`);
    }
});
const upload = multer({ storage });


// --- Root Route for Health Check ---
app.get('/', (req, res) => {
    res.send(`
        <h1>Backend Server is Running on Render</h1>
        <p>Status: Online</p>
        <p>Twilio Configured: ${isTwilioConfigured ? '<span style="color:green">Yes</span>' : '<span style="color:red">No</span>'}</p>
    `);
});


// --- API Routes ---

// GET all data
app.get('/api/data', (req, res) => {
    try {
        const db = readDB();
        if (!db.settings) {
            db.settings = { schoolName: "TRƯỜNG TIỂU HỌC NGUYỄN HUỆ", logoUrl: null, bannerUrl: null };
            writeDB(db);
        }
        res.json(db);
    } catch (error) {
        console.error("Error reading data:", error);
        res.status(500).json({ message: "Error reading data", error: error.toString() });
    }
});

// POST a new application
app.post('/api/applications', upload.fields([{ name: 'birthCert', maxCount: 1 }, { name: 'residenceProof', maxCount: 1 }]), (req, res) => {
    try {
        const db = readDB();
        const applicationsCount = db.applications.length;
        const newApplication = {
            ...req.body,
            id: `NH25${String(applicationsCount + 1).padStart(3, '0')}`,
            isPriority: req.body.isPriority === 'on',
            status: 'Đã nộp',
            submittedAt: new Date(),
            birthCertUrl: req.files.birthCert ? `/uploads/${req.files.birthCert[0].filename}` : null,
            residenceProofUrl: req.files.residenceProof ? `/uploads/${req.files.residenceProof[0].filename}` : null,
        };
        db.applications.push(newApplication);
        writeDB(db);
        res.status(201).json(newApplication);
    } catch (error) {
        console.error("Error creating application:", error);
        res.status(500).json({ message: "Error creating application", error: error.toString() });
    }
});

// PUT (update) an application
app.put('/api/applications/:id', (req, res) => {
    try {
        const db = readDB();
        const appId = req.params.id;
        const appIndex = db.applications.findIndex(app => app.id === appId);
        if (appIndex === -1) {
            return res.status(404).json({ message: 'Application not found' });
        }
        db.applications[appIndex] = { ...db.applications[appIndex], ...req.body };
        writeDB(db);
        res.json(db.applications[appIndex]);
    } catch (error) {
        res.status(500).json({ message: "Error updating application", error: error.toString() });
    }
});

// PUT (bulk update) applications
app.put('/api/applications/bulk-update', (req, res) => {
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
            return res.status(400).json({ message: 'Invalid payload' });
        }
        const db = readDB();
        const updatedApps = [];
        updates.forEach(update => {
            const appIndex = db.applications.findIndex(app => app.id === update.id);
            if (appIndex !== -1) {
                db.applications[appIndex] = { ...db.applications[appIndex], ...update };
                updatedApps.push(db.applications[appIndex]);
            }
        });
        writeDB(db);
        res.json(updatedApps);
    } catch (error) {
        res.status(500).json({ message: "Error bulk updating applications", error: error.toString() });
    }
});

// POST confirm payment
app.post('/api/applications/:id/confirm-payment', (req, res) => {
    try {
        const db = readDB();
        const appId = req.params.id;
        const appIndex = db.applications.findIndex(app => app.id === appId);
        if (appIndex === -1) {
            return res.status(404).json({ message: 'Application not found' });
        }
        db.applications[appIndex].status = 'Đã nộp lệ phí';
        writeDB(db);
        res.json(db.applications[appIndex]);
    } catch (error) {
        res.status(500).json({ message: "Error confirming payment", error: error.toString() });
    }
});


// --- Class Management ---
app.post('/api/classes', (req, res) => {
    try {
        const db = readDB();
        const newClass = { ...req.body, id: `CLASS_${Date.now()}` };
        db.classes.push(newClass);
        writeDB(db);
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: 'Error creating class', error: error.toString() });
    }
});

app.put('/api/classes/:id', (req, res) => {
    try {
        const db = readDB();
        const classIndex = db.classes.findIndex(c => c.id === req.params.id);
        if (classIndex === -1) return res.status(404).json({ message: 'Class not found' });
        db.classes[classIndex] = { ...db.classes[classIndex], ...req.body };
        writeDB(db);
        res.json(db.classes[classIndex]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating class', error: error.toString() });
    }
});

app.delete('/api/classes/:id', (req, res) => {
    try {
        const db = readDB();
        const studentCount = db.applications.filter(app => app.classId === req.params.id).length;
        if (studentCount > 0) {
            return res.status(400).json({ message: 'Cannot delete class with assigned students' });
        }
        db.classes = db.classes.filter(c => c.id !== req.params.id);
        writeDB(db);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting class', error: error.toString() });
    }
});


// --- Site Content Management ---
app.put('/api/site-content', upload.fields([{ name: 'attachment', maxCount: 1 }, { name: 'admittedList', maxCount: 1 }]), (req, res) => {
    try {
        const db = readDB();
        const announcementData = JSON.parse(req.body.announcementData);
        const guidelinesData = JSON.parse(req.body.guidelinesData);
        
        if (req.files && req.files['attachment']) {
            announcementData.attachmentUrl = `/uploads/${req.files['attachment'][0].filename}`;
            announcementData.attachmentName = req.files['attachment'][0].originalname;
        } else if (req.body.removeAttachment === 'true') {
            delete announcementData.attachmentUrl;
            delete announcementData.attachmentName;
        }

        if (req.files && req.files['admittedList']) {
            announcementData.admittedListUrl = `/uploads/${req.files['admittedList'][0].filename}`;
            announcementData.admittedListName = req.files['admittedList'][0].originalname;
        } else if (req.body.removeAdmittedList === 'true') {
            delete announcementData.admittedListUrl;
            delete announcementData.admittedListName;
        }

        db.announcement = announcementData;
        db.guidelines = guidelinesData;
        writeDB(db);
        res.json({ announcement: db.announcement, guidelines: db.guidelines });
    } catch (error) {
        res.status(500).json({ message: 'Error updating site content', error: error.toString() });
    }
});

// --- Settings Management ---
app.put('/api/settings', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
    try {
        const db = readDB();
        let currentSettings = db.settings || { schoolName: "TRƯỜNG TIỂU HỌC NGUYỄN HUỆ", logoUrl: null, bannerUrl: null };

        if (req.body.schoolName) {
            currentSettings.schoolName = req.body.schoolName;
        }

        const files = req.files || {};

        if (files['logo'] && files['logo'][0]) {
            currentSettings.logoUrl = `/uploads/${files['logo'][0].filename}`;
        } else if (req.body.removeLogo === 'true') {
            currentSettings.logoUrl = null;
        }

        if (files['banner'] && files['banner'][0]) {
            currentSettings.bannerUrl = `/uploads/${files['banner'][0].filename}`;
        } else if (req.body.removeBanner === 'true') {
            currentSettings.bannerUrl = null;
        }

        db.settings = currentSettings;
        writeDB(db);
        res.json(db.settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
});

// --- Real OTP Auth ---
app.post('/api/auth/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    otpStore[phoneNumber] = { otp, expires };
    
    if (!isTwilioConfigured) {
        console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
        return res.json({ message: 'OTP sent successfully (dev mode - check console).' });
    }

    try {
        // Định dạng lại số điện thoại cho Twilio (+84...)
        let toPhoneNumber = phoneNumber;
        if (toPhoneNumber.startsWith('0')) {
            toPhoneNumber = '+84' + toPhoneNumber.substring(1);
        }

        await twilioClient.messages.create({
            body: `Mã xác thực tuyển sinh: ${otp}. Mã có hiệu lực trong 5 phút.`,
            from: twilioPhoneNumber,
            to: toPhoneNumber
        });
        res.json({ message: 'Mã OTP đã được gửi tin nhắn đến số điện thoại của bạn.' });
    } catch (error) {
        console.error('Twilio API Error:', error);
        
        // Fallback về chế độ giả lập nếu Twilio lỗi (để không chặn người dùng lúc demo)
        if (error.code === 21608 || error.status === 400) {
             console.log(`[FALLBACK DEV MODE] OTP for ${phoneNumber}: ${otp}`);
             return res.json({ 
                 message: 'Tài khoản Twilio dùng thử chỉ gửi được cho số đã xác minh. (Xem mã OTP trong Console Server)',
                 devOtp: otp 
            });
        }

        res.status(500).json({ message: 'Lỗi hệ thống gửi tin nhắn. Vui lòng thử lại sau.' });
    }
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { phoneNumber, otp } = req.body;
    const storedOtpData = otpStore[phoneNumber];

    if (!storedOtpData) {
        return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    if (Date.now() > storedOtpData.expires) {
        delete otpStore[phoneNumber];
        return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    if (storedOtpData.otp === otp) {
        delete otpStore[phoneNumber];
        res.json({ message: 'Login successful.' });
    } else {
        res.status(400).json({ message: 'Mã OTP không chính xác. Vui lòng thử lại.' });
    }
});


// --- QR Code Generation ---
app.get('/api/qr-code/:applicationId', (req, res) => {
    try {
        const db = readDB();
        const application = db.applications.find(app => app.id === req.params.applicationId);
        if (!application) return res.status(404).json({ message: 'Application not found' });
        
        const removeAccents = (str) => {
            if (!str) return '';
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
        };

        const transferInfo = {
            bin: '970405', // AgriBank
            accountNo: '5304205050813',
            accountName: 'HUA VAN THIEN',
            amount: 200000,
            description: `${application.id} ${removeAccents(application.studentName)}`
        };
        const qrUrl = `https://img.vietqr.io/image/${transferInfo.bin}-${transferInfo.accountNo}-compact.png?amount=${transferInfo.amount}&addInfo=${encodeURIComponent(transferInfo.description)}&accountName=${encodeURIComponent(transferInfo.accountName)}`;

        fetch(qrUrl)
            .then(qrRes => {
                 if (!qrRes.ok) throw new Error(`VietQR API responded with status: ${qrRes.status}`);
                 return qrRes.arrayBuffer();
            })
            .then(buffer => {
                const base64 = Buffer.from(buffer).toString('base64');
                res.json({ qrDataURL: `data:image/png;base64,${base64}` });
            })
            .catch(error => {
                console.error("Failed to fetch QR code from VietQR:", error);
                res.status(500).json({ message: 'Failed to generate QR code image' });
            });

    } catch(error) {
        res.status(500).json({ message: 'Server error', error: error.toString() });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
