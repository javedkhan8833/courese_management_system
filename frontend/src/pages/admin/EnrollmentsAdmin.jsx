import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Badge, Form, Card, Row, Col } from 'react-bootstrap';
import { FaEye, FaCheck, FaTimes, FaDownload, FaClock } from 'react-icons/fa';
import api from '../../config/api';

const EnrollmentsAdmin = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    status: 'All',
    user: '',
    course: '',
    search: ''
  });
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingStatus, setProcessingStatus] = useState(false);

  // Fetch enrollments
  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.status !== 'All') params.append('status', filters.status);
      if (filters.user) params.append('user', filters.user);
      if (filters.course) params.append('course', filters.course);
      if (filters.search) params.append('search', filters.search);
      
      console.log('Fetching enrollments with params:', params.toString());
      
      const response = await api.get(`/enrollments?${params.toString()}`);
      
      console.log('Enrollments response:', response.data);
      setEnrollments(response.data);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          setError(`Failed to fetch enrollments: ${err.response.data?.message || err.message}`);
        }
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Failed to fetch enrollments: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id, status) => {
    try {
      setProcessingStatus(true);
      await api.put(`/enrollments/${id}/status`, { 
        status,
        admin_notes: adminNotes 
      });
      setMessage(`Enrollment ${status.toLowerCase()} successfully`);
      setShowDetailsModal(false);
      setSelectedEnrollment(null);
      setAdminNotes('');
      fetchEnrollments();
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setProcessingStatus(false);
    }
  };

  // View enrollment details
  const handleViewDetails = async (enrollment) => {
    try {
      const response = await api.get(`/enrollments/${enrollment.id}`);
      setSelectedEnrollment(response.data);
      setShowDetailsModal(true);
    } catch (err) {
      setError('Failed to load enrollment details');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enrollment?')) return;
    try {
      await api.delete(`/enrollments/${id}`);
      setMessage('Enrollment deleted successfully');
      fetchEnrollments();
    } catch (err) {
      setError('Failed to delete enrollment');
    }
  };

  // Load data when filters change
  useEffect(() => {
    fetchEnrollments();
  }, [filters]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Enrollments</h2>
      
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <Form.Select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </div>
            <div className="col-md-3">
              <Form.Control
                placeholder="Filter by user..."
                value={filters.user}
                onChange={(e) => setFilters({...filters, user: e.target.value})}
              />
            </div>
            <div className="col-md-3">
              <Form.Control
                placeholder="Filter by course..."
                value={filters.course}
                onChange={(e) => setFilters({...filters, course: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Course</th>
                <th>Status</th>
                <th>Payment Proof</th>
                <th>Enrolled Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>{enrollment.id}</td>
                  <td>
                    <div>
                      <strong>{enrollment.full_name || enrollment.username}</strong>
                      <br />
                      <small className="text-muted">{enrollment.email}</small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{enrollment.course_title}</strong>
                      <br />
                      <small className="text-muted">
                        ${enrollment.course_price} • {enrollment.course_duration} hours
                      </small>
                    </div>
                  </td>
                  <td>
                    <Badge 
                      bg={{
                        'approved': 'success',
                        'pending': 'warning',
                        'rejected': 'danger'
                      }[enrollment.status?.toLowerCase()] || 'secondary'}
                    >
                      {enrollment.status}
                    </Badge>
                  </td>
                  <td>
                    {enrollment.payment_proof ? (
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleViewDetails(enrollment)}
                      >
                        <FaEye /> View Proof
                      </Button>
                    ) : (
                      <span className="text-muted">No proof</span>
                    )}
                  </td>
                  <td>
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => handleViewDetails(enrollment)}
                        title="View Details"
                      >
                        <FaEye />
                      </Button>
                      {enrollment.status?.toLowerCase() === 'pending' && (
                        <>
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handleViewDetails(enrollment)}
                            title="Approve"
                          >
                            <FaCheck />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleViewDetails(enrollment)}
                            title="Reject"
                          >
                            <FaTimes />
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(enrollment.id)}
                        title="Delete"
                      >
                        ×
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">
                    No enrollments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrollment Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedEnrollment(null);
          setAdminNotes('');
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Enrollment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEnrollment && (
            <div>
              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>Student Information</Card.Header>
                    <Card.Body>
                      <p><strong>Name:</strong> {selectedEnrollment.full_name}</p>
                      <p><strong>Email:</strong> {selectedEnrollment.email}</p>
                      <p><strong>Username:</strong> {selectedEnrollment.username}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>Course Information</Card.Header>
                    <Card.Body>
                      <p><strong>Course:</strong> {selectedEnrollment.course_title}</p>
                      <p><strong>Price:</strong> ${selectedEnrollment.course_price}</p>
                      <p><strong>Duration:</strong> {selectedEnrollment.course_duration} hours</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>Enrollment Details</Card.Header>
                    <Card.Body>
                      <p><strong>Status:</strong> 
                        <Badge 
                          bg={{
                            'approved': 'success',
                            'pending': 'warning',
                            'rejected': 'danger'
                          }[selectedEnrollment.status?.toLowerCase()] || 'secondary'}
                          className="ms-2"
                        >
                          {selectedEnrollment.status}
                        </Badge>
                      </p>
                      <p><strong>Enrolled Date:</strong> {new Date(selectedEnrollment.enrolled_at).toLocaleString()}</p>
                      <p><strong>Bank Account:</strong> {selectedEnrollment.bank_account || 'N/A'}</p>
                      {selectedEnrollment.admin_notes && (
                        <p><strong>Admin Notes:</strong> {selectedEnrollment.admin_notes}</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>Payment Proof</Card.Header>
                    <Card.Body>
                      {selectedEnrollment.payment_proof ? (
                        <div>
                          <img 
                            src={selectedEnrollment.payment_proof} 
                            alt="Payment Proof" 
                            className="img-fluid mb-2"
                            style={{ maxHeight: '200px' }}
                          />
                          <br />
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => window.open(selectedEnrollment.payment_proof, '_blank')}
                          >
                            <FaDownload /> View Full Size
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted">No payment proof uploaded</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {selectedEnrollment.status?.toLowerCase() === 'pending' && (
                <Card className="mb-3">
                  <Card.Header>Admin Actions</Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Admin Notes (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about this enrollment..."
                      />
                    </Form.Group>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="success" 
                        onClick={() => handleStatusUpdate(selectedEnrollment.id, 'approved')}
                        disabled={processingStatus}
                      >
                        <FaCheck /> Approve Enrollment
                      </Button>
                      <Button 
                        variant="danger" 
                        onClick={() => handleStatusUpdate(selectedEnrollment.id, 'rejected')}
                        disabled={processingStatus}
                      >
                        <FaTimes /> Reject Enrollment
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default EnrollmentsAdmin;