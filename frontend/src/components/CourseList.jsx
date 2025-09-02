import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

const CourseList = ({ limit = 0 }) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState({});
  const [enrolled, setEnrolled] = useState([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const fetchUserEnrollments = async () => {
    if (!user) {
      setEnrolled([]);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/user/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEnrolled(data.map(enrollment => enrollment.course_id));
      }
    } catch (err) {
      console.error('Error fetching user enrollments:', err);
    }
  };

  useEffect(() => {
    axios.get('http://localhost:5000/api/courses')
      .then(response => {
        let coursesData = response.data;
        if (limit > 0) {
          coursesData = coursesData.slice(0, limit);
        }
        setCourses(coursesData);
        setFilteredCourses(coursesData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching courses:', error);
        setError('Failed to fetch courses. Please try again later.');
        setLoading(false);
      });
  }, [limit]);

  useEffect(() => {
    fetchUserEnrollments();
  }, [user]);

  const handleEnrollClick = (courseId) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    // Redirect to payment proof page with course ID
    navigate(`/payment-proof/${courseId}`);
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

  if (error) {
    return (
      <div className="py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h2 className="text-center mb-4">Featured Courses</h2>
      
      {message && <div className="alert alert-info text-center">{message}</div>}
      
      {showLoginPrompt && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          Please <a href="/login" className="alert-link">log in</a> or <a href="/register" className="alert-link">register</a> to enroll in courses.
          <button type="button" className="btn-close" onClick={() => setShowLoginPrompt(false)} aria-label="Close"></button>
        </div>
      )}
      
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {filteredCourses.map(course => (
          <div key={course.id} className="col">
            <div className="card h-100 shadow-sm border-0">
              <img
                src={course.image_url || 'https://via.placeholder.com/300x200'}
                className="card-img-top"
                alt={course.title}
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <div className="card-body">
                <h5 className="card-title">{course.title}</h5>
                <p className="card-text">{course.description}</p>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="badge bg-primary">{course.level}</span>
                  <span className="text-primary fw-bold">${course.price}</span>
                </div>
                
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => handleEnrollClick(course.id)}
                >
                  {enrolled.includes(course.id) 
                    ? 'Enrolled' 
                    : user 
                      ? 'Enroll Now'
                      : 'Log in to Enroll'}
                </button>
              </div>
              <div className="card-footer bg-white border-0">
                <small className="text-muted">Duration: {course.duration}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {limit > 0 && filteredCourses.length > 0 && (
        <div className="text-center mt-4">
          <a href="/courses" className="btn btn-link">View All Courses</a>
        </div>
      )}
    </div>
  );
};

export default CourseList;
