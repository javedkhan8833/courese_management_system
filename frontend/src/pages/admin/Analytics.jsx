import React, { useEffect, useState } from 'react';

function Analytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalContacts: 0,
    recentEnrollments: [],
    recentContacts: [],
    courseStats: []
  });
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [usersRes, coursesRes, enrollmentsRes, contactsRes] = await Promise.all([
        fetch('http://localhost:5000/api/users', { headers: getAuthHeaders() }),
        fetch('http://localhost:5000/api/courses', { headers: getAuthHeaders() }),
        fetch('http://localhost:5000/api/enrollments', { headers: getAuthHeaders() }),
        fetch('http://localhost:5000/api/contacts', { headers: getAuthHeaders() })
      ]);

      const [users, courses, enrollments, contacts] = await Promise.all([
        usersRes.json(),
        coursesRes.json(),
        enrollmentsRes.json(),
        contactsRes.json()
      ]);

             // Calculate course popularity
       const courseStats = courses.map(course => {
         const enrollmentsForCourse = enrollments.filter(e => e.course_id === course.id);
         // Convert price to number to avoid string concatenation
         const coursePrice = parseFloat(course.price) || 0;
         return {
           id: course.id,
           title: course.title,
           enrollments: enrollmentsForCourse.length,
           revenue: enrollmentsForCourse.length * coursePrice
         };
       }).sort((a, b) => b.enrollments - a.enrollments);

      setStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalEnrollments: enrollments.length,
        totalContacts: contacts.length,
        recentEnrollments: enrollments.slice(0, 5),
        recentContacts: contacts.slice(0, 5),
        courseStats: courseStats.slice(0, 5)
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Dashboard Analytics</h2>
      
             {/* Statistics Cards */}
       <div className="row mb-4">
         <div className="col-md-4 mb-3">
           <div className="card bg-primary text-white">
             <div className="card-body">
               <div className="d-flex justify-content-between">
                 <div>
                   <h4 className="card-title">{stats.totalUsers}</h4>
                   <p className="card-text">Total Users</p>
                 </div>
                 <div className="align-self-center">
                   <i className="fas fa-users fa-2x"></i>
                 </div>
               </div>
             </div>
           </div>
         </div>
         
         <div className="col-md-4 mb-3">
           <div className="card bg-success text-white">
             <div className="card-body">
               <div className="d-flex justify-content-between">
                 <div>
                   <h4 className="card-title">{stats.totalCourses}</h4>
                   <p className="card-text">Total Courses</p>
                 </div>
                 <div className="align-self-center">
                   <i className="fas fa-book fa-2x"></i>
                 </div>
               </div>
             </div>
           </div>
         </div>
         
         <div className="col-md-4 mb-3">
           <div className="card bg-info text-white">
             <div className="card-body">
               <div className="d-flex justify-content-between">
                 <div>
                   <h4 className="card-title">{stats.totalEnrollments}</h4>
                   <p className="card-text">Total Enrollments</p>
                 </div>
                 <div className="align-self-center">
                   <i className="fas fa-graduation-cap fa-2x"></i>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>

       {/* Revenue Card - Full Width */}
       <div className="row mb-4">
         <div className="col-12">
           <div className="card bg-warning text-white">
             <div className="card-body">
               <div className="d-flex justify-content-between align-items-center">
                 <div className="d-flex align-items-center">
                   <div className="bg-warning bg-opacity-25 p-4 rounded-circle me-4">
                     <i className="fas fa-dollar-sign fa-3x text-warning"></i>
                   </div>
                   <div>
                     <h4 className="mb-1">Total Revenue</h4>
                     <h2 className="mb-0 fw-bold">
                       ${stats.courseStats.reduce((total, course) => total + course.revenue, 0).toLocaleString()}
                     </h2>
                     <small className="text-warning-50">Revenue from course enrollments</small>
                   </div>
                 </div>
                 <div className="text-end">
                   <div className="fw-bold fs-5">Revenue Breakdown</div>
                   <small className="text-warning-50">Calculated from course prices and enrollment data</small>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>

      <div className="row">
        {/* Popular Courses */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Most Popular Courses</h5>
            </div>
            <div className="card-body">
              {stats.courseStats.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.courseStats.map((course, index) => (
                    <div key={course.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{course.title}</h6>
                        <small className="text-muted">{course.enrollments} enrollments</small>
                      </div>
                      <span className="badge bg-primary rounded-pill">
                        ${course.revenue}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No course data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Recent Enrollments</h5>
            </div>
            <div className="card-body">
              {stats.recentEnrollments.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.recentEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{enrollment.username}</h6>
                          <small className="text-muted">{enrollment.title}</small>
                        </div>
                        <small className="text-muted">
                          {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No recent enrollments</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Recent Contact Messages</h5>
            </div>
            <div className="card-body">
              {stats.recentContacts.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.recentContacts.map((contact) => (
                    <div key={contact.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{contact.name}</h6>
                          <small className="text-muted">{contact.email}</small>
                          <p className="mb-1 small">{contact.message.substring(0, 50)}...</p>
                        </div>
                        <small className="text-muted">
                          {new Date(contact.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No recent contact messages</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-primary" onClick={() => window.location.href = '/admin/courses'}>
                  Add New Course
                </button>
                <button className="btn btn-success" onClick={() => window.location.href = '/admin/users'}>
                  Add New User
                </button>
                <button className="btn btn-info" onClick={() => window.location.href = '/admin/faqs'}>
                  Manage FAQs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics; 