const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all enrollments (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('Admin requesting enrollments with query:', req.query);
        console.log('Admin user:', req.user);
        
        const { status, user, course, search } = req.query;
        let query = `
            SELECT e.*, u.username, u.email, u.full_name, c.title as course_title,
                   c.price as course_price, c.duration as course_duration
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'All') {
            query += ' AND e.status = ?';
            params.push(status);
        }
        
        if (user) {
            query += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)';
            const userTerm = `%${user}%`;
            params.push(userTerm, userTerm, userTerm);
        }
        
        if (course) {
            query += ' AND c.title LIKE ?';
            params.push(`%${course}%`);
        }
        
        if (search) {
            query += ' AND (u.username LIKE ? OR u.email LIKE ? OR c.title LIKE ? OR e.status LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        query += ' ORDER BY e.enrolled_at DESC';
        
        console.log('Executing query:', query);
        console.log('Query parameters:', params);
        
        const [enrollments] = await pool.query(query, params);
        console.log('Found enrollments:', enrollments.length);
        
        res.json(enrollments);
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState
        });
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// Get user's enrollments
router.get('/my-enrollments', authenticateToken, async (req, res) => {
    try {
        const [enrollments] = await pool.query(
            `SELECT e.*, c.title as course_title, c.image_url as course_image, 
                    c.description as course_description, c.price as course_price,
                    c.duration as course_duration
             FROM enrollments e
             JOIN courses c ON e.course_id = c.id
             WHERE e.user_id = ?
             ORDER BY e.enrolled_at DESC`,
            [req.user.id]
        );
        res.json(enrollments);
    } catch (error) {
        console.error('Error fetching user enrollments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Enroll in a course
router.post('/', authenticateToken, async (req, res) => {
    const { course_id, bank_account, payment_proof } = req.body;
    
    console.log('Enrollment request:', { course_id, bank_account, payment_proof, user_id: req.user.id });
    
    // Validate required fields
    if (!course_id) {
        return res.status(400).json({ message: 'Course ID is required' });
    }
    
    if (!payment_proof) {
        return res.status(400).json({ message: 'Payment proof is required' });
    }
    
    try {
        // Check if course exists
        const [courses] = await pool.query('SELECT id FROM courses WHERE id = ?', [course_id]);
        if (courses.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if user exists
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if already enrolled
        const [existing] = await pool.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
            [req.user.id, course_id]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }
        
        // Create new enrollment
        const [result] = await pool.query(
            `INSERT INTO enrollments 
             (user_id, course_id, bank_account, payment_proof, status) 
             VALUES (?, ?, ?, ?, 'pending')`,
            [req.user.id, course_id, bank_account || null, payment_proof]
        );
        
        console.log('Enrollment created successfully:', result.insertId);
        
        res.status(201).json({
            id: result.insertId,
            message: 'Enrollment request submitted successfully'
        });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState
        });
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// Update enrollment status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const { status, admin_notes } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected' });
    }
    
    try {
        // Get enrollment details for notification
        const [enrollments] = await pool.query(
            `SELECT e.*, u.email, u.username, c.title as course_title
             FROM enrollments e
             JOIN users u ON e.user_id = u.id
             JOIN courses c ON e.course_id = c.id
             WHERE e.id = ?`,
            [req.params.id]
        );
        
        if (enrollments.length === 0) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        
        const enrollment = enrollments[0];
        
        // Update enrollment status
        await pool.query(
            'UPDATE enrollments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, req.params.id]
        );
        
        // Add admin notes if provided
        if (admin_notes) {
            await pool.query(
                'UPDATE enrollments SET admin_notes = ? WHERE id = ?',
                [admin_notes, req.params.id]
            );
        }
        
        console.log(`Enrollment ${req.params.id} ${status} by admin ${req.user.username}`);
        
        res.json({ 
            message: `Enrollment ${status.toLowerCase()} successfully`,
            enrollment: {
                id: enrollment.id,
                status: status,
                user_email: enrollment.email,
                course_title: enrollment.course_title
            }
        });
    } catch (error) {
        console.error('Error updating enrollment status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update grade (admin only)
router.put('/:id/grade', authenticateToken, requireAdmin, async (req, res) => {
    const { grade, completed } = req.body;
    
    try {
        await pool.query(
            'UPDATE enrollments SET grade = ?, completed = ? WHERE id = ?',
            [grade, completed, req.params.id]
        );
        
        res.json({ message: 'Grade updated successfully' });
    } catch (error) {
        console.error('Error updating grade:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete enrollment (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM enrollments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Enrollment deleted successfully' });
    } catch (error) {
        console.error('Error deleting enrollment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get enrollment by ID (with payment proof details)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [enrollments] = await pool.query(
            `SELECT e.*, u.username, u.email, u.full_name, c.title as course_title,
                    c.description as course_description, c.price as course_price,
                    c.duration as course_duration, c.image_url as course_image
             FROM enrollments e
             JOIN users u ON e.user_id = u.id
             JOIN courses c ON e.course_id = c.id
             WHERE e.id = ?`,
            [req.params.id]
        );
        
        if (enrollments.length === 0) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        
        // Only allow the enrolled user or admin to view the enrollment
        if (enrollments[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        res.json(enrollments[0]);
    } catch (error) {
        console.error('Error fetching enrollment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Certificate generation (placeholder - can be implemented later with proper PDF library)
router.post('/:id/certificate', authenticateToken, async (req, res) => {
    try {
        // Get enrollment with user and course details
        const [enrollments] = await pool.query(
            `SELECT e.*, u.full_name, u.email, c.title as course_title
             FROM enrollments e
             JOIN users u ON e.user_id = u.id
             JOIN courses c ON e.course_id = c.id
             WHERE e.id = ?`,
            [req.params.id]
        );
        
        if (enrollments.length === 0) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        
        const enrollment = enrollments[0];
        
        // Check if user is authorized (either the enrolled user or admin)
        if (enrollment.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Check if eligible for certificate
        if (enrollment.status !== 'Approved' || !enrollment.completed) {
            return res.status(400).json({ 
                message: 'Not eligible for certificate. Course must be completed and approved.' 
            });
        }
        
        // For now, return a success message instead of generating PDF
        res.json({ 
            message: 'Certificate generation feature will be implemented soon',
            enrollment: {
                id: enrollment.id,
                user_name: enrollment.full_name,
                course_title: enrollment.course_title
            }
        });
        
    } catch (error) {
        console.error('Error with certificate route:', error);
        res.status(500).json({ message: 'Error processing certificate request' });
    }
});

module.exports = router;
