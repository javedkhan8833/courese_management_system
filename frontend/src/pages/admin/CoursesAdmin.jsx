import React, { useEffect, useState } from 'react';

function CoursesAdmin() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    price: '', 
    duration: '', 
    level: '', 
    image_url: '',
    enrollment_limit: 0,
    is_visible: true
  });
  const [message, setMessage] = useState('');
  const [viewCourse, setViewCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [courseStats, setCourseStats] = useState([]);
  const [showStats, setShowStats] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchCourses = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/admin/courses', {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('Access denied. Please check your permissions.');
          } else if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          } else {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data);
          setFilteredCourses(data);
        } else {
          setCourses([]);
          setFilteredCourses([]);
          setError('Invalid data format received');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching courses:', error);
        setError(error.message || 'Failed to fetch courses');
        setCourses([]);
        setFilteredCourses([]);
        setLoading(false);
      });
  };

  const fetchCourseStats = () => {
    fetch('http://localhost:5000/api/admin/course-stats', {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('Access denied. Please check your permissions.');
          } else if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          } else {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCourseStats(data);
        } else {
          setCourseStats([]);
          setMessage('Invalid data format received for course statistics');
        }
      })
      .catch((error) => {
        console.error('Error fetching course stats:', error);
        setMessage(error.message || 'Failed to fetch course statistics');
        setCourseStats([]);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses based on search term
  useEffect(() => {
    let filtered = courses;

    if (searchTerm) {
      filtered = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.level.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
    setCurrentPage(1); // Reset to first page when searching
  }, [courses, searchTerm]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  const handleFormChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setForm({ title: '', description: '', price: '', duration: '', level: '', image_url: '', enrollment_limit: 0, is_visible: true });
    setShowForm(true);
    setMessage('');
  };

  const handleEdit = course => {
    setEditingCourse(course);
    setForm({ ...course });
    setShowForm(true);
    setMessage('');
  };

  const handleDelete = id => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    fetch(`http://localhost:5000/api/courses/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(() => {
        setMessage('Course deleted');
        fetchCourses();
      })
      .catch(() => setMessage('Failed to delete course'));
  };

  const handleSubmit = e => {
    e.preventDefault();
    setMessage('');
    const method = editingCourse ? 'PUT' : 'POST';
    const url = editingCourse ? `http://localhost:5000/api/courses/${editingCourse.id}` : 'http://localhost:5000/api/courses';
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
          setMessage(editingCourse ? 'Course updated' : 'Course added');
          fetchCourses();
        }
      })
      .catch(() => setMessage('Failed to save course'));
  };

  // File upload functions
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setForm(prev => ({ ...prev, image_url: data.url }));
        setMessage('Image uploaded successfully!');
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Upload failed');
      }
    } catch (error) {
      setMessage('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Courses</h2>
        <div>
          <button className="btn btn-info me-2" onClick={() => {
            setShowStats(!showStats);
            if (!showStats) {
              fetchCourseStats();
            }
          }}>
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>Add Course</button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search courses by title, description, or level..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <p className="text-muted mb-0">
            Showing {filteredCourses.length} of {courses.length} courses
          </p>
        </div>
      </div>

      {/* Course Statistics View */}
      {showStats && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Course Enrollment Statistics</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Enrollment Limit</th>
                    <th>Current Enrollments</th>
                    <th>Status</th>
                    <th>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {courseStats.map(stat => (
                    <tr key={stat.id}>
                      <td>{stat.title}</td>
                      <td>
                        {stat.enrollment_limit === 0 ? (
                          <span className="text-muted">Unlimited</span>
                        ) : (
                          stat.enrollment_limit
                        )}
                      </td>
                      <td>{stat.current_enrollments}</td>
                      <td>
                        {stat.enrollment_status === 'FULL' && (
                          <span className="badge bg-danger">Full</span>
                        )}
                        {stat.enrollment_status === 'AVAILABLE' && (
                          <span className="badge bg-success">Available</span>
                        )}
                        {stat.enrollment_status === 'UNLIMITED' && (
                          <span className="badge bg-info">Unlimited</span>
                        )}
                      </td>
                      <td>
                        {stat.is_visible ? (
                          <span className="badge bg-success">Visible</span>
                        ) : (
                          <span className="badge bg-secondary">Hidden</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {message && <div className="alert alert-info">{message}</div>}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-5">
          <div className="alert alert-info">
            <h5>No courses found</h5>
            <p className="mb-0">Try adjusting your search criteria.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Level</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Enrollment Limit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(course => (
                  <tr key={course.id}>
                    <td>{course.id}</td>
                    <td>
                      {course.title}
                      {!course.is_visible && (
                        <span className="badge bg-secondary ms-2">Hidden</span>
                      )}
                    </td>
                    <td>{course.level}</td>
                    <td>${course.price}</td>
                    <td>{course.duration}</td>
                    <td>
                      {course.enrollment_limit === 0 ? (
                        <span className="text-muted">Unlimited</span>
                      ) : (
                        course.enrollment_limit
                      )}
                    </td>
                    <td>
                      {course.is_visible ? (
                        <span className="badge bg-success">Visible</span>
                      ) : (
                        <span className="badge bg-secondary">Hidden</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button className="btn btn-sm btn-outline-info" title="View" onClick={() => setViewCourse(course)}>
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-warning" title="Edit" onClick={() => handleEdit(course)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => handleDelete(course.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Courses pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
      
      {/* View Course Modal */}
      {viewCourse && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Course Details</h5>
                <button type="button" className="btn-close" onClick={() => setViewCourse(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-primary">Course Information</h6>
                    <p><strong>Course ID:</strong> {viewCourse.id}</p>
                    <p><strong>Title:</strong> {viewCourse.title}</p>
                    <p><strong>Level:</strong> <span className="badge bg-info">{viewCourse.level}</span></p>
                    <p><strong>Price:</strong> <span className="text-success fw-bold">${viewCourse.price}</span></p>
                    <p><strong>Duration:</strong> {viewCourse.duration}</p>
                    <p><strong>Created:</strong> {new Date(viewCourse.created_at).toLocaleDateString()}</p>
                    {viewCourse.updated_at && (
                      <p><strong>Last Updated:</strong> {new Date(viewCourse.updated_at).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-primary">Course Image</h6>
                    {viewCourse.image_url ? (
                      <img 
                        src={viewCourse.image_url} 
                        alt={viewCourse.title}
                        className="img-fluid rounded"
                        style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="bg-light border rounded p-4 text-center">
                        <p className="text-muted mb-0">No image available</p>
                      </div>
                    )}
                  </div>
                </div>
                <hr />
                <div className="row">
                  <div className="col-12">
                    <h6 className="text-primary">Course Description</h6>
                    <div className="border rounded p-3 bg-light">
                      {viewCourse.description || 'No description available'}
                    </div>
                  </div>
                </div>
                {viewCourse.image_url && (
                  <>
                    <hr />
                    <div className="row">
                      <div className="col-12">
                        <h6 className="text-primary">Image URL</h6>
                        <p className="text-break">
                          <a href={viewCourse.image_url} target="_blank" rel="noopener noreferrer">
                            {viewCourse.image_url}
                          </a>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewCourse(null)}>Close</button>
                <button 
                  type="button" 
                  className="btn btn-warning" 
                  onClick={() => {
                    handleEdit(viewCourse);
                    setViewCourse(null);
                  }}
                >
                  Edit Course
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => {
                    handleDelete(viewCourse.id);
                    setViewCourse(null);
                  }}
                >
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingCourse ? 'Edit Course' : 'Add Course'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input type="text" className="form-control" name="title" value={form.title} onChange={handleFormChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" name="description" value={form.description} onChange={handleFormChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Price</label>
                    <input type="number" className="form-control" name="price" value={form.price} onChange={handleFormChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Duration</label>
                    <input type="text" className="form-control" name="duration" value={form.duration} onChange={handleFormChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Level</label>
                    <input type="text" className="form-control" name="level" value={form.level} onChange={handleFormChange} required />
                  </div>
                  
                  {/* Image Upload Section */}
                  <div className="mb-3">
                    <label className="form-label">Course Image</label>
                    <div 
                      className={`border-2 border-dashed rounded p-4 text-center ${dragActive ? 'border-primary bg-light' : 'border-secondary'}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {form.image_url ? (
                        <div>
                          <img 
                            src={form.image_url} 
                            alt="Preview" 
                            className="img-fluid mb-2" 
                            style={{ maxHeight: '150px' }}
                          />
                          <div className="mb-2">
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => document.getElementById('courseFileInput').click()}
                            >
                              Change Image
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                          <p className="mb-2">Drag and drop an image here, or</p>
                          <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={() => document.getElementById('courseFileInput').click()}
                            disabled={uploading}
                          >
                            {uploading ? 'Uploading...' : 'Choose File'}
                          </button>
                          <p className="text-muted mt-2 mb-0">Supports: JPG, PNG, GIF (Max 5MB)</p>
                        </div>
                      )}
                      <input 
                        id="courseFileInput"
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                  
                  {/* Enrollment Limit and Visibility */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Enrollment Limit</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="enrollment_limit" 
                          value={form.enrollment_limit} 
                          onChange={handleFormChange} 
                          min="0"
                          placeholder="0 = Unlimited"
                        />
                        <small className="text-muted">Set to 0 for unlimited enrollments</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <div className="form-check mt-4">
                          <input 
                            type="checkbox" 
                            className="form-check-input" 
                            name="is_visible" 
                            checked={form.is_visible} 
                            onChange={handleFormChange} 
                            id="isVisible"
                          />
                          <label className="form-check-label" htmlFor="isVisible">
                            Visible on Frontend
                          </label>
                        </div>
                        <small className="text-muted">Uncheck to hide this course from students</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingCourse ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoursesAdmin; 