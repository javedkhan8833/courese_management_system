
import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Spinner, Alert, Form, Table, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

// Auth headers function
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Simple cache
const bankAccountsCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 5 * 60 * 1000,
  isStale() {
    return !this.timestamp || (Date.now() - this.timestamp > this.CACHE_DURATION);
  },
  set(data) {
    this.data = data;
    this.timestamp = Date.now();
  },
  get() {
    return this.isStale() ? null : this.data;
  }
};

const BankAccountsAdmin = () => {
  // State declarations
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState({
    bank_name: '',
    bank_number: '',
    account_holder_name: '',
    branch_name: '',
    account_type: 'savings',
    is_active: true
  });
  const [message, setMessage] = useState({ text: '', variant: 'success' });

  // Fetch accounts with cache
  const fetchAccounts = useCallback(async (force = false) => {
    const cached = bankAccountsCache.get();
    if (cached && !force) {
      setAccounts(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.get('/bank-accounts', {
        headers: getAuthHeaders(),
        validateStatus: s => s < 500
      });

      if (res.status === 200) {
        const data = Array.isArray(res.data) ? res.data : [];
        bankAccountsCache.set(data);
        setAccounts(data);
      } else if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      } else {
        throw new Error(res.data?.message || 'Failed to fetch bank accounts');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bank accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Form change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Submit (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', variant: 'success' });
  
    try {
      const url = editingAccount 
        ? `/bank-accounts/${editingAccount.id}`
        : '/bank-accounts';
      
      const method = editingAccount ? 'put' : 'post';
      const response = await api[method](url, form, {
        headers: getAuthHeaders(),
        timeout: 15000
      });
  
      console.log('Server response:', response);
      
      // Handle success
      setMessage({ 
        text: editingAccount 
          ? 'Bank account updated successfully!' 
          : 'Bank account created successfully!', 
        variant: 'success' 
      });
      
      setShowForm(false);
      await fetchAccounts(true);  // Refresh the accounts list
      
    } catch (error) {
      console.error('Error submitting form:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'No response',
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      setMessage({
        text: error.response?.data?.error || 'Failed to save bank account. Please try again.',
        variant: 'danger'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add
  const handleAdd = (e) => {
    if (e) e.preventDefault();
    setEditingAccount(null);
    setForm({
      bank_name: '',
      bank_number: '',
      account_holder_name: '',
      branch_name: '',
      account_type: 'savings',
      is_active: true
    });
    setMessage({ text: '', variant: 'success' });
    setShowForm(true);
  };

  // Edit
  const handleEdit = (account, e) => {
    if (e) e.preventDefault();
    setEditingAccount(account);
    setForm({
      bank_name: account.bank_name,
      bank_number: account.bank_number,
      account_holder_name: account.account_holder_name,
      branch_name: account.branch_name || '',
      account_type: account.account_type || 'savings',
      is_active: account.is_active !== false
    });
    setMessage({ text: '', variant: 'success' });
    setShowForm(true);
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) return;

    try {
      const res = await api.delete(`/bank-accounts/${id}`, {
        headers: getAuthHeaders(),
        validateStatus: () => true
      });

      if (res.status >= 200 && res.status < 300) {
        setMessage({ text: 'Bank account deleted successfully', variant: 'success' });
        await fetchAccounts(true);
      } else {
        throw new Error(res.data?.error || 'Failed to delete bank account');
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.error || err.message || 'Failed to delete bank account', variant: 'danger' });
    }
  };



  // Initial fetch
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  if (loading && accounts.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading bank accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Bank Accounts</Alert.Heading>
          <p>{error}</p>
          <Button variant="primary" onClick={() => fetchAccounts(true)} disabled={loading}>
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Bank Accounts Management</h2>
        <div>
          <Button
            variant="outline-secondary"
            className="me-2"
            onClick={() => fetchAccounts(true)}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>Add Bank Account
          </Button>
        </div>
      </div>

      {message.text && (
        <Alert variant={message.variant} onClose={() => setMessage({ text: '', variant: 'success' })} dismissible>
          {message.text}
        </Alert>
      )}

      <div className="table-responsive">
        <Table striped bordered hover className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Bank Name</th>
              <th>Account Number</th>
              <th>Account Holder</th>
              <th>Branch</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length > 0 ? (
              accounts.map(account => (
                <tr key={account.id}>
                  <td>{account.bank_name}</td>
                  <td>{account.bank_number}</td>
                  <td>{account.account_holder_name}</td>
                  <td>{account.branch_name || '-'}</td>
                  <td>{account.account_type || 'N/A'}</td>
                  <td>
                    <Badge bg={account.is_active ? 'success' : 'secondary'}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <div className="btn-group" role="group">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => handleEdit(account, e)}
                        title="Edit"
                        className="me-1"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No bank accounts found. Click "Add Bank Account" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={showForm} onHide={() => !loading && setShowForm(false)} centered>
        <Modal.Header closeButton={!loading}>
          <Modal.Title>
            {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {message.text && (
              <Alert variant={message.variant} className="mb-3">
                {message.text}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Bank Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="bank_name"
                value={form.bank_name}
                onChange={handleFormChange}
                required
                placeholder="e.g., ABC Bank"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Account Number <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="bank_number"
                value={form.bank_number}
                onChange={handleFormChange}
                required
                placeholder="e.g., 1234567890"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Account Holder Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="account_holder_name"
                value={form.account_holder_name}
                onChange={handleFormChange}
                required
                placeholder="e.g., John Doe"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Branch Name</Form.Label>
              <Form.Control
                type="text"
                name="branch_name"
                value={form.branch_name}
                onChange={handleFormChange}
                placeholder="e.g., Main Branch"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Account Type</Form.Label>
              <Form.Select
                name="account_type"
                value={form.account_type}
                onChange={handleFormChange}
                disabled={loading}
              >
                <option value="savings">Savings</option>
                <option value="checking">Checking</option>
                <option value="current">Current</option>
              </Form.Select>
            </Form.Group>

            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Account Active"
              checked={form.is_active}
              onChange={handleFormChange}
              disabled={loading}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowForm(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
  type="submit" 
  variant="primary" 
  disabled={submitting}
>
  {submitting ? (
    <>
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
        className="me-2"
      />
      {editingAccount ? 'Updating...' : 'Creating...'}
    </>
  ) : (
    editingAccount ? 'Update Bank Account' : 'Create Bank Account'
  )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default BankAccountsAdmin;
