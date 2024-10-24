import multer from 'multer';

// Set up Multer storage to keep files in memory for Firebase upload
const storage = multer.memoryStorage();

// Multer configuration with file type filter
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/zip', 'application/x-zip-compressed', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only zip and image files are allowed.'));
    }
    cb(null, true);
  },
});

// Middleware to handle multiple file uploads for specific fields
export const uploadFiles = upload.fields([
  { name: 'sliderImages', maxCount: 10 },
  { name: 'previewImages', maxCount: 10 },
  { name: 'previewMobileImages', maxCount: 10 },
  { name: 'sourceFiles', maxCount: 10 },
]);

// Custom error handler for Multer
export const multerErrorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};
