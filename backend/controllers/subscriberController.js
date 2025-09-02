const db = require('../config/database');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
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
};

// Get all subscribers (admin only)
exports.getAllSubscribers = async (req, res) => {
    try {
        const [subscribers] = await db.query(`
            SELECT * 
            FROM subscribers 
            ORDER BY subscribed_at DESC
        `);
        
        res.json(subscribers);
    } catch (error) {
        console.error('Error in getAllSubscribers:', error);
        res.status(500).json({ 
            message: 'Error fetching subscribers',
            error: error.message
        });
    }
};