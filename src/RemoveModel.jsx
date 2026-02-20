import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function RemoveModel() {
  const navigate = useNavigate();
  
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  const handleRemove = async () => {
    if (!selectedModel) {
      alert('Please select a model to remove');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove this model? This may affect related assets.`);
    if (!confirmed) return;

    setLoading(true);
    const { error } = await supabase
      .from('Models')
      .delete()
      .eq('Model Name', selectedModel);

    setLoading(false);
    if (error) {
      alert("Error removing: " + error.message);
    } else {
      alert('Model removed successfully');
      navigate('/');
    }
  };

  if (loading && models.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Models...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Remove Model</h1>

      {models.length === 0 ? (
        <p>No models available to remove.</p>
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
              style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Select Model to Remove *</label>
            {filteredModels.length > 0 ? (
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredModels.map(m => (
                  <div
                    key={m['Model Name']}
                    onClick={() => setSelectedModel(m['Model Name'])}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedModel === m['Model Name'] ? '#FFE8DC' : 'white',
                    borderLeft: selectedModel === m['Model Name'] ? '4px solid #FF5722' : '4px solid transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = selectedModel === m['Model Name'] ? '#FFE8DC' : '#f9f9f9'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = selectedModel === m['Model Name'] ? '#FFE8DC' : 'white'}
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

          <button 
            onClick={handleRemove} 
            disabled={loading || !selectedModel}
            style={{ 
              padding: '12px', 
              background: '#e74c3c', 
              color: 'white', 
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '4px',
              border: 'none',
              opacity: loading || !selectedModel ? 0.5 : 1
            }}
          >
            {loading ? 'Removing...' : '- Remove Model'}
          </button>
        </div>
      )}
    </div>
  );
}
