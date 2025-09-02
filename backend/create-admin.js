// create-admin.js
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function createAdminUser() {
    const adminEmail = 'admin@hms.com';
    const adminPassword = 'admin@8833';
    const adminUsername = 'admin@hms.com'; // Using email as username
    const adminFullName = 'System Administrator';

    try {
        const connection = await pool.getConnection();
        
        // Check if admin already exists
        const [existingUsers] = await connection.query(
            'SELECT * FROM users WHERE email = ?', 
            [adminEmail]
        );

        if (existingUsers.length > 0) {
            console.log('Admin user already exists');
            console.log('Email:', adminEmail);
            console.log('Role: admin');
            connection.release();
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Start transaction
        await connection.beginTransaction();

        try {
            // Insert admin user
            const [result] = await connection.query(
                `INSERT INTO users (
                    username, email, password, full_name, role
                ) VALUES (?, ?, ?, ?, ?)`,
                [adminUsername, adminEmail, hashedPassword, adminFullName, 'admin']
            );

            const userId = result.insertId;

            // Add admin role to user_roles
            await connection.query(
                'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
                [userId, 'admin']
            );

            await connection.commit();
            console.log('Admin user created successfully!');
            console.log('Email:', adminEmail);
            console.log('Password:', adminPassword);
            console.log('Role: admin');

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

// Run the function
createAdminUser()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));