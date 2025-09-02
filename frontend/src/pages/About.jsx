import React, { useEffect, useState } from 'react';
import { FiUsers, FiAward, FiTarget, FiHeart } from 'react-icons/fi';

function About() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/about')
      .then(res => res.json())
      .then(data => {
        setContent(data.content || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section position-relative overflow-hidden">
        <div className="hero-background"></div>
        <div className="container position-relative">
          <div className="row min-vh-50 align-items-center">
            <div className="col-lg-8 mx-auto text-center text-white">
              <h1 className="display-4 fw-bold mb-4 animate-fade-in">
                About Our Organization
              </h1>
              <p className="lead mb-0 animate-fade-in-delay">
                Empowering individuals through quality education and professional development
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : content ? (
                <div className="content-wrapper">
                  <div 
                    className="about-content"
                    dangerouslySetInnerHTML={{ __html: content }} 
                  />
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="empty-state">
                    <FiUsers size={64} className="text-muted mb-3" />
                    <h3 className="text-muted">About Content Coming Soon</h3>
                    <p className="text-muted">Our team is working on creating compelling content about our organization.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="section-title">Our Core Values</h2>
              <p className="section-subtitle">The principles that guide everything we do</p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="value-card text-center">
                <div className="value-icon mb-3">
                  <FiTarget className="text-primary" size={48} />
                </div>
                <h4 className="value-title">Excellence</h4>
                <p className="value-description">
                  We strive for excellence in everything we do, from course content to student support.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="value-card text-center">
                <div className="value-icon mb-3">
                  <FiUsers className="text-primary" size={48} />
                </div>
                <h4 className="value-title">Community</h4>
                <p className="value-description">
                  Building a supportive community where learners can grow and succeed together.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="value-card text-center">
                <div className="value-icon mb-3">
                  <FiAward className="text-primary" size={48} />
                </div>
                <h4 className="value-title">Quality</h4>
                <p className="value-description">
                  Delivering high-quality education that meets industry standards and exceeds expectations.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="value-card text-center">
                <div className="value-icon mb-3">
                  <FiHeart className="text-primary" size={48} />
                </div>
                <h4 className="value-title">Passion</h4>
                <p className="value-description">
                  Driven by our passion for education and commitment to student success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-3 col-6">
              <div className="stat-card text-center">
                <div className="stat-number">500+</div>
                <div className="stat-label">Students Enrolled</div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card text-center">
                <div className="stat-number">50+</div>
                <div className="stat-label">Courses Available</div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card text-center">
                <div className="stat-number">95%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card text-center">
                <div className="stat-number">5+</div>
                <div className="stat-label">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .about-page {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          min-height: 400px;
          display: flex;
          align-items: center;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="rgba(255,255,255,0.1)"><polygon points="0,100 1000,0 1000,100"/></svg>');
          background-size: cover;
        }

        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .content-wrapper {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          padding: 3rem;
          margin-bottom: 3rem;
        }

        .about-content {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #495057;
        }

        .about-content h1, .about-content h2, .about-content h3 {
          color: #2c3e50;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .about-content p {
          margin-bottom: 1.5rem;
        }

        .about-content img {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin: 2rem auto;
          display: block;
        }

        .about-content video, .about-content audio {
          max-width: 100%;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin: 2rem auto;
          display: block;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .section-subtitle {
          font-size: 1.2rem;
          color: #6c757d;
          margin-bottom: 3rem;
        }

        .value-card {
          background: white;
          padding: 2rem 1.5rem;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
        }

        .value-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }

        .value-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: white;
        }

        .value-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .value-description {
          color: #6c757d;
          line-height: 1.6;
          margin: 0;
        }

        .stat-card {
          background: white;
          padding: 2rem 1rem;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 1rem;
          color: #6c757d;
          font-weight: 500;
        }

        .empty-state {
          padding: 3rem;
        }

        @media (max-width: 768px) {
          .hero-section {
            min-height: 300px;
          }
          
          .content-wrapper {
            padding: 2rem 1.5rem;
            margin: 1rem;
          }
          
          .section-title {
            font-size: 2rem;
          }
          
          .stat-number {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}

export default About; 