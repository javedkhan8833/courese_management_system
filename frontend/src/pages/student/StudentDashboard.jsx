import React, { useEffect, useState } from 'react';

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceModal, setAttendanceModal] = useState({ open: false, course: null });
  const [attendance, setAttendance] = useState([]);
  const [courseDetails, setCourseDetails] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({});
  const [message, setMessage] = useState('');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/student/courses', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch enrolled courses');
        setLoading(false);
      });
  }, []);

  // Fetch course details (grade, completed) and attendance for each course
  useEffect(() => {
    if (!courses.length) return;
    const fetchDetails = async () => {
      const details = {};
      const attMap = {};
      for (const c of courses) {
        try {
          // Fetch enrollment details
          const res = await fetch(`http://localhost:5000/api/enrollments?user_id=me&course_id=${c.id}`, { headers: getAuthHeaders() });
          const data = await res.json();
          details[c.id] = data && data.length ? data[0] : {};
          // Fetch attendance
          const attRes = await fetch(`http://localhost:5000/api/student/courses/${c.id}/attendance`, { headers: getAuthHeaders() });
          const attData = await attRes.json();
          const total = attData.length;
          const attended = attData.filter(a => a.present).length;
          attMap[c.id] = total ? (attended / total) * 100 : 0;
        } catch {
          details[c.id] = {};
          attMap[c.id] = 0;
        }
      }
      setCourseDetails(details);
      setAttendanceMap(attMap);
    };
    fetchDetails();
    // eslint-disable-next-line
  }, [courses]);

  const isEligible = (c) => {
    const d = courseDetails[c.id] || {};
    const grade = (d.grade || '').toUpperCase();
    return d.completed && grade && grade >= 'C' && (attendanceMap[c.id] || 0) >= 50;
  };

  const handleDownloadCertificate = async (c) => {
    try {
      const res = await fetch('http://localhost:5000/api/certificates/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: 'me', course_id: c.id })
      });
      if (!res.ok) throw new Error('Not eligible or error generating certificate');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${c.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Certificate downloaded.');
    } catch (err) {
      setMessage('Failed to download certificate: ' + err.message);
    }
  };

  // Open attendance modal
  const openAttendanceModal = (course) => {
    setAttendanceModal({ open: true, course });
    setAttendance([]);
    fetch(`http://localhost:5000/api/student/courses/${course.id}/attendance`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setAttendance(data))
      .catch(() => setAttendance([]));
  };

  return (
    <div>
      <h2>Student Dashboard</h2>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div>
          <h4>Enrolled Courses</h4>
          {courses.length === 0 ? (
            <div className="alert alert-info">No courses enrolled yet.</div>
          ) : (
            <>
              <ul className="list-group">
                {courses.map(course => (
                  <li key={course.id} className="list-group-item">
                    <strong>{course.title}</strong>
                    <div>{course.description}</div>
                    <div className="mt-2">
                      <button className="btn btn-sm btn-outline-info me-2" onClick={() => openAttendanceModal(course)}>View Attendance</button>
                      {isEligible(course) && (
                        <button className="btn btn-sm btn-success" onClick={() => handleDownloadCertificate(course)}>
                          Download Certificate
                        </button>
                      )}
                      {!isEligible(course) && (
                        <span className="text-muted small ms-2">No certificate available</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {message && <div className="alert alert-info mt-3">{message}</div>}
            </>
          )}
        </div>
      )}
      {/* Attendance Modal */}
      {attendanceModal.open && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Attendance - {attendanceModal.course.title}</h5>
                <button type="button" className="btn-close" onClick={() => setAttendanceModal({ open: false, course: null })}></button>
              </div>
              <div className="modal-body">
                {attendance.length === 0 ? (
                  <div className="alert alert-info">No attendance records found.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Present</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((rec, idx) => (
                          <tr key={idx}>
                            <td>{rec.session_date}</td>
                            <td>{rec.present ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAttendanceModal({ open: false, course: null })}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard; 