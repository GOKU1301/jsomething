const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('../config/database');
const { uploadFile, getSignedUrl, deleteFile } = require('../config/supabaseStorage');

// Configure multer for file upload (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only accept PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

/**
 * Upload a PDF file
 */
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id;
        const file = req.file;

        // Extract page count from PDF
        let pageCount;
        try {
            const pdfData = await pdfParse(file.buffer);
            pageCount = pdfData.numpages;
        } catch (error) {
            console.error('PDF parsing error:', error);
            return res.status(400).json({ error: 'Invalid PDF file' });
        }

        if (pageCount === 0) {
            return res.status(400).json({ error: 'PDF file has no pages' });
        }

        // Upload to S3
        const s3Key = await uploadFile(file.buffer, file.originalname, file.mimetype);

        // Save file metadata to database
        const result = await db.query(
            `INSERT INTO files (user_id, s3_key, original_filename, page_count) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, s3_key, original_filename, page_count, uploaded_at`,
            [userId, s3Key, file.originalname, pageCount]
        );

        const fileRecord = result.rows[0];

        res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                id: fileRecord.id,
                originalFilename: fileRecord.original_filename,
                pageCount: fileRecord.page_count,
                uploadedAt: fileRecord.uploaded_at
            }
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
};

/**
 * Get file metadata
 */
const getFileMetadata = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        // Query file - admins can access any file, students only their own
        const query = isAdmin
            ? 'SELECT * FROM files WHERE id = $1'
            : 'SELECT * FROM files WHERE id = $1 AND user_id = $2';

        const params = isAdmin ? [fileId] : [fileId, userId];
        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = result.rows[0];

        res.json({
            file: {
                id: file.id,
                originalFilename: file.original_filename,
                pageCount: file.page_count,
                uploadedAt: file.uploaded_at
            }
        });
    } catch (error) {
        console.error('Get file metadata error:', error);
        res.status(500).json({ error: 'Failed to fetch file metadata' });
    }
};

/**
 * Generate download URL for file
 */
const getDownloadUrl = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        // Query file - admins can access any file, students only their own
        const query = isAdmin
            ? 'SELECT s3_key, original_filename FROM files WHERE id = $1'
            : 'SELECT s3_key, original_filename FROM files WHERE id = $1 AND user_id = $2';

        const params = isAdmin ? [fileId] : [fileId, userId];
        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = result.rows[0];

        // Generate signed URL (valid for 1 hour)
        const downloadUrl = await getSignedUrl(file.s3_key, 3600);

        res.json({
            downloadUrl,
            filename: file.original_filename,
            expiresIn: 3600 // seconds
        });
    } catch (error) {
        console.error('Get download URL error:', error);
        res.status(500).json({ error: 'Failed to generate download URL' });
    }
};



module.exports = {
    upload,
    uploadDocument,
    getFileMetadata,
    getDownloadUrl,
    getDownloadUrl
};
