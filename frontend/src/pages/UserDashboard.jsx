import React, { useState, useEffect, useContext } from 'react';
import { Card, Badge, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { FaEye, FaClock, FaCheck, FaTimes, FaGraduationCap } from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function UserDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/enrollments/my-enrollments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      
      const data = await response.json();
      setEnrollments(data);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to load your enrollments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'warning', icon: <FaClock />, text: 'Pending Review' },
      'approved': { variant: 'success', icon: <FaCheck />, text: 'Approved' },
      'rejected': { variant: 'danger', icon: <FaTimes />, text: 'Rejected' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || { variant: 'secondary', icon: <FaClock />, text: status };
    
    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1">
        {config.icon} {config.text}
      </Badge>
    );
  };

  const getStatusMessage = (status) => {
    const messages = {
      'pending': 'Your enrollment is being reviewed by our admin team. You will be notified once the review is complete.',
      'approved': 'Congratulations! Your enrollment has been approved. You can now access the course materials.',
      'rejected': 'Your enrollment was not approved. Please contact support for more information.'
    };
    
    return messages[status?.toLowerCase()] || 'Status unknown';
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <FaGraduationCap className="me-2" />
            My Enrollments
          </h2>
          
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {enrollments.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <h4>No Enrollments Yet</h4>
                <p className="text-muted">You haven't enrolled in any courses yet.</p>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Row>
              {enrollments.map((enrollment) => (
                <Col key={enrollment.id} lg={6} md={12} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title mb-0">{enrollment.course_title}</h5>
                        {getStatusBadge(enrollment.status)}
                      </div>
                      
                      <p className="text-muted mb-3">
                        {enrollment.course_description?.substring(0, 100)}...
                      </p>
                      
                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">Price:</small>
                          <br />
                          <strong>${enrollment.course_price}</strong>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Duration:</small>
                          <br />
                          <strong>{enrollment.course_duration} hours</strong>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <small className="text-muted">Enrolled:</small>
                        <br />
                        <strong>{new Date(enrollment.enrolled_at).toLocaleDateString()}</strong>
                      </div>
                      
                      <Alert variant="info" className="mb-3">
                        <small>{getStatusMessage(enrollment.status)}</small>
                      </Alert>
                      
                      {enrollment.status?.toLowerCase() === 'approved' && (
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => navigate(`/student`)}
                        >
                          <FaEye /> Access Course
                        </Button>
                      )}
                      
                      {enrollment.status?.toLowerCase() === 'rejected' && (
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => navigate('/contact')}
                          >
                            Contact Support
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => navigate('/courses')}
                          >
                            Browse Other Courses
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
