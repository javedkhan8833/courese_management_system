const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'course_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Allow executing multiple SQL statements in one query (required for .sql migrations)
    multipleStatements: true
});

// Test the database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to MySQL database');
        connection.release();
        await initializeDatabase();
        return true;
    } catch (error) {
        console.error('Error connecting to MySQL database:', error);
        throw error;
    }
}

// Initialize database tables
async function initializeDatabase() {
    const connection = await pool.getConnection();
    try {
        // Create users table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                profile_picture VARCHAR(255),
                gender VARCHAR(10),
                phone VARCHAR(20),
                dob DATE,
                country VARCHAR(100),
                city VARCHAR(100),
                street VARCHAR(255),
                postal_code VARCHAR(20),
                country_of_residence VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Add missing columns if they don't exist
        const additionalColumns = [
            { name: 'profile_picture', type: 'VARCHAR(255)' },
            { name: 'gender', type: 'VARCHAR(10)' },
            { name: 'phone', type: 'VARCHAR(20)' },
            { name: 'dob', type: 'DATE' },
            { name: 'country', type: 'VARCHAR(100)' },
            { name: 'city', type: 'VARCHAR(100)' },
            { name: 'street', type: 'VARCHAR(255)' },
            { name: 'postal_code', type: 'VARCHAR(20)' },
            { name: 'country_of_residence', type: 'VARCHAR(100)' }
        ];
        
        for (const column of additionalColumns) {
            try {
                await connection.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
            } catch (error) {
                // Column already exists, ignore the error
                if (error.code !== 'ER_DUP_FIELDNAME') {
                    throw error;
                }
            }
        }

        // Create courses table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) DEFAULT 0,
                duration INT,
                level VARCHAR(50),
                is_visible BOOLEAN DEFAULT TRUE,
                image_url VARCHAR(255),
                enrollment_limit INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Add is_visible column if it doesn't exist
        try {
            await connection.query('ALTER TABLE courses ADD COLUMN is_visible BOOLEAN DEFAULT TRUE');
        } catch (error) {
            // Column already exists, ignore the error
            if (error.code !== 'ER_DUP_FIELDNAME') {
                throw error;
            }
        }

        // Create enrollments table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                bank_account VARCHAR(255),
                payment_proof TEXT,
                grade VARCHAR(5),
                completed BOOLEAN DEFAULT FALSE,
                admin_notes TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_enrollment (user_id, course_id)
            )
        `);

        // Add admin_notes column if it doesn't exist
        try {
            await connection.query('ALTER TABLE enrollments ADD COLUMN admin_notes TEXT');
        } catch (error) {
            // Column already exists, ignore the error
            if (error.code !== 'ER_DUP_FIELDNAME') {
                throw error;
            }
        }

        // Create user_roles table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_role (user_id, role)
            )
        `);

        // Create bank_accounts table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bank_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bank_name VARCHAR(255) NOT NULL,
                bank_number VARCHAR(255) NOT NULL UNIQUE,
                account_holder_name VARCHAR(255) NOT NULL,
                branch_name VARCHAR(255),
                account_type VARCHAR(50) DEFAULT 'savings',
                is_active BOOLEAN DEFAULT TRUE,
                created_by INT,
                updated_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Create about table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS about (
                id INT PRIMARY KEY DEFAULT 1,
                content LONGTEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create course_assignments table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS course_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_course_assignment (user_id, course_id, role)
            )
        `);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Export the pool and functions
module.exports = {
    pool,
    testConnection,
    initializeDatabase
};