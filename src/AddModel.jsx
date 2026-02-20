import React, { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function AddModel() {
  const navigate = useNavigate();
  
  const [modelName, setModelName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [specs, setSpecs] = useState('');
  const [modelType, setModelType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('Models')
      .insert([{
        'Model Name': modelName,
        'Manufacturer': manufacturer,
        'Specs': specs,
        'Model Type': modelType
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
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Add New Model</h1>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label htmlFor="modelName" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Model Name *</label>
          <input 
            id="modelName" 
            type="text"
            value={modelName} 
            onChange={e => setModelName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="manufacturer" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Manufacturer</label>
          <input 
            id="manufacturer" 
            type="text"
            value={manufacturer} 
            onChange={e => setManufacturer(e.target.value)} 
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="specs" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Specs</label>
          <textarea 
            id="specs" 
            value={specs} 
            onChange={e => setSpecs(e.target.value)} 
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', minHeight: '100px', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label htmlFor="modelType" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Model Type</label>
          <input 
            id="modelType" 
            type="text"
            value={modelType} 
            onChange={e => setModelType(e.target.value)} 
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '12px', background: '#28a745', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px', border: 'none', marginTop: '10px', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Saving...' : '+ Add Model'}
        </button>
      </form>
    </div>
  );
}
