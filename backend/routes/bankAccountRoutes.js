const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all bank accounts
router.get('/', authenticateToken, async (req, res) => {
    let connection;
    try {
        console.log('Fetching all bank accounts');
        connection = await pool.getConnection();
        const [accounts] = await connection.query(`
            SELECT id, bank_name, bank_number, account_holder_name, 
                   branch_name, account_type, is_active, 
                   created_at, updated_at 
            FROM bank_accounts 
            ORDER BY bank_name, account_holder_name
        `);
        console.log(`Found ${accounts.length} bank accounts`);
        res.json(accounts);
    } catch (err) {
        console.error('Error fetching bank accounts:', err);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    } finally {
        if (connection) await connection.release();
    }
});

// Get single bank account by ID
router.get('/:id', authenticateToken, async (req, res) => {
    let connection;
    try {
        console.log(`Fetching bank account by ID: ${req.params.id}`);
        connection = await pool.getConnection();
        const [accounts] = await connection.query('SELECT * FROM bank_accounts WHERE id = ?', [req.params.id]);
        if (accounts.length === 0) {
            console.log(`Bank account not found: ${req.params.id}`);
            return res.status(404).json({ error: 'Bank account not found' });
        }
        console.log(`Found bank account: ${accounts[0].id}`);
        res.json(accounts[0]);
    } catch (err) {
        console.error('Error fetching bank account:', err);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    } finally {
        if (connection) await connection.release();
    }
});



// Update bank account (Admin only)
// In bankAccountRoutes.js

// Create bank account (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { bank_name, bank_number, account_holder_name, branch_name, account_type, is_active } = req.body;
    
    // Input validation
    if (!bank_name || !bank_number || !account_holder_name) {
        return res.status(400).json({ 
            error: 'Bank name, account number, and account holder name are required' 
        });
    }

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Check for duplicate account number
        const [existing] = await connection.query(
            'SELECT id, bank_name, account_holder_name FROM bank_accounts WHERE bank_number = ?', 
            [bank_number]
        );
        
        if (existing.length > 0) {
            const conflictingAccount = existing[0];
            return res.status(400).json({ 
                error: `Bank account number "${bank_number}" is already used by ${conflictingAccount.bank_name} (${conflictingAccount.account_holder_name})` 
            });
        }

        // Insert new bank account with created_by
        const [result] = await connection.query(
            `INSERT INTO bank_accounts 
             (bank_name, bank_number, account_holder_name, branch_name, 
              account_type, is_active, created_by, updated_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                bank_name, 
                bank_number, 
                account_holder_name, 
                branch_name || null, 
                account_type || 'savings', 
                is_active !== false,
                req.user.id, // created_by
                req.user.id  // updated_by
            ]
        );

        const [newAccount] = await connection.query(
            'SELECT * FROM bank_accounts WHERE id = ?', 
            [result.insertId]
        );
        
        await connection.commit();
        res.status(201).json(newAccount[0]);
        
    } catch (error) {
        await connection.rollback();
        console.error('Error creating bank account:', error);
        res.status(500).json({ 
            error: 'Failed to create bank account',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

// Update bank account (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { bank_name, bank_number, account_holder_name, branch_name, account_type, is_active } = req.body;
    
    // Input validation
    if (!bank_name || !bank_number || !account_holder_name) {
        return res.status(400).json({ 
            error: 'Bank name, account number, and account holder name are required' 
        });
    }

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Check if account exists
        const [accounts] = await connection.query(
            'SELECT id FROM bank_accounts WHERE id = ?', 
            [id]
        );
        
        if (accounts.length === 0) {
            return res.status(404).json({ error: 'Bank account not found' });
        }

        // Check for duplicate account number (excluding current account)
        const [existing] = await connection.query(
            'SELECT id, bank_name, account_holder_name FROM bank_accounts WHERE bank_number = ? AND id != ?', 
            [bank_number, id]
        );
        
        if (existing.length > 0) {
            const conflictingAccount = existing[0];
            return res.status(400).json({ 
                error: `Bank account number "${bank_number}" is already used by ${conflictingAccount.bank_name} (${conflictingAccount.account_holder_name})` 
            });
        }

        // Update bank account with updated_by
        await connection.query(
            `UPDATE bank_accounts 
             SET bank_name = ?, 
                 bank_number = ?, 
                 account_holder_name = ?,
                 branch_name = ?, 
                 account_type = ?, 
                 is_active = ?,
                 updated_by = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                bank_name, 
                bank_number,
                account_holder_name,
                branch_name,
                account_type,
                is_active,
                req.user.id,
                id
            ]
        );
        
        await connection.commit();
        const [updatedAccount] = await connection.query(
            'SELECT * FROM bank_accounts WHERE id = ?',
            [id]
        );
        res.json(updatedAccount[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating bank account:', error);
        res.status(500).json({ 
            error: 'Failed to update bank account',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

// Delete bank account (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`Delete request for account ID: ${id}`);
    
    let connection;
    try {
        connection = await pool.getConnection();
        
        // First check if the account exists
        const [accounts] = await connection.query(
            'SELECT id FROM bank_accounts WHERE id = ?', 
            [id]
        );
        
        if (accounts.length === 0) {
            console.log(`Bank account not found for deletion: ${id}`);
            return res.status(404).json({ error: 'Bank account not found' });
        }
        
        console.log('Deleting bank account');
        const [result] = await connection.query(
            'DELETE FROM bank_accounts WHERE id = ?', 
            [id]
        );
        
        console.log(`Bank account deleted: ${result.affectedRows} row(s) affected`);
        res.json({ 
            success: true, 
            message: 'Bank account deleted successfully' 
        });
        
    } catch (err) {
        console.error('Error deleting bank account:', err);
        
        // Handle foreign key constraint violation
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            console.log('Foreign key constraint violation - account is in use');
            return res.status(400).json({ 
                error: 'Cannot delete bank account as it is being used in the system' 
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to delete bank account',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        if (connection) await connection.release();
    }
});

module.exports = router;
