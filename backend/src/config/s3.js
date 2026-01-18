const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const S3_BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} S3 key
 */
const uploadFile = async (fileBuffer, fileName, mimeType) => {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `documents/${timestamp}-${sanitizedFileName}`;

    const params = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256'
    };

    await s3.upload(params).promise();
    return s3Key;
};

/**
 * Generate signed URL for file download
 * @param {string} s3Key - S3 object key
 * @param {number} expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns {string} Signed URL
 */
const getSignedUrl = (s3Key, expiresIn = 3600) => {
    const params = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Expires: expiresIn
    };

    return s3.getSignedUrl('getObject', params);
};

/**
 * Delete file from S3
 * @param {string} s3Key - S3 object key
 */
const deleteFile = async (s3Key) => {
    const params = {
        Bucket: S3_BUCKET,
        Key: s3Key
    };

    await s3.deleteObject(params).promise();
};

module.exports = {
    uploadFile,
    getSignedUrl,
    deleteFile,
    s3,
    S3_BUCKET
};
