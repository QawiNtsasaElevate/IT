import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function ModifyOfficeLocation() {
  const navigate = useNavigate();
  
  const [locations, setLocations] = useState([]);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [locationSelected, setLocationSelected] = useState(false);
  
  // Form fields
  const [editLocationName, setEditLocationName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editOfficeManager, setEditOfficeManager] = useState('');

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

  const handleLocationSelect = (locationName) => {
    setSelectedLocationName(locationName);
    const location = locations.find(l => l['Office Name'] === locationName);
    if (location) {
      setEditLocationName(location['Office Name']);
      setEditAddress(location['Address'] || '');
      setEditPhoneNumber(location['Phone Number'] || '');
      setEditOfficeManager(location['Office Manager'] || '');
      setLocationSelected(true);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedLocationName) {
      alert("Please select a location to modify");
      return;
    }

    const { error } = await supabase
      .from('Office Locations')
      .update({
        'Office Name': editLocationName,
        'Address': editAddress || null,
        'Phone Number': editPhoneNumber || null,
        'Office Manager': editOfficeManager || null
      })
      .eq('Office Name', selectedLocationName);

    if (error) {
      alert("Error updating location: " + error.message);
    } else {
      alert('Location updated successfully');
      navigate('/');
    }
  };

  const currentLocation = locations.find(l => l['Office Name'] === selectedLocationName);

  if (loading && locations.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Locations...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Modify Office Location</h1>

      {locations.length === 0 ? (
        <p>No locations available to modify.</p>
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
              style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Select Location to Modify *</label>
            {filteredLocations.length > 0 ? (
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredLocations.map(l => (
                  <div
                    key={l['Office Name']}
                    onClick={() => handleLocationSelect(l['Office Name'])}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedLocationName === l['Office Name'] ? '#FFE8DC' : 'white',
                      borderLeft: selectedLocationName === l['Office Name'] ? '4px solid #FF5722' : '4px solid transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = selectedLocationName === l['Office Name'] ? '#FFE8DC' : '#f9f9f9'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = selectedLocationName === l['Office Name'] ? '#FFE8DC' : 'white'}
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

          {locationSelected && currentLocation && (
            <div style={{ padding: '16px', backgroundColor: '#FFE8DC', border: '1px solid #FFB366', borderRadius: '4px', marginTop: '20px' }}>
              <div style={{ fontWeight: '600', color: '#FF5722', marginBottom: '12px' }}>Current Location Details</div>
              <div style={{ fontSize: '14px', color: '#333' }}>
                <div><strong>Office Name:</strong> {currentLocation['Office Name']}</div>
                <div style={{ marginTop: '8px' }}><strong>Address:</strong> {currentLocation['Address'] || 'N/A'}</div>
                <div style={{ marginTop: '8px' }}><strong>Phone Number:</strong> {currentLocation['Phone Number'] || 'N/A'}</div>
                <div style={{ marginTop: '8px' }}><strong>Office Manager:</strong> {currentLocation['Office Manager'] || 'N/A'}</div>
              </div>
            </div>
          )}

          {locationSelected && (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <div>
                <label htmlFor="locationName" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Office Name *</label>
                <input 
                  id="locationName"
                  type="text"
                  value={editLocationName}
                  onChange={e => setEditLocationName(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label htmlFor="address" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Address</label>
                <input 
                  id="address"
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Phone Number</label>
                <input 
                  id="phoneNumber"
                  type="text"
                  value={editPhoneNumber}
                  onChange={e => setEditPhoneNumber(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label htmlFor="officeManager" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Office Manager</label>
                <input 
                  id="officeManager"
                  type="text"
                  value={editOfficeManager}
                  onChange={e => setEditOfficeManager(e.target.value)}
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
                ✓ Update Location
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
