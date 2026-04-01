import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

const DEST = 'uploads/pest-images/';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, DEST);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG/JPEG/PNG images are allowed.'));
  }
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });

/** Single pest image upload middleware. */
export const pestImageUpload = upload.single('image');
