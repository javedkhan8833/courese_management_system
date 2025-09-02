// src/components/NewsletterSubscription.jsx
import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import api from '../config/api';

const NewsletterSubscription = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', variant: 'success' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/subscribers/subscribe', { email });
      setMessage({ text: 'Thank you for subscribing!', variant: 'success' });
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to subscribe. Please try again.';
      setMessage({ text: errorMsg, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="newsletter-section position-relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '80px 0',
      position: 'relative'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }}></div>
      
      {/* Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
        pointerEvents: 'none'
      }}></div>
      
      <div className="container position-relative">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="text-center p-5 rounded-4 shadow-lg" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              zIndex: 1
            }}>
              {/* Icon */}
              <div className="mb-4">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 6L12 13L22 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H20C20.5304 20 21.0391 19.7893 21.4142 19.4142C21.7893 19.0391 22 18.5304 22 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              {/* Content */}
              <div>
                <h2 className="mb-3 fw-bold" style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: '2.5rem'
                }}>
                  Stay Updated with Our Newsletter
                </h2>
                <p className="mb-4 text-muted fs-5" style={{ color: '#6c757d', fontWeight: 400 }}>
                  Get the latest course updates, exclusive offers, and learning tips delivered directly to your inbox.
                </p>
                
                {/* Benefits */}
                <div className="mb-4">
                  <div className="row justify-content-center g-3">
                    <div className="col-md-4">
                      <div className="d-flex align-items-center justify-content-center" style={{
                        padding: '8px 16px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#667eea'
                      }}>
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>🎯</span>
                        <span>Exclusive Offers</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex align-items-center justify-content-center" style={{
                        padding: '8px 16px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#667eea'
                      }}>
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>📚</span>
                        <span>New Courses</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex align-items-center justify-content-center" style={{
                        padding: '8px 16px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#667eea'
                      }}>
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>💡</span>
                        <span>Learning Tips</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Alert Message */}
                {message.text && (
                  <Alert 
                    variant={message.variant} 
                    onClose={() => setMessage({ text: '', variant: 'success' })} 
                    dismissible
                    className="mb-4"
                    style={{ borderRadius: '12px', border: 'none' }}
                  >
                    {message.text}
                  </Alert>
                )}
                
                {/* Subscription Form */}
                <Form onSubmit={handleSubmit}>
                  <div className="row justify-content-center g-3">
                    <div className="col-md-8 col-lg-6">
                      <Form.Group className="mb-3" controlId="formBasicEmail">
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-white border-end-0" style={{
                            borderRadius: '12px 0 0 12px',
                            border: '2px solid #e9ecef',
                            borderRight: 'none',
                            color: '#6c757d'
                          }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                          <Form.Control
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="border-start-0"
                            style={{
                              borderRadius: '0 12px 12px 0',
                              border: '2px solid #e9ecef',
                              padding: '12px 20px',
                              fontSize: '1rem',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-md-4 col-lg-3">
                      <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={loading} 
                        className="btn btn-lg w-100"
                        style={{
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 24px',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                          e.target.style.background = 'linear-gradient(135deg, #5a6fd8, #6a5acd)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'none';
                          e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                          e.target.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Subscribing...
                          </>
                        ) : (
                          <>
                            Subscribe
                            <svg className="ms-2" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Form>
                
                {/* Privacy Note */}
                <p className="mt-3 text-muted small" style={{ opacity: 0.8 }}>
                  🔒 We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSubscription;