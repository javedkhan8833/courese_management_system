const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get user roles by user ID
router.get('/:userId', authenticateToken, requireAdmin, async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        console.log('Fetching roles for user:', userId);
        
        connection = await pool.getConnection();
        
        // Get roles from user_roles table
        const [roleRows] = await connection.query(
            'SELECT role FROM user_roles WHERE user_id = ?',
            [userId]
        );
        
        // Get default role from users table
        const [userRows] = await connection.query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        
        const roles = roleRows.map(row => row.role);
        
        // Include default role if it's not already in the roles array
        if (userRows.length > 0 && userRows[0].role && !roles.includes(userRows[0].role)) {
            roles.push(userRows[0].role);
        }
        
        res.json(roles);
    } catch (err) {
        console.error('Error fetching user roles:', err);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    } finally {
        if (connection) await connection.release();
    }
});

// Update user roles
router.put('/:userId', authenticateToken, requireAdmin, async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        const { roles } = req.body;
        
        if (!Array.isArray(roles)) {
            return res.status(400).json({ error: 'Roles must be an array' });
        }
        
        console.log('Updating roles for user:', userId, 'Roles:', roles);
        
        connection = await pool.getConnection();
        
        // Start transaction
        await connection.beginTransaction();
        
        try {
            // Clear existing roles
            await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
            
            // Insert new roles
            if (roles.length > 0) {
                const roleValues = roles.map(role => [userId, role]);
                await connection.query(
                    'INSERT INTO user_roles (user_id, role) VALUES ?',
                    [roleValues]
                );
            }
            
            // Update default role in users table (use first role as default)
            if (roles.length > 0) {
                await connection.query(
                    'UPDATE users SET role = ? WHERE id = ?',
                    [roles[0], userId]
                );
            }
            
            await connection.commit();
            res.json({ message: 'User roles updated successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (err) {
        console.error('Error updating user roles:', err);
        res.status(500).json({ 
            error: 'Failed to update user roles',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        if (connection) await connection.release();
    }
});

module.exports = router;
