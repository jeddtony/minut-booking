import multer from 'multer';

const imageFileFilter = (_req: Express.Request, file: Express.Multer.File, callback: multer.FileFilterCallback): void => {
  if (!file.mimetype.startsWith('image/')) {
    callback(new Error('Only image files are allowed'));
    return;
  }
  callback(null, true);
};

export const UploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFileFilter,
});
