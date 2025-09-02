const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Force-updating all enrollments to completed=1, grade="B", and adding attendance...');
db.all('SELECT id, user_id, course_id FROM enrollments', [], (err, enrollments) => {
  if (err) return console.error(err);
  let pending = enrollments.length;
  enrollments.forEach(e => {
    // Mark as completed with grade B
    db.run('UPDATE enrollments SET completed = 1, grade = ? WHERE id = ?', ['B', e.id], err => {
      if (err) return console.error('Error updating enrollment', e.id, err);
      // Remove old attendance for this student/course
      db.run('DELETE FROM attendance WHERE course_id = ? AND student_id = ?', [e.course_id, e.user_id], err2 => {
        if (err2) console.error('Error deleting old attendance', err2);
        // Insert 4 attendance records: 2 present, 2 absent
        const dates = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04'];
        dates.forEach((date, i) => {
          // Delete any existing attendance for this course/student/date
          db.run('DELETE FROM attendance WHERE course_id = ? AND student_id = ? AND session_date = ?', [e.course_id, e.user_id, date], () => {
            db.run('INSERT INTO attendance (course_id, session_date, student_id, present, marked_by) VALUES (?, ?, ?, ?, ?)',
              [e.course_id, date, e.user_id, i < 2 ? 1 : 0, 3], err3 => {
                if (err3 && !String(err3).includes('UNIQUE')) console.error('Attendance insert error', err3);
              });
          });
        });
        console.log(`Enrollment ${e.id} updated and attendance reset.`);
        if (--pending === 0) {
          setTimeout(() => {
            console.log('All enrollments updated.');
            db.close();
          }, 1000);
        }
      });
    });
  });
}); 