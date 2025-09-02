const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all FAQs
router.get('/', async (req, res) => {
    try {
        const [faqs] = await db.pool.query('SELECT * FROM faqs');
        res.json(faqs);
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({ message: 'Error fetching FAQs' });
    }
});

// Add a new FAQ
router.post('/', async (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) {
        return res.status(400).json({ message: 'Question and answer are required' });
    }
    try {
        const [result] = await db.pool.query(
            'INSERT INTO faqs (question, answer) VALUES (?, ?)',
            [question, answer]
        );
        res.status(201).json({ id: result.insertId, question, answer });
    } catch (error) {
        console.error('Error creating FAQ:', error);
        res.status(500).json({ message: 'Error creating FAQ' });
    }
});
// Update an existing FAQ
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { question, answer } = req.body;
    
    if (!question || !answer) {
        return res.status(400).json({ message: 'Question and answer are required' });
    }

    try {
        const [result] = await db.pool.query(
            'UPDATE faqs SET question = ?, answer = ? WHERE id = ?',
            [question, answer, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        
        res.json({ id, question, answer });
    } catch (error) {
        console.error('Error updating FAQ:', error);
        res.status(500).json({ message: 'Error updating FAQ' });
    }
});

// Delete an FAQ
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.pool.query('DELETE FROM faqs WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        
        res.status(204).send(); // No content to return after deletion
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({ message: 'Error deleting FAQ' });
    }
});

module.exports = router;