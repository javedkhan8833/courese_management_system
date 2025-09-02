const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all sliders
router.get('/', async (req, res) => {
    try {
        const [sliders] = await db.pool.query('SELECT * FROM sliders ORDER BY sort_order');
        res.json(sliders);
    } catch (error) {
        console.error('Error fetching sliders:', error);
        res.status(500).json({ message: 'Error fetching sliders' });
    }
});

// Get a single slider by ID
router.get('/:id', async (req, res) => {
    try {
        const [sliders] = await db.pool.query('SELECT * FROM sliders WHERE id = ?', [req.params.id]);
        if (sliders.length === 0) {
            return res.status(404).json({ message: 'Slider not found' });
        }
        res.json(sliders[0]);
    } catch (error) {
        console.error('Error fetching slider:', error);
        res.status(500).json({ message: 'Error fetching slider' });
    }
});

// Create a new slider
router.post('/', async (req, res) => {
    const { title, subtitle, description, image_url, button_text, button_link, is_active, sort_order } = req.body;
    
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        const [result] = await db.pool.query(
            'INSERT INTO sliders (title, subtitle, description, image_url, button_text, button_link, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, subtitle || null, description || null, image_url || null, button_text || null, button_link || null, is_active !== false, sort_order || 0]
        );
        
        const [newSlider] = await db.pool.query('SELECT * FROM sliders WHERE id = ?', [result.insertId]);
        res.status(201).json(newSlider[0]);
    } catch (error) {
        console.error('Error creating slider:', error);
        res.status(500).json({ message: 'Error creating slider' });
    }
});

// Update a slider
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, subtitle, description, image_url, button_text, button_link, is_active, sort_order } = req.body;
    
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        const [result] = await db.pool.query(
            'UPDATE sliders SET title = ?, subtitle = ?, description = ?, image_url = ?, button_text = ?, button_link = ?, is_active = ?, sort_order = ? WHERE id = ?',
            [title, subtitle || null, description || null, image_url || null, button_text || null, button_link || null, is_active !== false, sort_order || 0, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Slider not found' });
        }
        
        const [updatedSlider] = await db.pool.query('SELECT * FROM sliders WHERE id = ?', [id]);
        res.json(updatedSlider[0]);
    } catch (error) {
        console.error('Error updating slider:', error);
        res.status(500).json({ message: 'Error updating slider' });
    }
});

// Delete a slider
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.pool.query('DELETE FROM sliders WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Slider not found' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting slider:', error);
        res.status(500).json({ message: 'Error deleting slider' });
    }
});

module.exports = router;