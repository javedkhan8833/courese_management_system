const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all contacts
router.get('/', async (req, res) => {
    try {
        const [contacts] = await db.pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ message: 'Error fetching contacts' });
    }
});

// Create a new contact
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Name, email, and message are required' });
        }

        // Insert the new contact
        const [result] = await db.pool.query(
            'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
            [name, email, message]
        );

        // Get the newly created contact
        const [newContact] = await db.pool.query(
            'SELECT * FROM contacts WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newContact[0]);
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ message: 'Error creating contact' });
    }
});

// Get a single contact
router.get('/:id', async (req, res) => {
    try {
        const [contacts] = await db.pool.query('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
        if (contacts.length === 0) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json(contacts[0]);
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ message: 'Error fetching contact' });
    }
});

// Delete a contact
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.pool.query('DELETE FROM contacts WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ message: 'Error deleting contact' });
    }
});

// Mark contact as read
router.patch('/:id/read', async (req, res) => {
    try {
        const [result] = await db.pool.query(
            'UPDATE contacts SET is_read = TRUE WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json({ message: 'Contact marked as read' });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ message: 'Error updating contact' });
    }
});

module.exports = router;