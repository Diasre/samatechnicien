-- Add verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Optional: Update existing users to be verified so they don't get locked out
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
