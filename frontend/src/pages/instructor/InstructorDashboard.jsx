import React, { useEffect, useState } from 'react';

function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceModal, setAttendanceModal] = useState({ open: false, course: null });
  const [historyModal, setHistoryModal] = useState({ open: false, course: null });
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]); // [{student_id, present}]
  const [sessionDate, setSessionDate] = useState('');
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [certModal, setCertModal] = useState({ open: false, course: null });
  const [certStudents, setCertStudents] = useState([]);
  const [certAttendance, setCertAttendance] = useState({});
  const [certMessage, setCertMessage] = useState('');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/instructor/courses', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch assigned courses');
        setLoading(false);
      });
  }, []);

  // Fetch students enrolled in a course
  const fetchStudents = (courseId) => {
    setStudents([]);
    fetch(`http://localhost:5000/api/courses/${courseId}/students`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setAttendance(data.map(s => ({ student_id: s.id, present: true })));
      })
      .catch(() => setStudents([]));
  };

  // Open attendance modal
  const openAttendanceModal = (course) => {
    setAttendanceModal({ open: true, course });
    setSessionDate('');
    setMessage('');
    fetchStudents(course.id);
  };

  // Handle attendance checkbox
  const handleAttendanceChange = (studentId) => {
    setAttendance(prev => prev.map(a => a.student_id === studentId ? { ...a, present: !a.present } : a));
  };

  // Submit attendance
  const handleSubmitAttendance = (e) => {
    e.preventDefault();
    if (!sessionDate) {
      setMessage('Please select a session date.');
      return;
    }
    fetch(`http://localhost:5000/api/instructor/courses/${attendanceModal.course.id}/attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ session_date: sessionDate, attendance })
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message || 'Attendance marked');
      })
      .catch(() => setMessage('Failed to mark attendance'));
  };

  // Fetch attendance history
  const openHistoryModal = (course) => {
    setHistoryModal({ open: true, course });
    setHistory([]);
    fetch(`http://localhost:5000/api/instructor/courses/${course.id}/attendance`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(() => setHistory([]));
  };

  // Fetch students and their details for certificate modal
  const openCertModal = async (course) => {
    setCertModal({ open: true, course });
    setCertStudents([]);
    setCertAttendance({});
    setCertMessage('');
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${course.id}/students`, { headers: getAuthHeaders() });
      const students = await res.json();
      // Fetch enrollment details and attendance for each student
      const details = [];
      const attMap = {};
      for (const s of students) {
        // Enrollment details
        const enrRes = await fetch(`http://localhost:5000/api/courses/${course.id}/students/${s.id}/enrollment`, { headers: getAuthHeaders() });
        const enrData = await enrRes.json();
        details.push({ ...s, ...enrData });
        // Attendance
        const attRes = await fetch(`http://localhost:5000/api/courses/${course.id}/students/${s.id}/attendance`, { headers: getAuthHeaders() });
        const attData = await attRes.json();
        const total = attData.length;
        const attended = attData.filter(a => a.present).length;
        attMap[s.id] = total ? (attended / total) * 100 : 0;
      }
      setCertStudents(details);
      setCertAttendance(attMap);
    } catch {
      setCertMessage('Failed to fetch student details.');
    }
  };

  const isEligible = (s) => {
    const grade = (s.grade || '').toUpperCase();
    const attendance = certAttendance[s.id] || 0;
    console.log('Eligibility check (instructor):', {
      id: s.id,
      completed: s.completed,
      grade,
      attendance
    });
    return s.completed && ['A','B','C'].includes(grade) && attendance >= 50;
  };

  const handleDownloadCertificate = async (s, course) => {
    try {
      const res = await fetch('http://localhost:5000/api/certificates/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: s.id, course_id: course.id })
      });
      if (!res.ok) throw new Error('Not eligible or error generating certificate');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${s.id}-${course.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setCertMessage('Certificate downloaded.');
    } catch (err) {
      setCertMessage('Failed to download certificate: ' + err.message);
    }
  };

  return (
    <div>
      <h2>Instructor Dashboard</h2>
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
          <h4>Assigned Courses</h4>
          {courses.length === 0 ? (
            <div className="alert alert-info">No courses assigned yet.</div>
          ) : (
            <ul className="list-group">
              {courses.map(course => (
                <li key={course.id} className="list-group-item">
                  <strong>{course.title}</strong> <span className="badge bg-secondary ms-2">{course.assignment_role.replace('_', ' ')}</span>
                  <div>{course.description}</div>
                  <div className="mt-2">
                    <button className="btn btn-sm btn-primary me-2" onClick={() => openAttendanceModal(course)}>Mark Attendance</button>
                    <button className="btn btn-sm btn-outline-info me-2" onClick={() => openHistoryModal(course)}>View Attendance History</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {/* Attendance Modal */}
      {attendanceModal.open && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Mark Attendance - {attendanceModal.course.title}</h5>
                <button type="button" className="btn-close" onClick={() => setAttendanceModal({ open: false, course: null })}></button>
              </div>
              <form onSubmit={handleSubmitAttendance}>
                <div className="modal-body">
                  {message && <div className="alert alert-info">{message}</div>}
                  <div className="mb-3">
                    <label className="form-label">Session Date</label>
                    <input type="date" className="form-control" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Students</label>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Present</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(s => (
                            <tr key={s.id}>
                              <td>{s.full_name || s.username}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={attendance.find(a => a.student_id === s.id)?.present || false}
                                  onChange={() => handleAttendanceChange(s.id)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">Submit Attendance</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setAttendanceModal({ open: false, course: null })}>Close</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Attendance History Modal */}
      {historyModal.open && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Attendance History - {historyModal.course.title}</h5>
                <button type="button" className="btn-close" onClick={() => setHistoryModal({ open: false, course: null })}></button>
              </div>
              <div className="modal-body">
                {history.length === 0 ? (
                  <div className="alert alert-info">No attendance records found.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Student</th>
                          <th>Present</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((rec, idx) => (
                          <tr key={idx}>
                            <td>{rec.session_date}</td>
                            <td>{rec.student_id}</td>
                            <td>{rec.present ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setHistoryModal({ open: false, course: null })}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorDashboard; 