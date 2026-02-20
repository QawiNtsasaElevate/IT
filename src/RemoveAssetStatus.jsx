import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function RemoveAssetStatus() {
  const navigate = useNavigate();
  
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatuses() {
      const { data, error } = await supabase
        .from('Asset Status')
        .select('*');

      if (error) {
        console.error('Error fetching statuses:', error);
      } else {
        setStatuses(data || []);
      }
      setLoading(false);
    }

    fetchStatuses();
  }, []);

  const filteredStatuses = statuses.filter(status =>
    status['Status Type'].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemove = async () => {
    if (!selectedStatus) {
      alert('Please select a status to remove');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove this status? This may affect related assets.`);
    if (!confirmed) return;

    setLoading(true);
    const { error } = await supabase
      .from('Asset Status')
      .delete()
      .eq('Status Type', selectedStatus);

    setLoading(false);
    if (error) {
      alert("Error removing: " + error.message);
    } else {
      alert('Status removed successfully');
      navigate('/');
    }
  };

  if (loading && statuses.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Statuses...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Remove Asset Status</h1>

      {statuses.length === 0 ? (
        <p>No statuses available to remove.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '0' }}>
          <div>
            <label htmlFor="search" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Search Asset Statuses *</label>
            <input 
              id="search"
              type="text"
              placeholder="Search by status name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Select Asset Status to Remove *</label>
            {filteredStatuses.length > 0 ? (
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredStatuses.map(s => (
                  <div
                    key={s['Status Type']}
                    onClick={() => setSelectedStatus(s['Status Type'])}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedStatus === s['Status Type'] ? '#FFE8DC' : 'white',
                    borderLeft: selectedStatus === s['Status Type'] ? '4px solid #FF5722' : '4px solid transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = selectedStatus === s['Status Type'] ? '#FFE8DC' : '#f9f9f9'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = selectedStatus === s['Status Type'] ? '#FFE8DC' : 'white'}
                  >
                    <div style={{ fontWeight: '500', color: '#000000' }}>{s['Status Type']}</div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545', border: '1px solid #f5c6cb', borderRadius: '4px', backgroundColor: '#f8d7da', marginTop: '4px' }}>
                No matching statuses found
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', marginTop: '4px' }}>
                Type to search for statuses
              </div>
            )}
          </div>

          <button 
            onClick={handleRemove} 
            disabled={loading || !selectedStatus}
            style={{ 
              padding: '12px', 
              background: '#e74c3c', 
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '4px',
              border: 'none',
              opacity: loading || !selectedStatus ? 0.5 : 1
            }}
          >
            {loading ? 'Removing...' : '- Remove Status'}
          </button>
        </div>
      )}
    </div>
  );
}
