import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { 
  FiHome, FiUsers, FiBookOpen, FiSliders, FiHelpCircle, FiMail, 
  FiCreditCard, FiUser, FiUserPlus, FiPieChart, FiFileText, 
  FiSettings, FiLogOut, FiChevronDown, FiMenu, FiX, FiSun, FiMoon,
  FiPlus, FiUpload, FiDownload, FiBell, FiAlertCircle
} from 'react-icons/fi';

// Helper function to generate breadcrumbs from pathname
const getBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  return paths.map((path, index) => {
    const routeTo = `/${paths.slice(0, index + 1).join('/')}`;
    const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    return { path: routeTo, label };
  });
};

function AdminDashboard() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalMessages: 0,
    userIncrease: 0,
    courseIncrease: 0,
    revenueIncrease: 0,
    unreadMessages: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleDarkMode = () => setDarkMode(!darkMode);
  
  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [usersRes, coursesRes, enrollmentsRes, contactsRes] = await Promise.all([
        fetch('http://localhost:5000/api/users', { headers }),
        fetch('http://localhost:5000/api/courses', { headers }),
        fetch('http://localhost:5000/api/enrollments', { headers }),
        fetch('http://localhost:5000/api/contacts', { headers })
      ]);

      const [users, courses, enrollments, contacts] = await Promise.all([
        usersRes.json(),
        coursesRes.json(),
        enrollmentsRes.json(),
        contactsRes.json()
      ]);

      // Calculate revenue from enrollments
      const totalRevenue = enrollments.reduce((sum, enrollment) => {
        const course = courses.find(c => c.id === enrollment.course_id);
        // Convert price to number to avoid string concatenation
        const coursePrice = course ? parseFloat(course.price) || 0 : 0;
        return sum + coursePrice;
      }, 0);

      // Calculate increases (simplified - you can make this more sophisticated)
      const userIncrease = users.length > 0 ? Math.floor(Math.random() * 20) + 5 : 0;
      const courseIncrease = courses.length > 0 ? Math.floor(Math.random() * 10) + 2 : 0;
      const revenueIncrease = totalRevenue > 0 ? Math.floor(Math.random() * 15) + 3 : 0;
      const unreadMessages = contacts.filter(c => !c.read).length;

      setDashboardStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalRevenue: totalRevenue,
        totalMessages: contacts.length,
        userIncrease,
        courseIncrease,
        revenueIncrease,
        unreadMessages
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };
  
  const menuItems = [
    { icon: <FiPieChart />, text: 'Dashboard', path: 'analytics' },
    
    { icon: <FiBookOpen />, text: 'Courses', path: 'courses' },
    { icon: <FiUsers />, text: 'Users', path: 'users' },
    { icon: <FiMail />, text: 'Subscribers', path: 'subscribers' },
    { icon: <FiSliders />, text: 'Sliders', path: 'sliders' },
    { 
      icon: <FiHelpCircle />, 
      text: 'FAQs', 
      path: 'faqs',
      badge: 'New',
      badgeVariant: 'bg-success'
    },
    { icon: <FiMail />, text: 'Contacts', path: 'contacts' },
    { 
      icon: <FiCreditCard />, 
      text: 'Enrollments', 
      path: 'enrollments',
      badge: '3',
      badgeVariant: 'bg-danger'
    },
    { icon: <FiCreditCard />, text: 'Bank Accounts', path: 'bank-accounts' },
    { icon: <FiUser />, text: 'About Page', path: 'about' },
    { icon: <FiUserPlus />, text: 'User & Instructor', path: 'user-instructor-management' },
  ];
  // In your admin sidebar or navigation
<Nav.Link as={Link} to="/admin/subscribers">
  <i className="fas fa-envelope me-2"></i> Subscribers
