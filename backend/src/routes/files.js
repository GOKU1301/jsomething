const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Upload file
router.post('/upload', fileController.upload.single('file'), fileController.uploadDocument);

// Get file metadata
router.get('/:id', fileController.getFileMetadata);

// Get download URL
router.get('/:id/download', fileController.getDownloadUrl);

module.exports = router;
