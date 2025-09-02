import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FAQs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/faqs')
      .then(response => {
        setFaqs(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching FAQs:', error);
        setError('Failed to fetch FAQs. Please try again later.');
        setLoading(false);
      });
  }, []);

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
    <div className="py-5">
      <h1 className="text-center mb-5">Frequently Asked Questions</h1>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {faqs.length === 0 ? (
            <div className="text-center py-5">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No FAQs found. Please check back later for frequently asked questions.
              </div>
            </div>
          ) : (
            <div className="accordion" id="faqAccordion">
              {faqs.map((faq, index) => (
                <div className="accordion-item" key={faq.id}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${index === 0 ? '' : 'collapsed'}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#faq${faq.id}`}
                    >
                      {faq.question}
                    </button>
                  </h2>
                  <div
                    id={`faq${faq.id}`}
                    className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FAQs; 