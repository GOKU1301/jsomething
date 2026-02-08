
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use Service Role Key for backend operations to bypass RLS policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'jay_files';

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} Storage path
 */
const uploadFile = async (fileBuffer, fileName, mimeType) => {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `documents/${timestamp}-${sanitizedFileName}`;

    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileBuffer, {
            contentType: mimeType,
            upsert: false
        });

    if (error) {
        throw error;
    }

    return data.path;
};

/**
 * Generate signed URL for file download
 * @param {string} filePath - Storage path
 * @param {number} expiresIn - URL expiration in seconds (default: 3600)
 * @returns {Promise<string>} Signed URL
 */
const getSignedUrl = async (filePath, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

    if (error) {
        throw error;
    }

    return data.signedUrl;
};

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - Storage path
 */
const deleteFile = async (filePath) => {
    const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

    if (error) {
        throw error;
    }
};

module.exports = {
    uploadFile,
    getSignedUrl,
    deleteFile
};
