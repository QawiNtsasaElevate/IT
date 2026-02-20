import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function RemoveAssetType() {
  const navigate = useNavigate();
  
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTypes() {
      const { data, error } = await supabase
        .from('Asset Types')
        .select('*');

      if (error) {
        console.error('Error fetching types:', error);
      } else {
        setTypes(data || []);
      }
      setLoading(false);
    }

    fetchTypes();
  }, []);

  const filteredTypes = types.filter(type =>
    type['Type'].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemove = async () => {
    if (!selectedType) {
      alert('Please select a type to remove');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove this asset type? This may affect related assets.`);
    if (!confirmed) return;

    setLoading(true);
    const { error } = await supabase
      .from('Asset Types')
      .delete()
      .eq('Type', selectedType);

    setLoading(false);
    if (error) {
      alert("Error removing: " + error.message);
    } else {
      alert('Asset type removed successfully');
      navigate('/');
    }
  };

  if (loading && types.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Asset Types...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Remove Asset Type</h1>

      {types.length === 0 ? (
        <p>No asset types available to remove.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '0' }}>
          <div>
            <label htmlFor="search" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Search Asset Types *</label>
            <input 
              id="search"
              type="text"
              placeholder="Search by type name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Select Asset Type to Remove *</label>
            {filteredTypes.length > 0 ? (
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredTypes.map(t => (
                  <div
                    key={t['Type']}
                    onClick={() => setSelectedType(t['Type'])}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedType === t['Type'] ? '#FFE8DC' : 'white',
                    borderLeft: selectedType === t['Type'] ? '4px solid #FF5722' : '4px solid transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = selectedType === t['Type'] ? '#FFE8DC' : '#f9f9f9'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = selectedType === t['Type'] ? '#FFE8DC' : 'white'}
                  >
                    <div style={{ fontWeight: '500', color: '#000000' }}>{t['Type']}</div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545', border: '1px solid #f5c6cb', borderRadius: '4px', backgroundColor: '#f8d7da', marginTop: '4px' }}>
                No matching types found
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', marginTop: '4px' }}>
                Type to search for types
              </div>
            )}
          </div>

          <button 
            onClick={handleRemove} 
            disabled={loading || !selectedType}
            style={{ 
              padding: '12px', 
              background: '#e74c3c', 
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '4px',
              border: 'none',
              opacity: loading || !selectedType ? 0.5 : 1
            }}
          >
            {loading ? 'Removing...' : '- Remove Asset Type'}
          </button>
        </div>
      )}
    </div>
  );
}
