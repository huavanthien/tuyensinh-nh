const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'db.json');
const allowedOrigins = [
  'https://tuyentinh-vercel.app', // Domain chính xác của Frontend
  // Thêm các domain khác nếu cần, ví dụ: 'http://localhost:3000' khi dev
]

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Helpers ---
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- Multer Setup for File Uploads ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// --- API Routes ---

// GET all data
app.get('/api/data', (req, res) => {
    try {
        const db = readDB();
        res.json(db);
    } catch (error) {
        res.status(500).json({ message: "Error reading data", error });
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
            isPriority: req.body.isPriority === 'on', // Checkbox value is 'on'
            status: 'Đã nộp',
            submittedAt: new Date(),
            birthCertUrl: req.files.birthCert ? `/uploads/${req.files.birthCert[0].filename}` : null,
            residenceProofUrl: req.files.residenceProof ? `/uploads/${req.files.residenceProof[0].filename}` : null,
        };
        db.applications.push(newApplication);
        writeDB(db);
        res.status(201).json(newApplication);
    } catch (error) {
        res.status(500).json({ message: "Error creating application", error });
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
        res.status(500).json({ message: "Error updating application", error });
    }
});

// PUT (bulk update) applications
app.put('/api/applications/bulk-update', (req, res) => {
    try {
        const { updates } = req.body; // updates is an array of { id, classId, status }
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
        res.status(500).json({ message: "Error bulk updating applications", error });
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
        res.status(500).json({ message: 'Error creating class', error });
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
        res.status(500).json({ message: 'Error updating class', error });
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
        res.status(500).json({ message: 'Error deleting class', error });
    }
});


// --- Site Content Management ---
app.put('/api/site-content', upload.single('attachment'), (req, res) => {
    try {
        const db = readDB();
        const announcementData = JSON.parse(req.body.announcementData);
        const guidelinesData = JSON.parse(req.body.guidelinesData);
        
        if (req.file) { // New file uploaded
            announcementData.attachmentUrl = `/uploads/${req.file.filename}`;
            announcementData.attachmentName = req.file.originalname;
        } else if (req.body.removeAttachment === 'true') { // Flag to remove attachment
            delete announcementData.attachmentUrl;
            delete announcementData.attachmentName;
        }

        db.announcement = announcementData;
        db.guidelines = guidelinesData;
        writeDB(db);
        res.json({ announcement: db.announcement, guidelines: db.guidelines });
    } catch (error) {
        res.status(500).json({ message: 'Error updating site content', error: error.message });
    }
});

// --- Auth (Simulated OTP) ---
app.post('/api/auth/send-otp', (req, res) => {
    const { phoneNumber } = req.body;
    console.log(`Simulating OTP sent to ${phoneNumber}. The OTP is 123456.`);
    res.json({ message: 'OTP sent successfully (simulation).' });
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { otp } = req.body;
    if (otp === '123456') {
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
        
        const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
        
        const transferInfo = {
            bin: '970418',
            accountNo: '111222333444',
            accountName: 'TRUONG TIEU HOC NGUYEN HUE',
            amount: 200000,
            description: `${application.id} ${removeAccents(application.studentName)}`
        };
        const qrUrl = `https://img.vietqr.io/image/${transferInfo.bin}-${transferInfo.accountNo}-compact.png?amount=${transferInfo.amount}&addInfo=${encodeURIComponent(transferInfo.description)}&accountName=${encodeURIComponent(transferInfo.accountName)}`;

        // We can't directly send the image, but we can send the URL or proxy the request.
        // For simplicity, we send the URL and let the client fetch it.
        // A more robust solution would fetch the image server-side and send it as a data URL.
        // Let's do that for better reliability.
        fetch(qrUrl)
            .then(qrRes => qrRes.arrayBuffer())
            .then(buffer => {
                const base64 = Buffer.from(buffer).toString('base64');
                res.json({ qrDataURL: `data:image/png;base64,${base64}` });
            })
            .catch(error => {
                console.error("Failed to fetch QR code from VietQR:", error);
                res.status(500).json({ message: 'Failed to generate QR code image' });
            });

    } catch(error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
