// frontend/src/pages/admin/SubscribersList.jsx
import React, { useState, useEffect } from 'react';
import { Container, Table, Alert, Spinner } from 'react-bootstrap';
import api from '../../config/api';

const SubscribersList = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/subscribers/all');
        setSubscribers(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching subscribers:', err);
        setError('Failed to fetch subscribers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container>
      <h2 className="mb-4">Newsletter Subscribers</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Email</th>
            <th>Subscribed On</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((subscriber, index) => (
            <tr key={subscriber.id}>
              <td>{index + 1}</td>
              <td>{subscriber.email}</td>
              <td>{new Date(subscriber.subscribed_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {subscribers.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center">No subscribers found</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default SubscribersList;