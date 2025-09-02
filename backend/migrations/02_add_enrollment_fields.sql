-- Add status and grade fields to enrollments table
ALTER TABLE enrollments
ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending' AFTER course_id,
ADD COLUMN grade VARCHAR(2) NULL AFTER status,
ADD COLUMN completed BOOLEAN DEFAULT FALSE AFTER grade,
ADD COLUMN bank_account VARCHAR(100) NULL AFTER completed,
ADD COLUMN payment_proof VARCHAR(255) NULL AFTER bank_account,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER enrolled_at;

-- Add indexes for better query performance
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_grade ON enrollments(grade);
CREATE INDEX idx_enrollments_completed ON enrollments(completed);