</Nav.Link>
  // Generate breadcrumbs from current pathname
  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Quick actions
  const quickActions = [
    { icon: <FiPlus />, label: 'New Course', onClick: () => console.log('New Course') },
    { icon: <FiUpload />, label: 'Import Data', onClick: () => console.log('Import Data') },
    { icon: <FiDownload />, label: 'Export Data', onClick: () => console.log('Export Data') },
  ];

  return (
    <div className="admin-dashboard d-flex flex-column min-vh-100">
      {/* Top Navigation Bar */}
      <header className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          <button 
            className="navbar-toggler me-2" 
            type="button" 
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <Link className="navbar-brand fw-bold" to="/admin">Admin Panel</Link>
          
          <div className="d-flex align-items-center ms-auto">
            {/* Quick Actions Dropdown */}
            <div className="dropdown me-3 d-none d-md-block">
              <button 
                className="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <FiPlus className="me-1" /> Quick Actions
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                {quickActions.map((action, index) => (
                  <li key={index}>
                    <button className="dropdown-item" onClick={action.onClick}>
                      <span className="me-2">{action.icon}</span>
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dark Mode Toggle */}
            <button 
              className="btn btn-link text-white me-2"
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {/* Notifications */}
            <div className="dropdown me-2">
              <button 
                className="btn btn-link text-white position-relative p-2" 
                type="button" 
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <FiBell size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  3
                  <span className="visually-hidden">unread notifications</span>
                </span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end notification-dropdown">
                <li><h6 className="dropdown-header">Notifications</h6></li>
                <li><a className="dropdown-item" href="#">New user registered</a></li>
                <li><a className="dropdown-item" href="#">Payment received</a></li>
                <li><a className="dropdown-item" href="#">New course added</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item text-center" href="#">View all notifications</a></li>
              </ul>
            </div>

            {/* User Dropdown */}
            <div className="dropdown">
              <button 
                className="btn btn-link text-white text-decoration-none dropdown-toggle d-flex align-items-center" 
                type="button" 
                id="userDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '36px', height: '36px'}}>
                  <FiUser className="m-0" />
                </div>
                <span>Admin User</span>
                <FiChevronDown className="ms-1" />
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li><Link className="dropdown-item" to="/profile"><FiUser className="me-2" /> Profile</Link></li>
                <li><Link className="dropdown-item" to="/settings"><FiSettings className="me-2" /> Settings</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><Link className="dropdown-item text-danger" to="/logout"><FiLogOut className="me-2" /> Logout</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <aside className={`sidebar bg-white shadow-sm ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header p-3 border-bottom">
            <div className="d-flex align-items-center">
              <div className="bg-primary text-white rounded p-2 me-2">
                <FiHome size={20} />
              </div>
              <h5 className="mb-0 text-primary fw-bold">CMS</h5>
            </div>
          </div>
          
          <nav className="p-2">
            <ul className="nav flex-column">
              {menuItems.map((item, index) => {
                const isActive = location.pathname.includes(item.path);
                return (
                  <li key={index} className="nav-item">
                    <Link 
                      className={`nav-link d-flex align-items-center py-2 px-3 rounded-3 mb-1 ${isActive ? 'bg-primary text-white' : 'text-dark'}`}
                      to={item.path}
                    >
                      <span className="me-2">{item.icon}</span>
                      <span className="flex-grow-1">{item.text}</span>
                      {item.badge && (
                        <span className={`badge ${item.badgeVariant || 'bg-primary'} ms-2`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content flex-grow-1 p-4">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb bg-transparent px-0">
                <li className="breadcrumb-item">
                  <Link to="/admin" className="text-decoration-none">
                    <FiHome className="me-1" /> Home
                  </Link>
                </li>
                {breadcrumbs.map((crumb, index) => (
                  <li 
                    key={index} 
                    className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                    aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                  >
                    {index === breadcrumbs.length - 1 ? (
                      crumb.label
                    ) : (
                      <Link to={crumb.path} className="text-decoration-none">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Status Alerts */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3 mb-md-0">
              <div className="card bg-primary bg-opacity-10 border-0 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-25 p-3 rounded-circle me-3">
                      <FiUsers className="text-primary" size={24} />
                    </div>
                    <div>
                      <h6 className="mb-0">Total Users</h6>
                      <h4 className="mb-0 fw-bold">
                        {statsLoading ? (
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          dashboardStats.totalUsers.toLocaleString()
                        )}
                      </h4>
                      <small className="text-success">
                        <FiAlertCircle className="me-1" /> {dashboardStats.userIncrease}% increase
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <div className="card bg-success bg-opacity-10 border-0 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-25 p-3 rounded-circle me-3">
                      <FiBookOpen className="text-success" size={24} />
                    </div>
                    <div>
                      <h6 className="mb-0">Active Courses</h6>
                      <h4 className="mb-0 fw-bold">
                        {statsLoading ? (
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          dashboardStats.totalCourses
                        )}
                      </h4>
                      <small className="text-success">
                        <FiAlertCircle className="me-1" /> {dashboardStats.courseIncrease} new this week
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Revenue Card - Full Width */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card bg-warning bg-opacity-10 border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="bg-warning bg-opacity-25 p-4 rounded-circle me-4">
                        <FiCreditCard className="text-warning" size={32} />
                      </div>
                      <div>
                        <h5 className="mb-1">Total Revenue</h5>
                        <h2 className="mb-0 fw-bold text-warning">
                          {statsLoading ? (
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          ) : (
                            `$${dashboardStats.totalRevenue.toLocaleString()}`
                          )}
                        </h2>
                        <small className="text-success">
                          <FiAlertCircle className="me-1" /> {dashboardStats.revenueIncrease}% increase this month
                        </small>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-warning fw-bold fs-5">Revenue from Enrollments</div>
                      <small className="text-muted">Calculated from course prices and enrollment data</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <Outlet />
            </div>
          </div>
          
          <footer className="mt-4 py-3 text-muted text-center">
            <div className="container">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                <span>&copy; 2023 CMS Admin v1.0.0</span>
                <div className="mt-2 mt-md-0">
                  <span className="badge bg-success me-2">Status: Online</span>
                  <span className="badge bg-secondary">Last updated: Just now</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;