import React, { useEffect, useState } from 'react';

const ROLES = ['admin', 'student', 'instructor', 'teaching_assistant'];

function UserInstructorManagement() {
  const [users, setUsers] = useState([]);
  const [rolesMap, setRolesMap] = useState({}); // { userId: [roles] }
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignRole, setAssignRole] = useState('instructor');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // Fetch users and their roles
  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/api/users', { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Ensure data is an array
        const usersArray = Array.isArray(data) ? data : [];
        setUsers(usersArray);
        
        // Fetch roles for each user
        if (usersArray.length > 0) {
          Promise.all(
            usersArray.map(user =>
              fetch(`http://localhost:5000/api/user-roles/${user.id}`, { headers: getAuthHeaders() })
                .then(res => {
                  if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                  }
                  return res.json();
                })
                .then(roles => [user.id, Array.isArray(roles) ? roles : []])
                .catch(error => {
                  console.error(`Error fetching roles for user ${user.id}:`, error);
                  return [user.id, []];
                })
            )
          ).then(results => {
            const map = {};
            results.forEach(([userId, roles]) => { map[userId] = roles; });
            setRolesMap(map);
            setLoading(false);
          }).catch(error => {
            console.error('Error fetching user roles:', error);
            setRolesMap({});
            setLoading(false);
          });
        } else {
          setRolesMap({});
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
        setMessage('Failed to fetch users');
        setUsers([]);
        setRolesMap({});
        setLoading(false);
      });
  }, []);

  // Fetch courses
  useEffect(() => {
    fetch('http://localhost:5000/api/admin/courses', { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Ensure data is an array
        const coursesArray = Array.isArray(data) ? data : [];
        setCourses(coursesArray);
      })
      .catch((error) => {
        console.error('Error fetching courses:', error);
        setMessage('Failed to fetch courses');
        setCourses([]); // Ensure courses is always an array
      });
  }, []);

  // Fetch assignments
  const fetchAssignments = () => {
    fetch('http://localhost:5000/api/course-assignments', { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Ensure data is an array
        const assignmentsArray = Array.isArray(data) ? data : [];
        setAssignments(assignmentsArray);
      })
      .catch((error) => {
        console.error('Error fetching assignments:', error);
        setMessage('Failed to fetch assignments');
        setAssignments([]); // Ensure assignments is always an array
      });
  };
  useEffect(() => { fetchAssignments(); }, []);

  // Assign course to user
  const handleAssignCourse = (e) => {
    e.preventDefault();
    if (!assignUserId || !assignCourseId || !assignRole) return;
    
    setMessage('Assigning course...');
    
    fetch('http://localhost:5000/api/course-assignments', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id: assignUserId, course_id: assignCourseId, role: assignRole })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errorData => {
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        setMessage(data.message || 'Course assigned successfully');
        fetchAssignments();
        // Reset form
        setAssignUserId('');
        setAssignCourseId('');
        setAssignRole('instructor');
      })
      .catch((error) => {
        console.error('Error assigning course:', error);
        setMessage(error.message || 'Failed to assign course');
      });
  };

  // Handle role checkbox change
  const handleRoleChange = (userId, role) => {
    setRolesMap(prev => {
      const userRoles = prev[userId] || [];
      return {
        ...prev,
        [userId]: userRoles.includes(role)
          ? userRoles.filter(r => r !== role)
          : [...userRoles, role]
      };
    });
  };

  // Save roles for a user
  const handleSaveRoles = (userId) => {
    setMessage('');
    fetch(`http://localhost:5000/api/users/${userId}/roles`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ roles: rolesMap[userId] })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errorData => {
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        setMessage(data.message || 'Roles updated successfully');
      })
      .catch((error) => {
        console.error('Error updating roles:', error);
        setMessage(error.message || 'Failed to update roles');
      });
  };

  // Filter users for instructor/TA roles
  const eligibleUsers = (Array.isArray(users) ? users : []).filter(u => {
    const roles = rolesMap[u.id] || [];
    return roles.includes('instructor') || roles.includes('teaching_assistant');
  });

  return (
    <div>
      <h2>User & Instructor Management</h2>
      {message && <div className="alert alert-info">{message}</div>}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          {(!users || users.length === 0) ? (
            <div className="text-center py-5">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No users found. Users will appear here once they register on the platform.
              </div>
            </div>
          ) : (
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(users) ? users : []).map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      {ROLES.map(role => (
                        <label key={role} className="me-2">
                          <input
                            type="checkbox"
                            checked={rolesMap[user.id]?.includes(role) || false}
                            onChange={() => handleRoleChange(user.id, role)}
                          />{' '}{role.replace('_', ' ')}
                        </label>
                      ))}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleSaveRoles(user.id)}>
                        Save Roles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <hr className="my-4" />
      <h3>Assign Course to Instructor/Teaching Assistant</h3>
      <form className="row g-2 align-items-end" onSubmit={handleAssignCourse}>
        <div className="col-md-3">
          <label className="form-label">User</label>
          <select className="form-select" value={assignUserId} onChange={e => setAssignUserId(e.target.value)} required>
            <option value="">Select user</option>
            {(Array.isArray(eligibleUsers) ? eligibleUsers : []).map(u => (
              <option key={u.id} value={u.id}>{u.username} ({rolesMap[u.id]?.join(', ')})</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Course</label>
          <select className="form-select" value={assignCourseId} onChange={e => setAssignCourseId(e.target.value)} required>
            <option value="">Select course</option>
            {(Array.isArray(courses) ? courses : []).map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Role</label>
          <select className="form-select" value={assignRole} onChange={e => setAssignRole(e.target.value)} required>
            <option value="instructor">Instructor</option>
            <option value="teaching_assistant">Teaching Assistant</option>
          </select>
        </div>
        <div className="col-md-3">
          <button className="btn btn-success w-100" type="submit">Assign</button>
        </div>
      </form>
      <div className="mt-4">
        <h4>Current Assignments</h4>
        <div className="table-responsive">
          {(!assignments || assignments.length === 0) ? (
            <div className="text-center py-5">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No course assignments found. Use the form above to assign users to courses as instructors or teaching assistants.
              </div>
            </div>
          ) : (
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Course</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(assignments) ? assignments : []).map(a => (
                  <tr key={a.id}>
                    <td>{(Array.isArray(users) ? users : []).find(u => u.id === a.user_id)?.username || a.user_id}</td>
                    <td>{(Array.isArray(courses) ? courses : []).find(c => c.id === a.course_id)?.title || a.course_id}</td>
                    <td>{a.role.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserInstructorManagement; 