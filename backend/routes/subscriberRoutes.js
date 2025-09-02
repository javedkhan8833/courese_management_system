const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if already subscribed
        const [existing] = await db.query(
            'SELECT * FROM subscribers WHERE email = ?', 
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                message: 'This email is already subscribed.' 
            });
        }

        // Add new subscriber
        await db.query(
            'INSERT INTO subscribers (email) VALUES (?)',
            [email]
        );
        
        res.status(201).json({ 
            message: 'Thank you for subscribing!' 
        });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ 
            message: 'Error processing subscription',
            error: error.message
        });
    }
});

// Get all subscribers (with pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count for pagination
        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM subscribers');
        
        // Get paginated subscribers
        const [subscribers] = await db.query(
            'SELECT * FROM subscribers ORDER BY subscribed_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.json({
            data: subscribers,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        res.status(500).json({ message: 'Error fetching subscribers' });
    }
});

// Add new subscriber (from public form)
router.post('/add', async (req, res) => {
    try {
        const { email } = req.body;

        // Basic validation
        if (!email || !email.includes('@')) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Check if email already exists
        const [existing] = await db.query(
            'SELECT id FROM subscribers WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(200).json({ message: 'You are already subscribed!' });
        }

        // Add new subscriber
        await db.query(
            'INSERT INTO subscribers (email) VALUES (?)',
            [email]
        );

        res.status(201).json({ message: 'Thank you for subscribing!' });
    } catch (error) {
        console.error('Error adding subscriber:', error);
        res.status(500).json({ message: 'Error adding subscriber' });
    }
});

// Delete subscriber (admin only)
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM subscribers WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Subscriber not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting subscriber:', error);
        res.status(500).json({ message: 'Error deleting subscriber' });
    }
});

// Export subscribers to CSV
router.get('/export', async (req, res) => {
    try {
        const [subscribers] = await db.query(
            'SELECT email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC'
        );

        // Convert to CSV
        let csv = 'Email,Subscribed At\n';
        subscribers.forEach(sub => {
            csv += `"${sub.email}","${sub.subscribed_at}"\n`;
        });

        // Set headers for file download
        res.header('Content-Type', 'text/csv');
        res.attachment('subscribers.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting subscribers:', error);
        res.status(500).json({ message: 'Error exporting subscribers' });
    }
});

module.exports = router;