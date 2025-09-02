const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- USERS ---');
db.all('SELECT id, username, full_name, email FROM users', [], (err, rows) => {
  if (err) return console.error(err);
  rows.forEach(r => console.log(r));

  console.log('\n--- COURSES ---');
  db.all('SELECT id, title FROM courses', [], (err, rows) => {
    if (err) return console.error(err);
    rows.forEach(r => console.log(r));

    console.log('\n--- INSTRUCTORS/ASSISTANTS ---');
    db.all(`SELECT u.id, u.username, u.full_name FROM users u JOIN user_roles ur ON u.id = ur.user_id WHERE ur.role IN ('instructor', 'teaching_assistant')`, [], (err, rows) => {
      if (err) return console.error(err);
      rows.forEach(r => console.log(r));

      console.log('\n--- ENROLLMENTS ---');
      db.all(`SELECT e.id, e.user_id, u.username, e.course_id, c.title, e.completed, e.grade FROM enrollments e JOIN users u ON e.user_id = u.id JOIN courses c ON e.course_id = c.id`, [], (err, rows) => {
        if (err) return console.error(err);
        rows.forEach(r => console.log(r));
        db.close();
      });
    });
  });
}); 