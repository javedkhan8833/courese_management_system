import React, { useEffect, useState, useCallback } from 'react';

function FAQsAdmin() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '' });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // Memoize fetchFAQs to prevent unnecessary re-renders
  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/faqs', {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      const data = await response.json();
      setFaqs(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    setEditingFAQ(null);
    setForm({ question: '', answer: '' });
    setShowForm(true);
    setMessage('');
  };

  const handleEdit = faq => {
    setEditingFAQ(faq);
    setForm({ question: faq.question, answer: faq.answer });
    setShowForm(true);
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      setMessage('Deleting FAQ...');
      const response = await fetch(`http://localhost:5000/api/faqs/${id}`, { 
        method: 'DELETE', 
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete FAQ');
      }
      
      setMessage('FAQ deleted successfully');
      // Refresh the list
      await fetchFAQs();
    } catch (err) {
      console.error('Error:', err);
      setMessage(err.message || 'Failed to delete FAQ');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setMessage(editingFAQ ? 'Updating FAQ...' : 'Adding FAQ...');
    
    try {
      const method = editingFAQ ? 'PUT' : 'POST';
      const url = editingFAQ 
        ? `http://localhost:5000/api/faqs/${editingFAQ.id}` 
        : 'http://localhost:5000/api/faqs';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save FAQ');
      }
      
      setMessage(editingFAQ ? 'FAQ updated successfully' : 'FAQ added successfully');
      setShowForm(false);
      // Refresh the list
      await fetchFAQs();
    } catch (err) {
      console.error('Error:', err);
      setMessage(err.message || 'Failed to save FAQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage FAQs</h2>
        <button 
          className="btn btn-primary" 
          onClick={handleAdd}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Add FAQ'}
        </button>
      </div>
      
      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'}`}>
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
      
      {loading && !faqs.length ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="table-responsive">
          {faqs.length === 0 ? (
            <div className="text-center py-5">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No FAQs found. Click "Add FAQ" to create your first frequently asked question.
              </div>
            </div>
          ) : (
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map(faq => (
                  <tr key={faq.id}>
                    <td>{faq.id}</td>
                    <td>{faq.question}</td>
                    <td>{faq.answer}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button className="btn btn-sm btn-outline-info" title="Edit" onClick={() => handleEdit(faq)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => handleDelete(faq.id)}>
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
                <h5 className="modal-title">{editingFAQ ? 'Edit FAQ' : 'Add FAQ'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Question</label>
                    <textarea className="form-control" name="question" value={form.question} onChange={handleFormChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Answer</label>
                    <textarea className="form-control" name="answer" value={form.answer} onChange={handleFormChange} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{editingFAQ ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FAQsAdmin;