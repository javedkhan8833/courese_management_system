-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bank_name VARCHAR(100) NOT NULL,
    bank_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(100) NOT NULL,
    branch_name VARCHAR(100),
    account_type VARCHAR(50) DEFAULT 'savings',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add index for faster lookups
CREATE INDEX idx_bank_account_number ON bank_accounts(bank_number);

-- Insert default bank accounts if none exist
INSERT INTO bank_accounts (bank_name, bank_number, account_holder_name, branch_name, account_type, is_active)
SELECT * FROM (
    SELECT 'ABC Bank' as bank_name, '1234567890' as bank_number, 'Course Management System' as account_holder_name, 'Main Branch' as branch_name, 'current' as account_type, TRUE as is_active
    UNION ALL
    SELECT 'XYZ Bank' as bank_name, '0987654321' as bank_number, 'Course Management System' as account_holder_name, 'Downtown Branch' as branch_name, 'savings' as account_type, TRUE as is_active
) AS temp
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts LIMIT 1);

-- Check if the bank_accounts table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'course_management' 
AND table_name = 'bank_accounts';

-- If the table exists, show its structure
SHOW CREATE TABLE bank_accounts;

-- Check if there are any records in the table
SELECT COUNT(*) as total_accounts FROM bank_accounts;
