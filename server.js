const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware to parse form body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve the static website files
app.use(express.static(path.join(__dirname)));

// Configure storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'assets', 'images');
        // Ensure folder exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `upload_${uniqueSuffix}${ext}`);
    }
});

// Configure upload limits & file filters
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/i;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimeType && extName) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed!'));
    }
});

// GET /upload route - Serves the upload page
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});

// POST /upload route - Handles image upload and data updating
app.post('/upload', upload.single('image'), (req, res) => {
    const password = req.body.password;
    
    // 1. Password Verification
    if (password !== 'torer') {
        // Delete uploaded file if password was wrong
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(403).send(`
            <div style="background:#0a0a0c; color:#fff; font-family:sans-serif; text-align:center; padding:50px; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <h1 style="color:#d4af37;">Access Denied</h1>
                <p>Incorrect password. You are not authorized to upload files.</p>
                <a href="/upload" style="color:#d4af37; text-decoration:none; margin-top:20px; border:1px solid #d4af37; padding:10px 20px; border-radius:4px;">Try Again</a>
            </div>
        `);
    }

    if (!req.file) {
        return res.status(400).send('Please select an image file to upload.');
    }

    try {
        // 2. Load current gallery data from gallery_data.js
        const galleryDataPath = path.join(__dirname, 'gallery_data.js');
        let galleryData = [];
        
        if (fs.existsSync(galleryDataPath)) {
            const fileContent = fs.readFileSync(galleryDataPath, 'utf8');
            const tempWindow = {};
            const runCode = new Function('window', fileContent);
            runCode(tempWindow);
            galleryData = tempWindow.GALLERY_DATA || [];
        }

        // 3. Generate new image record
        const maxId = galleryData.reduce((max, img) => (img.id > max ? img.id : max), 0);
        const newId = maxId + 1;
        const relativeSrc = `assets/images/${req.file.filename}`;
        
        const newImageRecord = {
            id: newId,
            title: req.body.title || `Özge Törer Collection #${newId}`,
            category: req.body.category || 'photoshoots',
            src: relativeSrc,
            desc: req.body.description || 'Exclusive fan photo upload.'
        };

        // 4. Add record to list and write back to gallery_data.js
        galleryData.push(newImageRecord);
        const updatedContent = `window.GALLERY_DATA = ${JSON.stringify(galleryData, null, 4)};\n`;
        fs.writeFileSync(galleryDataPath, updatedContent, 'utf8');

        // 5. Respond with Success
        res.send(`
            <div style="background:#0a0a0c; color:#fff; font-family:sans-serif; text-align:center; padding:50px; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <h1 style="color:#d4af37; margin-bottom:10px;">Upload Successful!</h1>
                <p>The image was added to the gallery. Redirecting in 3 seconds...</p>
                <div style="margin-top:20px; font-size: 1.2rem;">
                    <a href="/" style="color:#d4af37; text-decoration:none; border:1px solid #d4af37; padding:10px 20px; border-radius:4px; margin-right:10px;">Go to Site</a>
                    <a href="/upload" style="color:#aaa; text-decoration:none; border:1px solid #444; padding:10px 20px; border-radius:4px;">Upload Another</a>
                </div>
                <script>
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                </script>
            </div>
        `);
    } catch (err) {
        console.error(err);
        // Cleanup file on error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).send('Error saving database records. Please check folder permissions.');
    }
});

// Start listening
app.listen(PORT, () => {
    console.log(`Server started successfully at http://localhost:${PORT}`);
    console.log(`Upload page available at http://localhost:${PORT}/upload`);
});
