import multer from 'multer';

// Set up Multer storage to keep files in memory for Firebase upload
const storage = multer.memoryStorage();

/**
 * Multer Configuration for File Uploads.
 * 
 * This configuration sets up the `multer` middleware for handling file uploads, including storage options, file size limits, and file type filtering.
 * 
 * The configuration includes the following options:
 * 
 * - `storage`: Specifies where and how to store the uploaded files. (This is assumed to be defined elsewhere in the code, typically using `multer.diskStorage()` or `multer.memoryStorage()`.)
 * 
 * - `limits`: Defines the maximum allowed file size for uploads.
 *   - `fileSize`: Limits the file size to 10MB (10 * 1024 * 1024 bytes). If a file exceeds this size, an error is thrown.
 * 
 * - `fileFilter`: A function that controls which file types are allowed. 
 *   - The function checks the file's `mimetype` against a list of allowed types (`['application/zip', 'application/x-zip-compressed', 'image/jpeg', 'image/png']`). 
 *   - If the file type is not allowed, an error is passed to the callback (`cb`) with a message: `"Only zip and image files are allowed."`.
 *   - If the file type is allowed, the callback is called with `cb(null, true)` to accept the file.
 * 
 * This configuration ensures that only zip files and image files (JPEG and PNG) with a size less than or equal to 10MB can be uploaded.
 * 
 * The `upload` middleware is used in routes where file uploads are needed, and it will automatically handle the validation based on this configuration.
 */
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



/**
 * Middleware to Handle Multiple File Uploads for Specific Fields.
 * 
 * This middleware allows the uploading of multiple files for specific fields, with each field having a maximum file count limit.
 * 
 * - `sliderImages`, `previewImages`, `previewMobileImages`, `sourceFiles`: These fields can each handle up to 10 files.
 * - The `upload.fields()` method from `multer` is used to configure multiple fields where different file types (images and source files) can be uploaded.
 * - The middleware will automatically validate the files according to the `multer` configuration set for `upload` (e.g., file size limit and file type filtering).
 * 
 * The `uploadFiles` middleware is typically used in routes where multiple file uploads are expected, such as for template or product creation.
 */
export const uploadFiles = upload.fields([
  { name: 'sliderImages', maxCount: 10 },
  { name: 'previewImages', maxCount: 10 },
  { name: 'previewMobileImages', maxCount: 10 },
  { name: 'sourceFiles', maxCount: 10 },
]);



/**
 * Multer Configuration for Single Image Upload with Size and Type Restrictions.
 * 
 * This configuration handles the upload of a single image, with restrictions on file size and allowed file types.
 * 
 * - `fileSize`: Limits the file size to 2MB (2 * 1024 * 1024 bytes). If the uploaded image exceeds this size, an error will be thrown.
 * - `fileFilter`: Validates the file's MIME type to ensure it is one of the allowed types: JPG, JPEG, or PNG.
 *   - The `allowedImageTypes` array specifies the accepted image types.
 *   - If the file type does not match one of the allowed types, an error is passed to the callback (`cb`) with the message `"Only JPG, JPEG, and PNG images are allowed."`.
 * 
 * This middleware is used for single image uploads where the file size is limited to 2MB, and only certain image types are allowed.
 */
const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 2MB limit for single images
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, JPEG, and PNG images are allowed.'));
    }
    cb(null, true);
  },
});

/**
 * Middleware to Handle Single Image Upload for Profile Image.
*/
export const uploadSingleImageFile = uploadSingleImage.single('profileImg');




/**
 * Custom Error Handler for Multer Errors.
 * 
 * This middleware catches errors thrown by Multer during file upload and sends a formatted response back to the client.
 * It handles both Multer-specific errors and other errors that might occur during the file upload process.
 * 
 * - If the error is an instance of `multer.MulterError`, a status code of `400` (Bad Request) is returned with the error message.
 *   - This could be triggered by issues like file size exceeding the limit or file type not being allowed.
 * - If a general error is encountered (e.g., any error outside Multer's own validation), the error message is returned with a `400` status code as well.
 * - If no error occurs, the `next()` function is called to proceed with the request lifecycle.
 * 
 * This custom error handler ensures that the user receives clear and consistent error messages when file uploads fail.
 */
export const multerErrorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};
