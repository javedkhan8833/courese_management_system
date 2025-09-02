const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to SQLite database');
    checkDatabase();
});

function checkDatabase() {
    console.log('Checking database schema...');
    
    // Check courses table structure
    db.all("PRAGMA table_info(courses)", (err, columns) => {
        if (err) {
            console.error('Error checking table structure:', err);
            db.close();
            return;
        }
        
        console.log('Courses table columns:');
        columns.forEach(col => {
            console.log(`- ${col.name} (${col.type})`);
        });
        
        // Check if our new columns exist
        const hasEnrollmentLimit = columns.some(col => col.name === 'enrollment_limit');
        const hasIsVisible = columns.some(col => col.name === 'is_visible');
        
        console.log('\nColumn check results:');
        console.log(`enrollment_limit exists: ${hasEnrollmentLimit}`);
        console.log(`is_visible exists: ${hasIsVisible}`);
        
        if (!hasEnrollmentLimit || !hasIsVisible) {
            console.log('\nAdding missing columns...');
            addMissingColumns(hasEnrollmentLimit, hasIsVisible);
        } else {
            console.log('\nAll columns exist!');
            db.close();
        }
    });
}

function addMissingColumns(hasEnrollmentLimit, hasIsVisible) {
    const queries = [];
    
    if (!hasEnrollmentLimit) {
        queries.push("ALTER TABLE courses ADD COLUMN enrollment_limit INTEGER DEFAULT 0");
    }
    
    if (!hasIsVisible) {
        queries.push("ALTER TABLE courses ADD COLUMN is_visible INTEGER DEFAULT 1");
    }
    
    let completed = 0;
    
    queries.forEach((query, index) => {
        db.run(query, (err) => {
            if (err) {
                console.log(`Error adding column ${index + 1}:`, err.message);
            } else {
                console.log(`Successfully added column ${index + 1}`);
            }
            
            completed++;
            if (completed === queries.length) {
                console.log('Database update completed!');
                
                // Update existing courses to be visible
                db.run("UPDATE courses SET is_visible = 1 WHERE is_visible IS NULL", (err) => {
                    if (err) {
                        console.log('Error updating existing courses:', err.message);
                    } else {
                        console.log('Updated existing courses to be visible');
                    }
                    db.close();
                });
            }
        });
    });
}

function setAllCoursesVisible() {
    db.run("UPDATE courses SET is_visible = 1", (err) => {
        if (err) {
            console.error('Error updating courses:', err);
        } else {
            console.log('All courses set to visible!');
        }
        db.close();
    });
} 