const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Target directory for local development uploads
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/resumes');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

// Multer disk storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?._id ? req.user._id.toString() : 'guest';
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(6).toString('hex');
    // Format: <userId>-<timestamp>-<randomHex><ext>
    cb(null, `${userId}-${timestamp}-${randomHex}${ext}`);
  },
});

// File filter checking both MIME type and file extension
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF (.pdf) and DOCX (.docx) documents are permitted.'), false);
  }
};

// Multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum file size
    files: 1,
  },
  fileFilter,
});

/**
 * Express middleware wrapper to catch Multer errors and return formatted 400 JSON.
 */
const handleResumeUpload = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum permitted file size is 5 MB.',
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload validation failed.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file provided. Please attach a file under the "resume" field.',
      });
    }

    next();
  });
};

module.exports = {
  handleResumeUpload,
  UPLOAD_DIR,
};
