import React from 'react';
import { Link } from 'react-router-dom';
import Slider from '../components/Slider';
import CourseList from '../components/CourseList';
import NewsletterSubscription from '../components/NewsletterSubscription';

function Home() {
  return (
    <div>
      {/* Main Slider */}
      <Slider />

      {/* Welcome Section */}
      <div className="row align-items-center min-vh-75 flex-column-reverse flex-md-row g-4">
        <div className="col-md-6 text-center text-md-start">
          <h1 className="display-4 fw-bold mb-4">Welcome to Our Course Platform</h1>
          <p className="lead mb-4">
            Discover a world of knowledge with our comprehensive range of courses.<br />
            Start your learning journey today!
          </p>
          <Link to="/courses" className="btn btn-primary btn-lg">
            Explore All Courses
          </Link>
        </div>
        <div className="col-md-6 text-center">
          <img
            src="https://via.placeholder.com/600x400"
            alt="Education"
            className="img-fluid rounded shadow"
            style={{ maxHeight: '350px', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="row mt-5 g-4">
        <div className="col-md-4 mb-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h3 className="card-title">Expert Instructors</h3>
              <p className="card-text">
                Learn from industry experts with years of practical experience.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h3 className="card-title">Flexible Learning</h3>
              <p className="card-text">
                Study at your own pace with our self-paced courses.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h3 className="card-title">Certification</h3>
              <p className="card-text">
                Earn certificates recognized by top companies worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Courses Section */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Featured Courses</h2>
          <Link to="/courses" className="btn btn-outline-primary">View All Courses</Link>
        </div>
        <CourseList limit={6} />
      </div>
      
      {/* Newsletter Section */}
      <div className="mt-5">
        <NewsletterSubscription />
      </div>
    </div>
  );
}

export default Home;