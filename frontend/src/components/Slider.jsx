import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Slider() {
  const [sliders, setSliders] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sliders');
      if (response.ok) {
        const data = await response.json();
        setSliders(data);
      } else {
        console.error('Failed to fetch sliders');
      }
    } catch (error) {
      console.error('Error fetching sliders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sliders.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliders.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [sliders.length]);

  if (loading) {
    return (
      <div className="container-fluid bg-primary text-white py-5">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sliders.length === 0) {
    return (
      <div className="container-fluid bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="display-4 fw-bold mb-4">Welcome to Our Course Platform</h1>
              <p className="lead mb-4">
                Discover a world of knowledge with our comprehensive range of courses.
                Start your learning journey today!
              </p>
              <Link to="/courses" className="btn btn-light btn-lg">
                Explore Courses
              </Link>
            </div>
            <div className="col-md-6 text-center">
              <img
                src="https://via.placeholder.com/600x400/ffffff/2563eb?text=Welcome"
                alt="Education"
                className="img-fluid rounded shadow"
                style={{ maxHeight: '350px', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <style>
        {`
          .carousel-caption h1,
          .carousel-caption h2,
          .carousel-caption h3,
          .carousel-caption p {
            color: white !important;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
          }
          
          .carousel-caption {
            background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3));
            border-radius: 10px;
            padding: 20px;
            margin: 0 20px;
          }
          
          @media (max-width: 768px) {
            .carousel-caption h1 {
              font-size: 1.5rem !important;
            }
            .carousel-caption h2 {
              font-size: 1.2rem !important;
            }
            .carousel-caption p {
              font-size: 1rem !important;
            }
            .carousel-caption {
              padding: 15px;
              margin: 0 10px;
            }
          }
        `}
      </style>
      <div id="mainSlider" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-indicators">
          {sliders.map((_, index) => (
            <button
              key={index}
              type="button"
              data-bs-target="#mainSlider"
              data-bs-slide-to={index}
              className={index === currentSlide ? 'active' : ''}
              aria-current={index === currentSlide ? 'true' : 'false'}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
        
        <div className="carousel-inner">
          {sliders.map((slider, index) => (
            <div
              key={slider.id}
              className={`carousel-item ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${slider.image_url || 'https://via.placeholder.com/1200x600'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '500px'
              }}
            >
              <div className="carousel-caption d-flex align-items-center justify-content-center h-100">
                <div className="text-center">
                  <h1 className="display-4 fw-bold mb-4 text-white" style={{ 
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    color: 'white !important'
                  }}>
                    {slider.title}
                  </h1>
                  {slider.subtitle && (
                    <h2 className="h3 mb-4 text-white" style={{ 
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      color: 'white !important'
                    }}>
                      {slider.subtitle}
                    </h2>
                  )}
                  {slider.description && (
                    <p className="lead mb-4 text-white" style={{ 
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      color: 'white !important'
                    }}>
                      {slider.description}
                    </p>
                  )}
                  {slider.button_text && slider.button_link && (
                    <Link to={slider.button_link} className="btn btn-primary btn-lg">
                      {slider.button_text}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {sliders.length > 1 && (
          <>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#mainSlider"
              data-bs-slide="prev"
              onClick={() => setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length)}
            >
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#mainSlider"
              data-bs-slide="next"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % sliders.length)}
            >
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Slider;
