const orgName = 'NOBLE GUARDS LIMITED';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const imageToBase64 = require('image-to-base64');

// Import routes
const faqRoutes = require('./routes/faqRoutes');
const sliderRoutes = require('./routes/sliderRoutes');
const contactRoutes = require('./routes/contactRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const bankAccountRoutes = require('./routes/bankAccountRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const userRoleRoutes = require('./routes/userRoleRoutes');
const courseAssignmentRoutes = require('./routes/courseAssignmentRoutes');

// Import database configuration
const { pool, testConnection } = require('./db');

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  credentials: true
}));

// Parse JSON and URL-encoded bodies (do this BEFORE logging so body is parsed)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests (after body parsing)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  if (Object.keys(req.body || {}).length) {
    console.log('Body:', req.body);
  }
  next();
});

// Preflight
app.options('*', cors());

// JWT Authentication Middleware
// In server.js
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Access token is required' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      req.user = user; // This should include the user's ID
      next();
    });
  }

// Admin Middleware
function requireAdmin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin')))) {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Mount routes
app.use('/api/faqs', faqRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/course-assignments', courseAssignmentRoutes);

// Image upload route (admin only)
app.post('/api/upload/image', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Generate the URL for the uploaded file
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Payment proof upload route (for all authenticated users)
app.post('/api/upload/payment-proof', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Generate the URL for the uploaded file
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    
    res.json({
      message: 'Payment proof uploaded successfully',
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Payment proof upload error:', error);
    res.status(500).json({ message: 'Error uploading payment proof' });
  }
});

// Error handling for multer upload errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: error.message });
  }
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Test PUT route to support the frontend "Test PUT" button ---
app.put('/api/test-put', authenticateToken, requireAdmin, (req, res) => {
  console.log('Received /api/test-put payload:', req.body);
  return res.json({ message: 'Test PUT received successfully', data: req.body });
});

// Login route
app.post('/api/login', async (req, res) => {
  const { username, email, login, password } = req.body;

  const loginField = username || email || login;
  if (!loginField || !password) {
    return res.status(400).json({ message: 'Username/email and password are required' });
  }

  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [loginField, loginField]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      connection.release();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const [roles] = await connection.query(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [user.id]
    );

    const userRoles = roles.map(r => r.role);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        roles: userRoles
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    connection.release();

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        roles: userRoles,
        full_name: user.full_name,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Register route
app.post('/api/register', async (req, res) => {
  console.log('Request body:', req.body);

  const {
    username,
    email,
    password,
    full_name,
    role = 'user'
  } = req.body;

  if (!username || !email || !password || !full_name) {
    return res.status(400).json({
      message: 'Username, email, password, and full name are required'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === username) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'Email already exists' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await connection.query(
      `INSERT INTO users (username, email, password, full_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, full_name, role]
    );

    const userId = result.insertId;

    try {
      await connection.query(
        'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
        [userId, role]
      );
    } catch (roleError) {
      console.error('Error setting user role:', roleError);
    }

    await connection.commit();

    const token = jwt.sign(
      { id: userId, username, role, roles: [role] },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        username,
        email,
        role,
        roles: [role],
        full_name,
        profile_picture: null
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Username or email already exists'
      });
    }

    res.status(500).json({
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

// Courses (public/admin/student) — unchanged from your version
app.get('/api/courses', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as current_enrollments
      FROM courses c
      WHERE c.is_visible = 1
    `);
    connection.release();
    res.json(results);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Error fetching courses' });
  }
});

app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM courses');
    connection.release();
    res.json(results);
  } catch (error) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({ error: 'Error fetching all courses' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(
      'SELECT * FROM courses WHERE id = ? AND is_visible = 1',
      [req.params.id]
    );
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Error fetching course' });
  }
});

app.post('/api/courses', authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, price, duration, level, image_url, enrollment_limit, is_visible } = req.body;

  if (!title || !description || price === undefined) {
    return res.status(400).json({ message: 'Title, description, and price are required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO courses 
        (title, description, price, duration, level, image_url, enrollment_limit, is_visible) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        price,
        duration || null,
        level || null,
        image_url || null,
        enrollment_limit || 0,
        is_visible !== undefined ? is_visible : 1
      ]
    );

    await connection.commit();

    const [newCourse] = await connection.query(
      'SELECT * FROM courses WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Course added successfully',
      course: newCourse[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding course:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A course with this title already exists' });
    }

    res.status(500).json({
      message: 'Error adding course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

app.put('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  const courseId = req.params.id;
  const { title, description, price, duration, level, image_url, enrollment_limit, is_visible } = req.body;

  if (!title || !description || price === undefined) {
    return res.status(400).json({ message: 'Title, description, and price are required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingCourses] = await connection.query(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );

    if (existingCourses.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await connection.query(
      `UPDATE courses SET 
        title = ?, 
        description = ?, 
        price = ?, 
        duration = ?, 
        level = ?, 
        image_url = ?, 
        enrollment_limit = ?, 
        is_visible = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        description,
        price,
        duration || null,
        level || null,
        image_url || null,
        enrollment_limit || 0,
        is_visible !== undefined ? is_visible : 1,
        courseId
      ]
    );

    await connection.commit();

    const [updatedCourse] = await connection.query(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating course:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A course with this title already exists' });
    }

    res.status(500).json({
      message: 'Error updating course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

app.delete('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  const courseId = req.params.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingCourses] = await connection.query(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );

    if (existingCourses.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await connection.query('DELETE FROM enrollments WHERE course_id = ?', [courseId]);
    await connection.query('DELETE FROM courses WHERE id = ?', [courseId]);

    await connection.commit();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting course:', error);

    res.status(500).json({
      message: 'Error deleting course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

app.get('/api/student/courses', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const connection = await pool.getConnection();

  try {
    const [enrollments] = await connection.query(
      `SELECT c.*, e.enrolled_at
       FROM enrollments e 
       JOIN courses c ON e.course_id = c.id 
       WHERE e.user_id = ?`,
      [userId]
    );

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses' });
  } finally {
    connection.release();
  }
});

app.get('/api/user/enrollments', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const connection = await pool.getConnection();

  try {
    const [enrollments] = await connection.query(
      `SELECT e.*, c.title as course_title, c.description as course_description
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = ?`,
      [userId]
    );

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Error fetching enrollments' });
  } finally {
    connection.release();
  }
});

// Users route for admin
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [users] = await connection.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.created_at,
             GROUP_CONCAT(ur.role) as additional_roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  } finally {
    connection.release();
  }
});

// Create new user (admin only)
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { username, email, password, full_name, role = 'user' } = req.body;
    
    console.log('Creating user with data:', { username, email, full_name, role });
    
    // Validate required fields
    if (!username || !email || !password || !full_name) {
      console.log('Missing required fields:', { username, email, full_name });
      return res.status(400).json({ 
        message: 'Username, email, password, and full name are required' 
      });
    }
    
    // Check if username or email already exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === username) {
        console.log('Username already exists:', username);
        return res.status(409).json({ message: 'Username already exists' });
      }
      if (existingUser.email === email) {
        console.log('Email already exists:', email);
        return res.status(409).json({ message: 'Email already exists' });
      }
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    
    // Insert new user
    console.log('Inserting user into database...');
    const [result] = await connection.query(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, role]
    );
    
    console.log('User inserted with ID:', result.insertId);
    
    // Get the created user (without password)
    const [newUser] = await connection.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.created_at,
             GROUP_CONCAT(ur.role) as additional_roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [result.insertId]);
    
    console.log('Retrieved created user:', newUser[0]);
    
    res.status(201).json({
      message: 'User created successfully',
      user: newUser[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user: ' + error.message });
  } finally {
    connection.release();
  }
});

// Get specific user by ID
app.get('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [users] = await connection.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.created_at,
             GROUP_CONCAT(ur.role) as additional_roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [req.params.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  } finally {
    connection.release();
  }
});

// Delete user by ID
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow admin to delete themselves
    if (userId == req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Delete user roles first (due to foreign key constraint)
    await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    
    // Delete user enrollments
    await connection.query('DELETE FROM enrollments WHERE user_id = ?', [userId]);
    
    // Delete user
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  } finally {
    connection.release();
  }
});

// Update user by ID
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { username, email, full_name, role } = req.body;
    const userId = req.params.id;
    
    // Check if user exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if username or email already exists for other users
    if (username || email) {
      const [duplicateUsers] = await connection.query(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [username || existingUsers[0].username, email || existingUsers[0].email, userId]
      );
      
      if (duplicateUsers.length > 0) {
        return res.status(409).json({ message: 'Username or email already exists' });
      }
    }
    
    // Update user
    await connection.query(
      'UPDATE users SET username = ?, email = ?, full_name = ?, role = ? WHERE id = ?',
      [
        username || existingUsers[0].username,
        email || existingUsers[0].email,
        full_name || existingUsers[0].full_name,
        role || existingUsers[0].role,
        userId
      ]
    );
    
    // Get updated user
    const [updatedUsers] = await connection.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.created_at,
             GROUP_CONCAT(ur.role) as additional_roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);
    
    res.json({
      message: 'User updated successfully',
      user: updatedUsers[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  } finally {
    connection.release();
  }
});

// Update user roles
app.put('/api/users/:id/roles', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { roles } = req.body;
    const userId = req.params.id;
    
    if (!Array.isArray(roles)) {
      return res.status(400).json({ error: 'Roles must be an array' });
    }
    
    console.log('Updating roles for user:', userId, 'Roles:', roles);
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Clear existing roles
      await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
      
      // Insert new roles
      if (roles.length > 0) {
        const roleValues = roles.map(role => [userId, role]);
        await connection.query(
          'INSERT INTO user_roles (user_id, role) VALUES ?',
          [roleValues]
        );
      }
      
      // Update default role in users table (use first role as default)
      if (roles.length > 0) {
        await connection.query(
          'UPDATE users SET role = ? WHERE id = ?',
          [roles[0], userId]
        );
      }
      
      await connection.commit();
      res.json({ message: 'User roles updated successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating user roles:', error);
    res.status(500).json({ message: 'Error updating user roles' });
  } finally {
    connection.release();
  }
});

// User registrations statistics route
app.get('/api/admin/user-registrations', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Get total users
    const [totalUsers] = await connection.query('SELECT COUNT(*) as total FROM users');
    
    // Get users by role
    const [usersByRole] = await connection.query(`
      SELECT u.role, COUNT(*) as count
      FROM users u
      GROUP BY u.role
    `);
    
    // Get recent registrations (last 30 days)
    const [recentRegistrations] = await connection.query(`
      SELECT COUNT(*) as recent
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    res.json({
      totalUsers: totalUsers[0].total,
      usersByRole: usersByRole,
      recentRegistrations: recentRegistrations[0].recent
    });
  } catch (error) {
    console.error('Error fetching user registration statistics:', error);
    res.status(500).json({ message: 'Error fetching user registration statistics' });
  } finally {
    connection.release();
  }
});

// Token validation route
app.get('/api/validate-token', authenticateToken, async (req, res) => {
  try {
    // If we reach here, the token is valid (authenticateToken middleware passed)
    res.json({ valid: true, user: req.user });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

// Profile route
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    // Get complete user data from database
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Get user roles
    const [roles] = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [req.user.id]
    );
    
    const userRoles = roles.map(r => r.role);
    
    const profile = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      roles: userRoles,
      profile_picture: user.profile_picture,
      gender: user.gender,
      phone: user.phone,
      dob: user.dob,
      country: user.country,
      city: user.city,
      street: user.street,
      postal_code: user.postal_code,
      country_of_residence: user.country_of_residence,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update profile route
app.put('/api/profile', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    const { gender, phone, dob, country, city, street, postal_code, country_of_residence } = req.body;
    
    // No validation for username, email, full_name since they're not editable in profile
    // These fields are set during registration and should not be changed here
    
    let profilePictureUrl = req.user.profile_picture;
    
    // Handle profile picture upload
    if (req.file) {
      profilePictureUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }
    
    // First, let's add the missing columns to the users table if they don't exist
    const additionalColumns = [
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
        await pool.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
        console.log(`Added column: ${column.name}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
          console.error(`Error adding column ${column.name}:`, error);
        }
      }
    }
    
    // Update user profile with only profile fields (not username, email, full_name)
    await pool.query(
      `UPDATE users 
       SET profile_picture = ?, 
           gender = ?, phone = ?, dob = ?, country = ?, city = ?, 
           street = ?, postal_code = ?, country_of_residence = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        profilePictureUrl,
        gender || null, phone || null, dob || null, country || null, city || null,
        street || null, postal_code || null, country_of_residence || null,
        req.user.id
      ]
    );
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Notifications route
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    // For now, return empty array since notifications table doesn't exist
    // You can create the notifications table later if needed
    res.json([]);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Course statistics route
app.get('/api/admin/course-stats', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Get total courses
    const [totalCourses] = await connection.query('SELECT COUNT(*) as total FROM courses');
    
    // Get visible courses
    const [visibleCourses] = await connection.query('SELECT COUNT(*) as visible FROM courses WHERE is_visible = 1');
    
    // Get courses with enrollments
    const [coursesWithEnrollments] = await connection.query(`
      SELECT c.id, c.title, COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      GROUP BY c.id, c.title
      ORDER BY enrollment_count DESC
      LIMIT 10
    `);
    
    // Get recent enrollments
    const [recentEnrollments] = await connection.query(`
      SELECT c.title, COUNT(e.id) as recent_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id 
        AND e.enrolled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY c.id, c.title
      ORDER BY recent_count DESC
      LIMIT 5
    `);

    res.json({
      totalCourses: totalCourses[0].total,
      visibleCourses: visibleCourses[0].visible,
      topCourses: coursesWithEnrollments,
      recentEnrollments: recentEnrollments
    });
  } catch (error) {
    console.error('Error fetching course statistics:', error);
    res.status(500).json({ message: 'Error fetching course statistics' });
  } finally {
    connection.release();
  }
});

// (Removed the duplicate placeholder GET /api/sliders to avoid conflicting with sliderRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : ''
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await testConnection();
    console.log('Successfully connected to MySQL database');

    const initDb = require('./init-db');
    await initDb();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
});
