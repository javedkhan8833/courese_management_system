import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

function PaymentProofForm() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch bank accounts
    const fetchAccounts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/bank-accounts', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        setBankAccounts(data);
        if (data.length > 0) setSelectedBank(data[0].id);
      } catch {
        setMessage('Failed to load bank accounts');
      }
    };
    fetchAccounts();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    if (!file) {
      setMessage('Please attach a payment proof file.');
      setSubmitting(false);
      return;
    }
    try {
      // 1. Upload payment proof
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch('http://localhost:5000/api/upload/payment-proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');
      const proofUrl = uploadData.url;

      // 2. Enroll in course (send proof URL and selected bank)
      const selectedBankAccount = bankAccounts.find(bank => bank.id == selectedBank);
      const bankAccountInfo = selectedBankAccount ? `${selectedBankAccount.bank_name} - ${selectedBankAccount.bank_number}` : selectedBank;
      
      const enrollRes = await fetch('http://localhost:5000/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ course_id: courseId, payment_proof: proofUrl, bank_account: bankAccountInfo })
      });
      const enrollData = await enrollRes.json();
      if (!enrollRes.ok) throw new Error(enrollData.message || 'Enrollment failed');
      setMessage('Enrollment successful!');
      setTimeout(() => navigate('/courses'), 1500);
    } catch (err) {
      console.error('Enrollment error:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setMessage(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 500 }}>
      <h2 className="mb-4 text-center">Payment Proof Submission</h2>
      {message && <div className="alert alert-info text-center">{message}</div>}
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label">Select Bank Account</label>
          <select className="form-select" value={selectedBank} onChange={e => setSelectedBank(e.target.value)} required>
            {bankAccounts.map(bank => (
              <option key={bank.id} value={bank.id}>
                {bank.bank_name} ({bank.bank_number})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Attach Payment Proof (image/pdf)</label>
          <input type="file" className="form-control" accept="image/*,application/pdf" onChange={handleFileChange} required />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit & Enroll'}
        </button>
      </form>
    </div>
  );
}

export default PaymentProofForm; 