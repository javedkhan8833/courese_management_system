import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';

function SubscribersAdmin() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // Fetch subscribers with pagination
  const fetchSubscribers = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `http://localhost:5000/api/subscribers?page=${page}&limit=${limit}`,
        { headers: getAuthHeaders() }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }
      
      const data = await response.json();
      setSubscribers(data.data);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      });
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to fetch subscribers');
      toast.error(err.message || 'Failed to fetch subscribers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers(pagination.page, pagination.limit);
  }, [fetchSubscribers, pagination.page, pagination.limit]);

  // Handle subscriber deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) return;
    
    try {
      setMessage('Deleting subscriber...');
      const response = await fetch(
        `http://localhost:5000/api/subscribers/${id}`, 
        { 
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete subscriber');
      }
      
      toast.success('Subscriber deleted successfully');
      // Refresh the list
      await fetchSubscribers(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error:', err);
      toast.error(err.message || 'Failed to delete subscriber');
    }
  };

  // Export subscribers to CSV
  const handleExport = async () => {
    try {
      const response = await fetch(
        'http://localhost:5000/api/subscribers/export',
        { headers: getAuthHeaders() }
      );
      
      if (!response.ok) {
        throw new Error('Failed to export subscribers');
      }
      
      const blob = await response.blob();
      saveAs(blob, `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Subscribers exported successfully');
    } catch (err) {
      console.error('Error exporting subscribers:', err);
      toast.error(err.message || 'Failed to export subscribers');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Subscribers</h2>
        <div>
          <button 
            className="btn btn-primary me-2"
            onClick={handleExport}
            disabled={loading || subscribers.length === 0}
          >
            <i className="bi bi-download me-2"></i>Export to CSV
          </button>
        </div>
      </div>

      {message && (
        <div className="alert alert-info">
          {message}
          <button 
            type="button" 
            className="btn-close float-end" 
            onClick={() => setMessage('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            type="button" 
            className="btn-close float-end" 
            onClick={() => setError('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {loading && !subscribers.length ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No subscribers found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Subscribed On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id}>
                        <td>{subscriber.email}</td>
                        <td>{formatDate(subscriber.subscribed_at)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(subscriber.id)}
                            disabled={loading}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                      <li key={pageNum} className={`page-item ${pageNum === pagination.page ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                  <div className="text-center text-muted">
                    Page {pagination.page} of {pagination.totalPages} • {pagination.total} total subscribers
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubscribersAdmin;
