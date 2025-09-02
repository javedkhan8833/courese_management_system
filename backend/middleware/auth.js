const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// Verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token is required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        
        try {
            // Verify user still exists in database
            const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
            if (users.length === 0) {
                return res.status(403).json({ message: 'User no longer exists' });
            }
            
            req.user = users[0];
            next();
        } catch (error) {
            console.error('Database error during authentication:', error);
            res.status(500).json({ message: 'Server error during authentication' });
        }
    });
};

// Check if user has admin role
const requireAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
        console.log('Checking admin status for user:', req.user.id);
        console.log('User role from token:', req.user.role);
        
        // Check if user has admin role in user_roles table
        const [results] = await pool.query(
            'SELECT * FROM user_roles WHERE user_id = ? AND role = "admin"',
            [req.user.id]
        );
        
        console.log('Admin role check results:', results);
        
        if (results.length > 0 || req.user.role === 'admin') {
            console.log('Admin access granted');
            next();
        } else {
            console.log('Admin access denied');
            res.status(403).json({ message: 'Admin access required' });
        }
    } catch (error) {
        console.error('Database error checking admin status:', error);
        res.status(500).json({ message: 'Server error checking admin status' });
    }
};

module.exports = {
    authenticateToken,
    requireAdmin
};
