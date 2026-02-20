import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Link } from 'react-router-dom';
import { exportToCSV } from './utils/csvExport';

export default function ViewOfficeLocations() {
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('Office Locations')
        .select('*');

      if (error) {
        setError(error.message);
      } else {
        setLocations(data || []);
      }
    };
    fetchLocations();
  }, []);

  const filteredLocations = locations.filter(location =>
    location['Office Name'].toLowerCase().includes(searchQuery.toLowerCase()) ||
    (location['Address'] && location['Address'].toLowerCase().includes(searchQuery.toLowerCase())) ||
    (location['Phone Number'] && location['Phone Number'].toLowerCase().includes(searchQuery.toLowerCase())) ||
    (location['Office Manager'] && location['Office Manager'].toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExport = () => {
    exportToCSV(filteredLocations, `office_locations_export_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'sans-serif',
      width: '100%'
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block', fontSize: '16px' }}>← Back to Home</Link>
      <h1 style={{ margin: '20px 0 40px 0', fontSize: '48px', color: '#000000', fontWeight: 'bold', textAlign: 'center' }}>View Office Locations</h1>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {locations.length === 0 && !error && <p>Loading locations or table is empty...</p>}

        {/* Search Section */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="text"
            placeholder="Search by office name, address, phone, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '15px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
              minWidth: '300px'
            }}
          />
          <button 
            onClick={handleExport}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            ⬇️ Export CSV
          </button>
        </div>

        <table border="1" cellPadding="15" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4' }}>
              <th style={{ fontSize: '16px', fontWeight: 'bold' }}>Office Name</th>
              <th style={{ fontSize: '16px', fontWeight: 'bold' }}>Address</th>
              <th style={{ fontSize: '16px', fontWeight: 'bold' }}>Phone Number</th>
              <th style={{ fontSize: '16px', fontWeight: 'bold' }}>Office Manager</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocations.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>
                  {searchQuery ? 'No matching locations found' : 'No locations available'}
                </td>
              </tr>
            ) : (
              filteredLocations.map((location) => (
                <tr key={location['Office Name']}>
                  <td>{location['Office Name']}</td>
                  <td>{location['Address'] || '-'}</td>
                  <td>{location['Phone Number'] || '-'}</td>
                  <td>{location['Office Manager'] || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
