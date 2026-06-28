import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { authenticateExpress, AuthenticatedRequest } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { ValidationError, AppError } from '../errors/AppError.js';
import { logger } from '../logs/logger.js';

const router = Router();

// Store temporarily in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return cb(new ValidationError('Invalid file type. Allowed: JPG, PNG, PDF, DOCX'));
    }
    cb(null, true);
  }
});

router.post(
  '/upload',
  uploadLimiter,
  authenticateExpress as any, // Authenticated upload
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const dirPath = path.resolve('storage', 'uploads');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const destPath = path.join(dirPath, uniqueName);

      // If image, compress and resize using Sharp
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        await sharp(req.file.buffer)
          .resize(800) // Max width 800px
          .jpeg({ quality: 80 })
          .toFile(destPath);
        logger.info(`Compressed and saved image to ${destPath}`);
      } else {
        // Document (PDF/DOCX) - write buffer directly
        fs.writeFileSync(destPath, req.file.buffer);
        logger.info(`Saved document to ${destPath}`);
      }

      const fileUrl = `/static/uploads/${uniqueName}`;

      res.status(200).json({
        success: true,
        message: 'File uploaded and processed successfully',
        data: {
          filename: uniqueName,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
