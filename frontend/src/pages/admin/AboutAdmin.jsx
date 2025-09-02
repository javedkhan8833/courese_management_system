import React, { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
function AboutAdmin() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const quillRef = useRef(null);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/about')
      .then(res => res.json())
      .then(data => {
        setContent(data.content || '');
        setLoading(false);
      })
      .catch(() => {
        setMessage('Failed to load about content');
        setLoading(false);
      });
  }, []);

  const handleContentChange = (newContent) => {
    console.log('Content changed:', newContent);
    setContent(newContent);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    fetch('http://localhost:5000/api/about', {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message || 'Saved!');
      })
      .catch(() => setMessage('Failed to save'))
      .finally(() => setSaving(false));
  };

  // Simple modules configuration without custom handlers
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image'
  ];

  if (loading) {
    return (
      <div className="container py-4">
        <h2 className="mb-4">Edit About Page</h2>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <h2 className="mb-4">Edit About Page</h2>
      {message && <div className="alert alert-info">{message}</div>}
      
      <form onSubmit={handleSave} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label">About Content</label>
          <div style={{ border: '1px solid #ccc', borderRadius: '4px' }}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              placeholder="Start typing your about content here..."
            />
          </div>
          <div className="mt-2">
            <small className="text-muted">Content length: {content.length} characters</small>
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>

    </div>
  );
}

export default AboutAdmin; 