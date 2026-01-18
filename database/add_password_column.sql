-- Add password_hash column to users table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

-- Optional: Create an admin user (update the password hash with a real bcrypt hash)
-- You can generate a hash by running: node -e "console.log(require('bcrypt').hashSync('your-password', 10))"

-- Example (password: admin123):
-- INSERT INTO users (name, email, password_hash, role) 
-- VALUES ('Admin User', 'admin@college.edu', '$2b$10$example-hash-here', 'ADMIN');
