const path = require('path');
const { handleResumeUpload, UPLOAD_DIR } = require('../../src/middleware/uploadMiddleware');

describe('Backend Unit Tests — Upload & File Security Helpers', () => {
  describe('Upload Directory and Path Safety', () => {
    it('should define a valid resolved upload directory', () => {
      expect(UPLOAD_DIR).toBeDefined();
      expect(typeof UPLOAD_DIR).toBe('string');
      expect(UPLOAD_DIR).toContain('uploads');
    });

    it('should safely extract only extension ignoring path traversal attempts in originalname', () => {
      const maliciousNames = [
        '../../../../etc/passwd.pdf',
        '..\\..\\windows\\system32\\cmd.exe.docx',
        '../../../secret.txt',
      ];

      maliciousNames.forEach((maliciousName) => {
        const ext = path.extname(maliciousName).toLowerCase();
        // Path traversal characters should never be present in the extension
        expect(ext.includes('/')).toBe(false);
        expect(ext.includes('\\')).toBe(false);
        expect(ext.includes('..')).toBe(false);
      });
    });
  });

  describe('handleResumeUpload Error Handling Middleware', () => {

    it('should return 400 if no file was uploaded under "resume" field', (done) => {
      // Mock multer's upload.single('resume') returning without error but no req.file
      const express = require('express');
      const request = require('supertest');

      const app = express();
      app.post('/test-upload', handleResumeUpload, (req, res) => {
        res.status(200).json({ success: true });
      });

      request(app)
        .post('/test-upload')
        .send({})
        .expect(400)
        .then((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toContain('No resume file provided');
          done();
        })
        .catch(done);
    });

    it('should reject unsupported file types like .txt or .png with 400', (done) => {
      const express = require('express');
      const request = require('supertest');

      const app = express();
      app.post('/test-upload', handleResumeUpload, (req, res) => {
        res.status(200).json({ success: true });
      });

      request(app)
        .post('/test-upload')
        .attach('resume', Buffer.from('Plain text content'), 'document.txt')
        .expect(400)
        .then((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toContain('Only PDF (.pdf) and DOCX (.docx) documents are permitted');
          done();
        })
        .catch(done);
    });

    it('should reject executable files like .exe or .sh with 400', (done) => {
      const express = require('express');
      const request = require('supertest');

      const app = express();
      app.post('/test-upload', handleResumeUpload, (req, res) => {
        res.status(200).json({ success: true });
      });

      request(app)
        .post('/test-upload')
        .attach('resume', Buffer.from('MZ...executable binary'), 'payload.exe')
        .expect(400)
        .then((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toContain('Only PDF (.pdf) and DOCX (.docx) documents are permitted');
          done();
        })
        .catch(done);
    });

    it('should accept valid PDF upload and pass to next handler', (done) => {
      const express = require('express');
      const request = require('supertest');
      const fs = require('fs');

      const app = express();
      app.post('/test-upload', handleResumeUpload, (req, res) => {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(200).json({ success: true, file: req.file.filename });
      });

      request(app)
        .post('/test-upload')
        .attach('resume', Buffer.from('%PDF-1.4 test resume content'), {
          filename: 'student_resume.pdf',
          contentType: 'application/pdf',
        })
        .expect(200)
        .then((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.file).toBeDefined();
          expect(res.body.file.endsWith('.pdf')).toBe(true);
          done();
        })
        .catch(done);
    });

    it('should accept valid DOCX upload and pass to next handler', (done) => {
      const express = require('express');
      const request = require('supertest');
      const fs = require('fs');

      const app = express();
      app.post('/test-upload', handleResumeUpload, (req, res) => {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(200).json({ success: true, file: req.file.filename });
      });

      request(app)
        .post('/test-upload')
        .attach(
          'resume',
          Buffer.from('PK...docx test content'),
          {
            filename: 'student_resume.docx',
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          }
        )
        .expect(200)
        .then((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.file).toBeDefined();
          expect(res.body.file.endsWith('.docx')).toBe(true);
          done();
        })
        .catch(done);
    });

    it('should reject file exceeding 5MB limit with 400', (done) => {
      const express = require('express');
      const request = require('supertest');

      const app = express();
      app.post('/test-upload', handleResumeUpload, (req, res) => {
        res.status(200).json({ success: true });
      });

      // Create buffer slightly larger than 5MB (5.2 MB)
      const oversizedBuffer = Buffer.alloc(5.2 * 1024 * 1024, 0);

      request(app)
        .post('/test-upload')
        .attach('resume', oversizedBuffer, {
          filename: 'oversized_resume.pdf',
          contentType: 'application/pdf',
        })
        .expect(400)
        .then((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toContain('Maximum permitted file size is 5 MB');
          done();
        })
        .catch(done);
    });
  });
});
