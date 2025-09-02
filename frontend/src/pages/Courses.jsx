import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import CourseList from '../components/CourseList';

function Courses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Get unique levels for filter
  const [uniqueLevels, setUniqueLevels] = useState([]);

  useEffect(() => {
    // Fetch unique levels from the API or from the courses data
    const fetchLevels = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/courses/levels');
        if (response.ok) {
          const data = await response.json();
          setUniqueLevels(data);
        }
      } catch (error) {
        console.error('Error fetching levels:', error);
      }
    };
    
    fetchLevels();
  }, []);

  return (
    <div className="py-4">
      <h1 className="text-center mb-5">Our Courses</h1>
      
      {/* Search and Filter Section */}
      <div className="row mb-4">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            {uniqueLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="">All Prices</option>
            <option value="free">Free</option>
            <option value="under50">Under $50</option>
            <option value="50to100">$50 - $100</option>
            <option value="over100">Over $100</option>
          </select>
        </div>
        <div className="col-md-2">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setSearchTerm('');
              setLevelFilter('');
              setPriceFilter('');
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Course List */}
      <CourseList 
        searchTerm={searchTerm}
        levelFilter={levelFilter}
        priceFilter={priceFilter}
      />
    </div>
  );
}

export default Courses;