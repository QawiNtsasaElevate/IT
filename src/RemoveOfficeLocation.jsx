import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function RemoveOfficeLocation() {
  const navigate = useNavigate();
  
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      const { data, error } = await supabase
        .from('Office Locations')
        .select('*');

      if (error) {
        console.error('Error fetching locations:', error);
      } else {
        setLocations(data || []);
      }
      setLoading(false);
    }

    fetchLocations();
  }, []);

  const filteredLocations = locations.filter(location =>
    location['Office Name'].toLowerCase().includes(searchQuery.toLowerCase()) ||
    (location['Address'] && location['Address'].toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRemove = async () => {
    if (!selectedLocation) {
      alert('Please select a location to remove');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove this location? This may affect related assets.`);
    if (!confirmed) return;

    setLoading(true);
    const { error } = await supabase
      .from('Office Locations')
      .delete()
      .eq('Office Name', selectedLocation);

    setLoading(false);
    if (error) {
      alert("Error removing: " + error.message);
    } else {
      alert('Location removed successfully');
      navigate('/');
    }
  };

  if (loading && locations.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Locations...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Remove Office Location</h1>

      {locations.length === 0 ? (
        <p>No locations available to remove.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '0' }}>
          <div>
            <label htmlFor="search" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Search Locations *</label>
            <input 
              id="search"
              type="text"
              placeholder="Search by office name or address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Select Location to Remove *</label>
            {filteredLocations.length > 0 ? (
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredLocations.map(l => (
                  <div
                    key={l['Office Name']}
                    onClick={() => setSelectedLocation(l['Office Name'])}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedLocation === l['Office Name'] ? '#FFE8DC' : 'white',
                    borderLeft: selectedLocation === l['Office Name'] ? '4px solid #FF5722' : '4px solid transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = selectedLocation === l['Office Name'] ? '#FFE8DC' : '#f9f9f9'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = selectedLocation === l['Office Name'] ? '#FFE8DC' : 'white'}
                  >
                    <div style={{ fontWeight: '500', color: '#000000' }}>{l['Office Name']}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{l['Address']}</div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545', border: '1px solid #f5c6cb', borderRadius: '4px', backgroundColor: '#f8d7da', marginTop: '4px' }}>
                No matching locations found
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', marginTop: '4px' }}>
                Type to search for locations
              </div>
            )}
          </div>

          <button 
            onClick={handleRemove} 
            disabled={loading || !selectedLocation}
            style={{ 
              padding: '12px', 
              background: '#e74c3c', 
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '4px',
              border: 'none',
              opacity: loading || !selectedLocation ? 0.5 : 1
            }}
          >
            {loading ? 'Removing...' : '- Remove Location'}
          </button>
        </div>
      )}
    </div>
  );
}
