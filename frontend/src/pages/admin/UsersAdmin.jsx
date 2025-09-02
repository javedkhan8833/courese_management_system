import React, { useEffect, useState } from 'react';

function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', role: 'user' });
  const [message, setMessage] = useState('');
  const [viewUser, setViewUser] = useState(null); // For modal
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchUsers = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/users', {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch users');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    setEditingUser(null);
    setForm({ username: '', email: '', password: '', full_name: '', role: 'user' });
    setShowForm(true);
    setMessage('');
  };

  const handleEdit = user => {
    setEditingUser(user);
    setForm({ ...user, password: '' });
    setShowForm(true);
    setMessage('');
  };

  const handleDelete = id => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    fetch(`http://localhost:5000/api/users/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(() => {
        setMessage('User deleted');
        fetchUsers();
      })
      .catch(() => setMessage('Failed to delete user'));
  };

  const handleSubmit = e => {
    e.preventDefault();
    setMessage('');
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `http://localhost:5000/api/users/${editingUser.id}` : 'http://localhost:5000/api/users';
    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error || data.message?.toLowerCase().includes('error')) {
          setMessage(data.message || data.error);
        } else {
          setShowForm(false);
          setMessage(editingUser ? 'User updated' : 'User added');
          fetchUsers();
        }
      })
      .catch(() => setMessage('Failed to save user'));
  };

  // View user profile handler
  const handleView = (id) => {
    setViewLoading(true);
    setViewError('');
    setViewUser(null);
    fetch(`http://localhost:5000/api/users/${id}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (data.error || data.message?.toLowerCase().includes('not found')) {
          setViewError(data.message || data.error);
        } else {
          setViewUser(data);
        }
        setViewLoading(false);
      })
      .catch(() => {
        setViewError('Failed to fetch user profile');
        setViewLoading(false);
      });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Users</h2>
        <button className="btn btn-primary" onClick={handleAdd}>Add User</button>
      </div>
      {message && <div className="alert alert-info">{message}</div>}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="table-responsive">
          {users.length === 0 ? (
            <div className="text-center py-5">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No users found. Click "Add User" to create your first user account.
              </div>
            </div>
          ) : (
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.full_name || <span className="text-muted">-</span>}</td>
                    <td>{user.role}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button className="btn btn-sm btn-outline-info" title="View" onClick={() => handleView(user.id)}>
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-info" title="Edit" onClick={() => handleEdit(user)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => handleDelete(user.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingUser ? 'Edit User' : 'Add User'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input type="text" className="form-control" name="username" value={form.username} onChange={handleFormChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={form.email} onChange={handleFormChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" name="full_name" value={form.full_name} onChange={handleFormChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password {editingUser && <span className="text-muted">(leave blank to keep unchanged)</span>}</label>
                    <input type="password" className="form-control" name="password" value={form.password} onChange={handleFormChange} required={!editingUser} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select className="form-select" name="role" value={form.role} onChange={handleFormChange} required>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingUser ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* View User Modal */}
      {(viewUser || viewLoading || viewError) && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Profile</h5>
                <button type="button" className="btn-close" onClick={() => { setViewUser(null); setViewError(''); setViewLoading(false); }}></button>
              </div>
              <div className="modal-body">
                {viewLoading ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
                ) : viewError ? (
                  <div className="alert alert-danger">{viewError}</div>
                ) : viewUser && (
                  <div>
                    <div className="row mb-3">
                      <div className="col-md-4 text-center">
                        {viewUser.profile_picture ? (
                          <img src={viewUser.profile_picture.startsWith('/uploads/') ? `http://localhost:5000${viewUser.profile_picture}` : viewUser.profile_picture} alt="Profile" className="img-fluid rounded mb-2" style={{ maxHeight: 180 }} />
                        ) : (
                          <div className="text-muted">No picture</div>
                        )}
                      </div>
                      <div className="col-md-8">
                        <table className="table table-sm">
                          <tbody>
                            <tr><th>ID</th><td>{viewUser.id}</td></tr>
                            <tr><th>Username</th><td>{viewUser.username}</td></tr>
                            <tr><th>Email</th><td>{viewUser.email}</td></tr>
                            <tr><th>Role</th><td>{viewUser.role}</td></tr>
                            <tr><th>Full Name</th><td>{viewUser.full_name || <span className="text-muted">-</span>}</td></tr>
                            <tr><th>Gender</th><td>{viewUser.gender || <span className="text-muted">-</span>}</td></tr>
                            <tr><th>Phone</th><td>{viewUser.phone || <span className="text-muted">-</span>}</td></tr>
                            <tr><th>Date of Birth</th><td>{viewUser.dob || <span className="text-muted">-</span>}</td></tr>
                            <tr><th>Country</th><td>{viewUser.country || <span className="text-muted">-</span>}</td></tr>
                            <tr><th>City</th><td>{viewUser.city || <span className="text-muted">-</span>}</td></tr>
                            <tr><th>Street</th><td>{viewUser.street || <span className="text-muted">-</span>}</td></tr>
                            <tr><th>Postal Code</th><td>{viewUser.postal_code || <span className="text-muted">-</span>}</td></tr>
                            <tr><th>Country of Residence</th><td>{viewUser.country_of_residence || <span className="text-muted">-</span>}</td></tr>
                            <tr><th>Created At</th><td>{viewUser.created_at || <span className="text-muted">-</span>}</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setViewUser(null); setViewError(''); setViewLoading(false); }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersAdmin; 