import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function ModifyModel() {
  const navigate = useNavigate();
  
  const [models, setModels] = useState([]);
  const [selectedModelName, setSelectedModelName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modelSelected, setModelSelected] = useState(false);
  
  // Form fields
  const [editModelName, setEditModelName] = useState('');
  const [editManufacturer, setEditManufacturer] = useState('');
  const [editSpecs, setEditSpecs] = useState('');
  const [editModelType, setEditModelType] = useState('');

  useEffect(() => {
    async function fetchModels() {
      const { data, error } = await supabase
        .from('Models')
        .select('*');

      if (error) {
        console.error('Error fetching models:', error);
      } else {
        setModels(data || []);
      }
      setLoading(false);
    }

    fetchModels();
  }, []);

  const filteredModels = models.filter(model =>
    model['Model Name'].toLowerCase().includes(searchQuery.toLowerCase()) ||
    (model['Manufacturer'] && model['Manufacturer'].toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleModelSelect = (modelName) => {
    setSelectedModelName(modelName);
    const model = models.find(m => m['Model Name'] === modelName);
    if (model) {
      setEditModelName(model['Model Name']);
      setEditManufacturer(model['Manufacturer'] || '');
      setEditSpecs(model['Specs'] || '');
      setEditModelType(model['Model Type'] || '');
      setModelSelected(true);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedModelName) {
      alert("Please select a model to modify");
      return;
    }

    const { error } = await supabase
      .from('Models')
      .update({
        'Model Name': editModelName,
        'Manufacturer': editManufacturer || null,
        'Specs': editSpecs || null,
        'Model Type': editModelType || null
      })
      .eq('Model Name', selectedModelName);

    if (error) {
      alert("Error updating model: " + error.message);
    } else {
      alert('Model updated successfully');
      navigate('/');
    }
  };

  const currentModel = models.find(m => m['Model Name'] === selectedModelName);

  if (loading && models.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Models...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Modify Model</h1>

      {models.length === 0 ? (
        <p>No models available to modify.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '0' }}>
          <div>
            <label htmlFor="search" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Search Models *</label>
            <input 
              id="search"
              type="text"
              placeholder="Search by model name or manufacturer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Select Model to Modify *</label>
            {filteredModels.length > 0 ? (
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredModels.map(m => (
                  <div
                    key={m['Model Name']}
                    onClick={() => handleModelSelect(m['Model Name'])}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedModelName === m['Model Name'] ? '#FFE8DC' : 'white',
                      borderLeft: selectedModelName === m['Model Name'] ? '4px solid #FF5722' : '4px solid transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = selectedModelName === m['Model Name'] ? '#FFE8DC' : '#f9f9f9'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = selectedModelName === m['Model Name'] ? '#FFE8DC' : 'white'}
                  >
                    <div style={{ fontWeight: '500', color: '#000000' }}>{m['Model Name']}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{m['Manufacturer']}</div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545', border: '1px solid #f5c6cb', borderRadius: '4px', backgroundColor: '#f8d7da', marginTop: '4px' }}>
                No matching models found
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', marginTop: '4px' }}>
                Type to search for models
              </div>
            )}
          </div>

          {modelSelected && currentModel && (
            <div style={{ padding: '16px', backgroundColor: '#FFE8DC', border: '1px solid #FFB366', borderRadius: '4px', marginTop: '20px' }}>
              <div style={{ fontWeight: '600', color: '#FF5722', marginBottom: '12px' }}>Current Model Details</div>
              <div style={{ fontSize: '14px', color: '#333' }}>
                <div><strong>Model Name:</strong> {currentModel['Model Name']}</div>
                <div style={{ marginTop: '8px' }}><strong>Manufacturer:</strong> {currentModel['Manufacturer'] || 'N/A'}</div>
                <div style={{ marginTop: '8px' }}><strong>Specs:</strong> {currentModel['Specs'] || 'N/A'}</div>
                <div style={{ marginTop: '8px' }}><strong>Model Type:</strong> {currentModel['Model Type'] || 'N/A'}</div>
              </div>
            </div>
          )}

          {modelSelected && (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <div>
                <label htmlFor="modelName" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Model Name *</label>
                <input 
                  id="modelName"
                  type="text"
                  value={editModelName}
                  onChange={e => setEditModelName(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label htmlFor="manufacturer" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Manufacturer</label>
                <input 
                  id="manufacturer"
                  type="text"
                  value={editManufacturer}
                  onChange={e => setEditManufacturer(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label htmlFor="specs" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Specs</label>
                <input 
                  id="specs"
                  type="text"
                  value={editSpecs}
                  onChange={e => setEditSpecs(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label htmlFor="modelType" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Model Type</label>
                <input 
                  id="modelType"
                  type="text"
                  value={editModelType}
                  onChange={e => setEditModelType(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                style={{ 
                  padding: '12px', 
                  background: '#28a745', 
                  color: 'white', 
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  border: 'none',
                  marginTop: '10px'
                }}
              >
                ✓ Update Model
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
