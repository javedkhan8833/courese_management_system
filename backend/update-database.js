const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to SQLite database');
    updateDatabase();
});

function updateDatabase() {
    console.log('Updating database schema...');
    
    // Add missing columns to courses table
    const alterQueries = [
        "ALTER TABLE courses ADD COLUMN enrollment_limit INTEGER DEFAULT 0",
        "ALTER TABLE courses ADD COLUMN is_visible INTEGER DEFAULT 1",
        // User profile columns
        "ALTER TABLE users ADD COLUMN full_name TEXT",
        "ALTER TABLE users ADD COLUMN gender TEXT",
        "ALTER TABLE users ADD COLUMN phone TEXT",
        "ALTER TABLE users ADD COLUMN dob TEXT",
        "ALTER TABLE users ADD COLUMN country TEXT",
        "ALTER TABLE users ADD COLUMN city TEXT",
        "ALTER TABLE users ADD COLUMN street TEXT",
        "ALTER TABLE users ADD COLUMN postal_code TEXT",
        "ALTER TABLE users ADD COLUMN profile_picture TEXT"
    ];
    
    let completedQueries = 0;
    
    alterQueries.forEach((query, index) => {
        db.run(query, (err) => {
            if (err) {
                // Column might already exist, which is fine
                console.log(`Query ${index + 1} result:`, err.message);
            } else {
                console.log(`Query ${index + 1} executed successfully`);
            }
            
            completedQueries++;
            if (completedQueries === alterQueries.length) {
                console.log('Database update completed!');
                db.close();
            }
        });
    });

    // Add country_of_residence column to users table if not exists
    const addCountryOfResidence = `ALTER TABLE users ADD COLUMN country_of_residence TEXT`;
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) throw err;
      const hasColumn = columns.some(col => col.name === 'country_of_residence');
      if (!hasColumn) {
        db.run(addCountryOfResidence, (err) => {
          if (err) throw err;
          console.log('Added country_of_residence column to users table');
        });
      } else {
        console.log('country_of_residence column already exists');
      }
    });

    // Add new tables for roles, course assignments, and attendance
    const createTables = [
      `CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'student', 'instructor', 'teaching_assistant')),
        assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS course_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('instructor', 'teaching_assistant')),
        assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        session_date TEXT NOT NULL,
        student_id INTEGER NOT NULL,
        present INTEGER NOT NULL,
        marked_by INTEGER NOT NULL,
        marked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    createTables.forEach((query, idx) => {
      db.run(query, (err) => {
        if (err) {
          console.log(`Create table query ${idx + 1} result:`, err.message);
        } else {
          console.log(`Create table query ${idx + 1} executed successfully`);
        }
      });
    });

    // Add notifications table for in-app notifications
    const createNotificationsTable = `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`;
    db.run(createNotificationsTable, (err) => {
      if (err) {
        console.log('Create notifications table result:', err.message);
      } else {
        console.log('Notifications table created or already exists');
      }
    });

    // === MIGRATION: Add grade and completed columns to enrollments ===
    db.get("PRAGMA table_info(enrollments)", (err, columns) => {
      if (err) {
        console.error('Error checking enrollments table columns:', err);
        return;
      }
      const colNames = Array.isArray(columns) ? columns.map(col => col.name) : [];
      if (!colNames.includes('grade')) {
        db.run("ALTER TABLE enrollments ADD COLUMN grade VARCHAR(5)", (err) => {
          if (err) {
            console.error('Error adding grade column:', err);
          } else {
            console.log('Added grade column to enrollments table.');
          }
        });
      } else {
        console.log('grade column already exists in enrollments table.');
      }
      if (!colNames.includes('completed')) {
        db.run("ALTER TABLE enrollments ADD COLUMN completed TINYINT DEFAULT 0", (err) => {
          if (err) {
            console.error('Error adding completed column:', err);
          } else {
            console.log('Added completed column to enrollments table.');
          }
        });
      } else {
        console.log('completed column already exists in enrollments table.');
      }
    });
} 