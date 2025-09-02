import React, { useState, useEffect } from 'react';

function ContactsAdmin() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/contacts', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setMessage('Error loading contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/contacts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setContacts(contacts.filter(contact => contact.id !== id));
        setMessage('Contact deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      setMessage('Error deleting contact');
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/contacts/${id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setContacts(contacts.map(contact => 
          contact.id === id ? { ...contact, is_read: true } : contact
        ));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const viewContact = (contact) => {
    setSelectedContact(contact);
    if (!contact.is_read) {
      markAsRead(contact.id);
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading contacts...</div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header pb-0">
              <h6>Contact Messages</h6>
            </div>
            <div className="card-body px-0 pt-0 pb-2">
              {message && <div className="alert alert-info">{message}</div>}
              
              <div className="table-responsive p-0">
                {contacts.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      No contact messages found. Contact messages from the website contact form will appear here.
                    </div>
                  </div>
                ) : (
                  <table className="table align-items-center mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map(contact => (
                        <tr key={contact.id} className={!contact.is_read ? 'fw-bold' : ''}>
                          <td>{contact.name}</td>
                          <td>{contact.email}</td>
                          <td>
                            <button 
                              className="btn btn-link p-0 text-decoration-none" 
                              onClick={() => viewContact(contact)}
                            >
                              {contact.message.length > 30 
                                ? `${contact.message.substring(0, 30)}...` 
                                : contact.message}
                            </button>
                          </td>
                          <td>{new Date(contact.created_at).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${contact.is_read ? 'bg-secondary' : 'bg-success'}`}>
                              {contact.is_read ? 'Read' : 'New'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(contact.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Message from {selectedContact.name}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setSelectedContact(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p><strong>Email:</strong> {selectedContact.email}</p>
                <p><strong>Date:</strong> {new Date(selectedContact.created_at).toLocaleString()}</p>
                <div className="mt-3 p-3 bg-light rounded">
                  {selectedContact.message}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedContact(null)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => {
                    handleDelete(selectedContact.id);
                    setSelectedContact(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactsAdmin;