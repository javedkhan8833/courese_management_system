const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get about content (public)
router.get('/', async (req, res) => {
    let connection;
    try {
        console.log('Fetching about content');
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT content FROM about WHERE id = 1');
        
        if (rows.length === 0) {
            // Return default content if no content exists
            const defaultContent = '<h2>Welcome to Our Learning Platform</h2><p>This is the initial content for the About page. You can edit this content using the rich text editor in the admin panel.</p><p>Feel free to add images, videos, and other media to make your About page more engaging!</p>';
            res.json({ content: defaultContent });
        } else {
            res.json({ content: rows[0].content });
        }
    } catch (err) {
        console.error('Error fetching about content:', err);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    } finally {
        if (connection) await connection.release();
    }
});

// Update about content (Admin only)
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    let connection;
    try {
        console.log('Updating about content');
        connection = await pool.getConnection();
        
        // Check if about record exists
        const [existing] = await connection.query('SELECT id FROM about WHERE id = 1');
        
        if (existing.length === 0) {
            // Insert new record
            await connection.query('INSERT INTO about (id, content) VALUES (1, ?)', [content]);
        } else {
            // Update existing record
            await connection.query('UPDATE about SET content = ? WHERE id = 1', [content]);
        }
        
        res.json({ message: 'About content updated successfully' });
    } catch (err) {
        console.error('Error updating about content:', err);
        res.status(500).json({ 
            error: 'Failed to update about content',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        if (connection) await connection.release();
    }
});

module.exports = router;
