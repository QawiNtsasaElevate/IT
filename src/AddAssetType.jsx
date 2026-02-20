import React, { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function AddAssetType() {
  const navigate = useNavigate();
  
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('Asset Types')
      .insert([{ 'Type': type }]);

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
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Add New Asset Type</h1>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label htmlFor="type" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Type *</label>
          <input 
            id="type" 
            type="text"
            value={type} 
            onChange={e => setType(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '12px', background: '#28a745', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px', border: 'none', marginTop: '10px', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Saving...' : '+ Add Asset Type'}
        </button>
      </form>
    </div>
  );
}
