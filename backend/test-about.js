const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Testing About table...');

// Check if about table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='about'", (err, row) => {
  if (err) {
    console.error('Error checking about table:', err);
    return;
  }
  
  if (row) {
    console.log('✓ About table exists');
    
    // Check if there's content in the about table
    db.get("SELECT content FROM about WHERE id = 1", (err, row) => {
      if (err) {
        console.error('Error reading about content:', err);
        return;
      }
      
      if (row) {
        console.log('✓ About content exists');
        console.log('Content length:', row.content.length);
        console.log('Content preview:', row.content.substring(0, 100) + '...');
      } else {
        console.log('✗ No about content found');
        
        // Insert initial content
        const initialContent = '<h2>Welcome to Our Learning Platform</h2><p>This is the initial content for the About page. You can edit this content using the rich text editor above.</p><p>Feel free to add images, videos, and other media to make your About page more engaging!</p>';
        db.run("INSERT INTO about (id, content) VALUES (1, ?)", [initialContent], function(err) {
          if (err) {
            console.error('Error inserting initial content:', err);
          } else {
            console.log('✓ Initial about content inserted');
          }
          db.close();
        });
      }
    });
  } else {
    console.log('✗ About table does not exist');
    db.close();
  }
}); 