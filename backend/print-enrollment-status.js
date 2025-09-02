const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- ENROLLMENT STATUS ---');
db.all(`SELECT e.id, e.user_id, u.username, e.course_id, c.title, e.completed, e.grade
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id`, [], (err, enrollments) => {
  if (err) return console.error(err);
  let pending = enrollments.length;
  enrollments.forEach(e => {
    db.all('SELECT present FROM attendance WHERE course_id = ? AND student_id = ?', [e.course_id, e.user_id], (err2, attRows) => {
      if (err2) return console.error(err2);
      const total = attRows.length;
      const attended = attRows.filter(a => a.present).length;
      const pct = total ? (attended / total) * 100 : 0;
      console.log({
        enrollment_id: e.id,
        user: e.username,
        course: e.title,
        completed: e.completed,
        grade: e.grade,
        attendance_percent: pct.toFixed(1) + '%',
        attendance_records: total
      });
      if (--pending === 0) db.close();
    });
  });
}); 