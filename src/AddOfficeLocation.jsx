import React, { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function AddOfficeLocation() {
  const navigate = useNavigate();
  
  const [address, setAddress] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [officeManager, setOfficeManager] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('Office Locations')
      .insert([{
        'Address': address,
        'Office Name': officeName,
        'Phone Number': phoneNumber,
        'Office Manager': officeManager
      }]);

    setLoading(false);
    if (error) {
      alert("Error saving: " + error.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Add New Office Location</h1>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label htmlFor="address" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Address</label>
          <input 
            id="address" 
            type="text"
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="officeName" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Office Name *</label>
          <input 
            id="officeName" 
            type="text"
            value={officeName} 
            onChange={e => setOfficeName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Phone Number</label>
          <input 
            id="phoneNumber" 
            type="text"
            value={phoneNumber} 
            onChange={e => setPhoneNumber(e.target.value)} 
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="officeManager" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Office Manager</label>
          <input 
            id="officeManager" 
            type="text"
            value={officeManager} 
            onChange={e => setOfficeManager(e.target.value)} 
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '12px', background: '#28a745', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px', border: 'none', marginTop: '10px', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Saving...' : '+ Add Location'}
        </button>
      </form>
    </div>
  );
}
