import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import Contact from './pages/Contact';
import FAQs from './pages/FAQs';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import CoursesAdmin from './pages/admin/CoursesAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import FAQsAdmin from './pages/admin/FAQsAdmin';
import ContactsAdmin from './pages/admin/ContactsAdmin';
import SlidersAdmin from './pages/admin/SlidersAdmin';
import EnrollmentsAdmin from './pages/admin/EnrollmentsAdmin';
import Analytics from './pages/admin/Analytics';
import BankAccountsAdmin from './pages/admin/BankAccountsAdmin';
import PaymentProofForm from './pages/PaymentProofForm';
import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import logo from './assets/logo_transparent.png';
import AboutAdmin from './pages/admin/AboutAdmin';
import UserInstructorManagement from './pages/admin/UserInstructorManagement';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import { FaBell } from 'react-icons/fa';

import SubscribersAdmin from './pages/admin/SubscribersAdmin';
import UserDashboard from './pages/UserDashboard';
import 'react-toastify/dist/ReactToastify.css';
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  console.log('AdminRoute - user:', user);
  console.log('AdminRoute - loading:', loading);
  console.log('AdminRoute - user role:', user?.role);
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    console.log('AdminRoute - redirecting to login');
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef();

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          const notificationsArray = Array.isArray(data) ? data : [];
          setNotifications(notificationsArray);
          setUnreadCount(notificationsArray.filter(n => !n.is_read).length);
        });
    }
  }, [user, showDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const markAsRead = (id) => {
    fetch(`http://localhost:5000/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(() => {
        setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        setUnreadCount(count => Math.max(0, count - 1));
      });
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Full-width, sticky navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img src={logo} alt="Company Logo" style={{ height: '40px', width: 'auto' }} />
          </Link>
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/about">About</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/courses">Courses</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/contact">Contact</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/faqs">FAQs</Link>
              </li>
              {user ? (
                <>
                  <li className="nav-item">
                    <span className="nav-link text-decoration-underline">
                      {user.username ? capitalizeFirst(user.username) : user.email}
                    </span>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/dashboard">My Enrollments</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/profile">Profile</Link>
                  </li>
                  {user.role === 'admin' && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin">Admin Dashboard</Link>
                    </li>
                  )}
                  {user.roles && (user.roles.includes('instructor') || user.roles.includes('teaching_assistant')) && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/instructor">Instructor Dashboard</Link>
                    </li>
                  )}
                  {user.roles && user.roles.includes('student') && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/student">Student Dashboard</Link>
                    </li>
                  )}
                  <li className="nav-item position-relative" ref={bellRef} style={{ cursor: 'pointer' }}>
                    <span className="nav-link d-flex align-items-center justify-content-center position-relative p-0" style={{ minWidth: 48, height: 48 }} onClick={() => setShowDropdown(v => !v)}>
                      <FaBell size={20} />
                      {unreadCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.7rem', zIndex: 2 }}>
                          {unreadCount}
                        </span>
                      )}
                    </span>
                    {showDropdown && (
                      <div className="dropdown-menu dropdown-menu-end show p-0 mt-2 shadow" style={{ right: 0, left: 'auto', minWidth: 320, maxWidth: 350, maxHeight: 400, overflowY: 'auto', zIndex: 9999 }}>
                        <div className="list-group list-group-flush">
                          {notifications.length === 0 ? (
                            <div className="list-group-item text-center text-muted">No notifications</div>
                          ) : notifications.map(n => (
                            <div
                              key={n.id}
                              className={`list-group-item d-flex justify-content-between align-items-center ${n.is_read ? '' : 'bg-light fw-bold'}`}
                              style={{ cursor: 'pointer', wordBreak: 'break-word' }}
                              onClick={() => markAsRead(n.id)}
                            >
                              <span>{n.message}</span>
                              {!n.is_read && <span className="badge bg-primary ms-2">New</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-link nav-link" onClick={logout}>Logout</button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">Register</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

        {/* Main content always inside a single .container for consistent spacing */}
        <main className="py-4" style={{ flex: '1 0 auto' }}>
          <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin/*" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }>
              <Route index element={<div className="p-4"><h2>Welcome to Admin Dashboard</h2><p>Select an option from the sidebar to manage your system.</p></div>} />
              <Route path="analytics" element={<Analytics />} />
              
              <Route path="courses" element={<CoursesAdmin />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="faqs" element={<FAQsAdmin />} />
              <Route path="contacts" element={<ContactsAdmin />} />
              <Route path="sliders" element={<SlidersAdmin />} />
              <Route path="enrollments" element={<EnrollmentsAdmin />} />
              <Route path="bank-accounts" element={<BankAccountsAdmin />} />
              <Route path="about" element={<AboutAdmin />} />
              <Route path="subscribers" element={<SubscribersAdmin />} />
              <Route path="user-instructor-management" element={<UserInstructorManagement />} />
            </Route>
            <Route path="/instructor" element={<ProtectedRoute><InstructorDashboard /></ProtectedRoute>} />
            <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/payment-proof/:courseId" element={<ProtectedRoute><PaymentProofForm /></ProtectedRoute>} />
          </Routes>
          </div>
        </main>

        {/* Full-width footer */}
        <footer className="bg-dark text-light py-4 w-100" style={{ flexShrink: 0 }}>
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-6">
                <h5>Course Management System</h5>
                <p>Your gateway to quality education</p>
              </div>
              <div className="col-md-6 text-md-end">
                <p>&copy; {new Date().getFullYear()} Course Management. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
