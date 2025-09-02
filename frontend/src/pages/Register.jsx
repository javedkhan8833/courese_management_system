import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    full_name: '',
    role: 'student' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { returnTo, enrollCourseId } = location.state || {};

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Registration failed');
      } else {
        setSuccess('Registration successful! Logging you in...');
        // Auto-login after registration
        const loginRes = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: form.username, password: form.password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.token) {
          localStorage.setItem('token', loginData.token);
          setUser({ ...loginData.user, token: loginData.token });
          
          // If we have an enrollCourseId, redirect to profile with that info
          if (enrollCourseId) {
            setSuccess('Welcome! Please complete your profile to enroll in the course.');
            setTimeout(() => {
              navigate('/profile', { 
                state: { 
                  justRegistered: true,
                  message: 'Please complete your profile to enroll in the course',
                  returnTo: returnTo || '/courses',
                  enrollCourseId
                }
              });
            }, 1500);
          } else {
            // Otherwise, just go to profile
            setSuccess(`Welcome, ${loginData.user.username}! Redirecting to your profile...`);
            setTimeout(() => {
              navigate('/profile', { state: { justRegistered: true } });
            }, 1500);
          }
        } else {
          setSuccess('Registration successful! Please log in.');
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h2 className="mb-4 text-center">Register</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register; 