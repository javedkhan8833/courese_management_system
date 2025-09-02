const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all course assignments
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    let connection;
    try {
        console.log('Fetching course assignments');
        connection = await pool.getConnection();
        
        const [rows] = await connection.query(`
            SELECT 
                ca.id,
                ca.user_id,
                ca.course_id,
                ca.role,
                ca.assigned_at as created_at,
                u.username as user_name,
                c.title as course_title
            FROM course_assignments ca
            LEFT JOIN users u ON ca.user_id = u.id
            LEFT JOIN courses c ON ca.course_id = c.id
            ORDER BY ca.assigned_at DESC
        `);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching course assignments:', err);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    } finally {
        if (connection) await connection.release();
    }
});

// Create new course assignment
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    let connection;
    try {
        const { user_id, course_id, role } = req.body;
        
        if (!user_id || !course_id || !role) {
            return res.status(400).json({ error: 'user_id, course_id, and role are required' });
        }
        
        // Validate role
        const validRoles = ['instructor', 'teaching_assistant'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be instructor or teaching_assistant' });
        }
        
        console.log('Creating course assignment:', { user_id, course_id, role });
        
        connection = await pool.getConnection();
        
        // Check if user exists and has instructor/teaching_assistant role
        const [userRoles] = await connection.query(`
            SELECT role FROM user_roles WHERE user_id = ? AND role IN ('instructor', 'teaching_assistant')
            UNION
            SELECT role FROM users WHERE id = ? AND role IN ('instructor', 'teaching_assistant')
        `, [user_id, user_id]);
        
        if (userRoles.length === 0) {
            return res.status(400).json({ 
                error: 'User must have instructor or teaching_assistant role to be assigned to a course' 
            });
        }
        
        // Check if course exists
        const [courseExists] = await connection.query('SELECT id FROM courses WHERE id = ?', [course_id]);
        if (courseExists.length === 0) {
            return res.status(400).json({ error: 'Course not found' });
        }
        
        // Check if assignment already exists
        const [existing] = await connection.query(
            'SELECT id FROM course_assignments WHERE user_id = ? AND course_id = ? AND role = ?',
            [user_id, course_id, role]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Assignment already exists for this user, course, and role' });
        }
        
        // Create assignment
        const [result] = await connection.query(
            'INSERT INTO course_assignments (user_id, course_id, role, assigned_at) VALUES (?, ?, ?, NOW())',
            [user_id, course_id, role]
        );
        
        res.status(201).json({ 
            message: 'Course assignment created successfully',
            id: result.insertId
        });
    } catch (err) {
        console.error('Error creating course assignment:', err);
        res.status(500).json({ 
            error: 'Failed to create course assignment',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        if (connection) await connection.release();
    }
});

// Delete course assignment
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        console.log('Deleting course assignment:', id);
        
        connection = await pool.getConnection();
        
        const [result] = await connection.query(
            'DELETE FROM course_assignments WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Course assignment not found' });
        }
        
        res.json({ message: 'Course assignment deleted successfully' });
    } catch (err) {
        console.error('Error deleting course assignment:', err);
        res.status(500).json({ 
            error: 'Failed to delete course assignment',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        if (connection) await connection.release();
    }
});

module.exports = router;
