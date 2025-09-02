import React, { useState, useEffect } from 'react';

function SlidersAdmin() {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    button_text: '',
    button_link: '',
    is_active: true,
    sort_order: 0
  });
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sliders', {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        setSliders(data);
      } catch (error) {
        console.error('Error fetching sliders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSliders();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setForm(prev => ({ ...prev, image_url: data.url }));
        setMessage('Image uploaded successfully!');
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Upload failed');
      }
    } catch (error) {
      setMessage('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = () => {
    setEditingSlider(null);
    setForm({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      button_text: '',
      button_link: '',
      is_active: true,
      sort_order: 0
    });
    setShowForm(true);
    setMessage('');
  };

  const handleEdit = (slider) => {
    setForm({
      title: slider.title,
      subtitle: slider.subtitle || '',
      description: slider.description || '',
      image_url: slider.image_url || '',
      button_text: slider.button_text || '',
      button_link: slider.button_link || '',
      is_active: slider.is_active,
      sort_order: slider.sort_order || 0
    });
    setEditingSlider(slider);
    setShowForm(true);
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slider?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/sliders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete slider');
      }

      // Update the UI by removing the deleted slider
      setSliders(prevSliders => prevSliders.filter(slider => slider.id !== id));
      setMessage('Slider deleted successfully');

      // Clear any editing state if the deleted slider was being edited
      if (editingSlider && editingSlider.id === id) {
        setEditingSlider(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error deleting slider:', error);
      setMessage('Error deleting slider');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
  
    const url = editingSlider
      ? `http://localhost:5000/api/sliders/${editingSlider.id}`
      : 'http://localhost:5000/api/sliders';
  
    const method = editingSlider ? 'PUT' : 'POST';
  
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(form)
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setShowForm(false);
        setMessage(editingSlider ? 'Slider updated successfully' : 'Slider added successfully');
        
        // Update the sliders list based on whether we're adding or updating
        if (editingSlider) {
          setSliders(prevSliders => 
            prevSliders.map(slider => 
              slider.id === editingSlider.id ? { ...data } : slider
            )
          );
        } else {
          // Add the new slider to the beginning of the list
          setSliders(prevSliders => [data, ...prevSliders]);
        }
        
        // Reset form
        setForm({
          title: '',
          subtitle: '',
          description: '',
          image_url: '',
          button_text: '',
          button_link: '',
          is_active: true,
          sort_order: 0
        });
        setEditingSlider(null);
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error processing your request');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Sliders</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          Add New Slider
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {sliders.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No sliders found. Add your first slider to get started!</p>
        </div>
      ) : (
        <div className="row">
          {sliders.map((slider) => (
            <div key={slider.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                {slider.image_url && (
                  <img
                    src={slider.image_url}
                    className="card-img-top"
                    alt={slider.title}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                    }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{slider.title}</h5>
                  {slider.subtitle && (
                    <h6 className="card-subtitle mb-2 text-muted">{slider.subtitle}</h6>
                  )}
                  {slider.description && (
                    <p className="card-text">{slider.description.substring(0, 100)}...</p>
                  )}
                  <div className="d-flex justify-content-between align-items-center">
                    <span className={`badge ${slider.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {slider.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <small className="text-muted">Order: {slider.sort_order}</small>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="btn-group w-100" role="group" style={{ gap: '8px' }}>
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(slider)}
                      className="px-2 py-1 bg-blue-500 text-white rounded"
                    >
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(slider.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded ml-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingSlider ? 'Edit Slider' : 'Add New Slider'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          value={form.title}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subtitle</label>
                        <input
                          type="text"
                          className="form-control"
                          name="subtitle"
                          value={form.subtitle}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          name="description"
                          value={form.description}
                          onChange={handleFormChange}
                          rows="3"
                        />
                      </div>

                      {/* Image Upload Section */}
                      <div className="mb-3">
                        <label className="form-label">Slider Image</label>
                        <div
                          className={`border-2 border-dashed rounded p-4 text-center ${dragActive ? 'border-primary bg-light' : 'border-secondary'}`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          {form.image_url ? (
                            <div>
                              <img
                                src={form.image_url}
                                alt="Preview"
                                className="img-fluid mb-2"
                                style={{ maxHeight: '150px' }}
                              />
                              <div className="mb-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={() => document.getElementById('fileInput').click()}
                                >
                                  Change Image
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                              <p className="mb-2">Drag and drop an image here, or</p>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => document.getElementById('fileInput').click()}
                                disabled={uploading}
                              >
                                {uploading ? 'Uploading...' : 'Choose File'}
                              </button>
                              <p className="text-muted mt-2 mb-0">Supports: JPG, PNG, GIF (Max 5MB)</p>
                            </div>
                          )}
                          <input
                            id="fileInput"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Button Text</label>
                        <input
                          type="text"
                          className="form-control"
                          name="button_text"
                          value={form.button_text}
                          onChange={handleFormChange}
                          placeholder="e.g., Get Started"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Button Link</label>
                        <input
                          type="text"
                          className="form-control"
                          name="button_link"
                          value={form.button_link}
                          onChange={handleFormChange}
                          placeholder="e.g., /courses"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Sort Order</label>
                        <input
                          type="number"
                          className="form-control"
                          name="sort_order"
                          value={form.sort_order}
                          onChange={handleFormChange}
                          min="0"
                        />
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            name="is_active"
                            checked={form.is_active}
                            onChange={handleFormChange}
                            id="isActive"
                          />
                          <label className="form-check-label" htmlFor="isActive">
                            Active
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                    {editingSlider ? 'Update Slider' : 'Add Slider'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlidersAdmin; 