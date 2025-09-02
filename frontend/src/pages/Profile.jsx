import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const requiredFields = [
  'gender', 'phone', 'dob', 'country', 'city', 'street', 'postal_code', 'country_of_residence'
];

// Country list for dropdown
const countryList = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon',
  'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia',
  'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
  'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
  'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia',
  'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
  'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia',
  'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe'
];

function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [picturePreview, setPicturePreview] = useState(null);
  const fileInputRef = useRef();
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [showWelcome, setShowWelcome] = useState(
    location.state && location.state.justRegistered ? true : false
  );

  useEffect(() => {
    if (user) {
      fetch('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch profile');
          return res.json();
        })
                 .then(data => {
           console.log('Fetched profile (on mount):', data);
           if (data && typeof data === 'object' && !Array.isArray(data)) {
             setProfile(data);
             setProfileLoadError(false);
             // Check if any required profile fields are missing
             const missingFields = requiredFields.filter(f => !data[f]);
             console.log('Missing profile fields:', missingFields);
             if (missingFields.length > 0) {
               setEditMode(true);
             }
           } else {
             setProfileLoadError(true);
             setStatus({ type: 'danger', message: 'Invalid profile data received.' });
           }
         })
        .catch((err) => {
          console.error('Profile fetch error (on mount):', err);
          setProfileLoadError(true);
        });
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.autoEnroll) {
      const courseId = location.state.autoEnroll;
      // Clear the autoEnroll state to prevent loops
      const state = { ...location.state };
      delete state.autoEnroll;
      window.history.replaceState(state, '');
      
      // Trigger enrollment
      handleEnroll(courseId);
    }
  }, [location.state]);



  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile({ ...profile, profile_picture: file });
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setStatus({ type: '', message: '' });
  };

  const handleCancel = () => {
    setEditMode(false);
    setStatus({ type: '', message: '' });
    // Refetch profile to reset form
    fetch('http://localhost:5000/api/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setPicturePreview(null);
      });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const formData = new FormData();
      
      // Only add profile fields (not username, email, full_name)
      for (const key of requiredFields) {
        formData.append(key, profile[key] || '');
      }
      
      if (profile.profile_picture instanceof File) {
        formData.append('profile_picture', profile.profile_picture);
      }
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await response.json();
      console.log('Profile update response:', data);
      if (!response.ok) {
        setStatus({ type: 'danger', message: data.message || 'Update failed' });
      } else {
        // Check if we have an enrollment to process
        const { enrollCourseId, returnTo } = location.state || {};
        
        if (enrollCourseId) {
          // Redirect to course enrollment
          setStatus({ type: 'success', message: 'Profile updated! Redirecting to course enrollment...' });
          setTimeout(() => {
            navigate(returnTo || '/courses', { 
              state: { autoEnroll: enrollCourseId } 
            });
          }, 1500);
        } else {
                   // Regular profile update
         setStatus({ type: 'success', message: 'Profile updated successfully!' });
         setEditMode(false);
       }

       // Refresh profile data
       fetch('http://localhost:5000/api/profile', {
         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
       })
         .then(res => {
           if (!res.ok) throw new Error('Failed to fetch profile');
           return res.json();
         })
         .then(data => {
           console.log('Fetched profile (after update):', data);
           if (data && typeof data === 'object' && !Array.isArray(data)) {

             setProfile(data);
             setPicturePreview(null);
             setProfileLoadError(false);
           } else {
             setProfileLoadError(true);
             setStatus({ type: 'danger', message: 'Invalid profile data received after update.' });
           }
         })
         .catch((err) => {
           console.error('Profile fetch error (after update):', err);
           setProfileLoadError(true);
           setStatus({ type: 'danger', message: 'Failed to reload profile after update.' });
         });
      }
    } catch (err) {
      setStatus({ type: 'danger', message: 'An error occurred. Please try again.' });
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = (courseId) => {
    // Implement enrollment logic here
  };

  if (profileLoadError) {
    return <div className="text-center py-5"><div className="alert alert-danger">Failed to load profile. Please refresh the page or try again later.</div></div>;
  }
  if (!profile) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  return (
    <div className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h2 className="mb-4 text-center">User Profile</h2>
              {showWelcome && (
                <div className="alert alert-success" onClick={() => setShowWelcome(false)} style={{ cursor: 'pointer' }}>
                  You are successfully registered and auto logged in, in the course management system platform.<br/>
                  Dear user, if you want to enroll in a course, please complete your profile first.
                  <div className="mt-2"><small>(Click to dismiss)</small></div>
                </div>
              )}
              {status.message && <div className={`alert alert-${status.type}`}>{status.message}</div>}
                             {editMode ? (
                 <form onSubmit={handleSave} encType="multipart/form-data">
                  <div className="mb-3">
                    <label className="form-label">Gender</label>
                    <select className="form-control" name="gender" value={profile.gender || ''} onChange={handleChange} required>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-control" name="phone" value={profile.phone || ''} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" className="form-control" name="dob" value={profile.dob || ''} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Country / Region</label>
                    <select className="form-control" name="country" value={profile.country || ''} onChange={handleChange} required>
                      <option value="">Select</option>
                      {countryList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">City</label>
                    <input type="text" className="form-control" name="city" value={profile.city || ''} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Street Address</label>
                    <input type="text" className="form-control" name="street" value={profile.street || ''} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Postal Code</label>
                    <input type="text" className="form-control" name="postal_code" value={profile.postal_code || ''} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Country of Residence</label>
                    <select className="form-control" name="country_of_residence" value={profile.country_of_residence || ''} onChange={handleChange} required>
                      <option value="">Select</option>
                      {countryList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Profile Picture</label>
                    <input type="file" className="form-control" name="profile_picture" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
                    {(picturePreview || (typeof profile.profile_picture === 'string' && profile.profile_picture)) && (
                      <div className="mt-2">
                        <img
                          src={
                            picturePreview ||
                            (typeof profile.profile_picture === 'string' && profile.profile_picture.startsWith('/uploads/')
                              ? `http://localhost:5000${profile.profile_picture}`
                              : profile.profile_picture)
                          }
                          alt="Profile Preview"
                          style={{ maxWidth: 120, borderRadius: '50%' }}
                        />
                      </div>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <ul className="list-group list-group-flush mb-3">
                    <li className="list-group-item"><strong>Full Name:</strong> {profile.full_name}</li>
                    <li className="list-group-item"><strong>Gender:</strong> {profile.gender}</li>
                    <li className="list-group-item"><strong>Phone:</strong> {profile.phone}</li>
                    <li className="list-group-item"><strong>Date of Birth:</strong> {profile.dob}</li>
                    <li className="list-group-item"><strong>Country:</strong> {profile.country}</li>
                    <li className="list-group-item"><strong>City:</strong> {profile.city}</li>
                    <li className="list-group-item"><strong>Street Address:</strong> {profile.street}</li>
                    <li className="list-group-item"><strong>Postal Code:</strong> {profile.postal_code}</li>
                    <li className="list-group-item"><strong>Email:</strong> {profile.email}</li>
                    <li className="list-group-item"><strong>Username:</strong> {profile.username}</li>
                    <li className="list-group-item"><strong>Role:</strong> {profile.role}</li>
                    {profile.created_at && (
                      <li className="list-group-item"><strong>Joined:</strong> {new Date(profile.created_at).toLocaleDateString()}</li>
                    )}
                    {typeof profile.profile_picture === 'string' && profile.profile_picture && (
                      <li className="list-group-item">
                        <strong>Profile Picture:</strong><br />
                        <img
                          src={profile.profile_picture.startsWith('/uploads/')
                            ? `http://localhost:5000${profile.profile_picture}`
                            : profile.profile_picture}
                          alt="Profile"
                          style={{ maxWidth: 120, borderRadius: '50%' }}
                        />
                      </li>
                    )}
                    <tr><th>Country of Residence</th><td>{profile.country_of_residence || <span className="text-muted">-</span>}</td></tr>
                  </ul>
                  <button className="btn btn-outline-primary" onClick={handleEdit}>Edit Profile</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;