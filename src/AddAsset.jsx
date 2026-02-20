import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function AddAsset() {
  const navigate = useNavigate();
  
  // Data for Dropdowns
  const [models, setModels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  
  // Selection State
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Search State
  const [searchModel, setSearchModel] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  
  // Optional Fields
  const [serialTag, setSerialTag] = useState('');
  const [quantity, setQuantity] = useState('');
  const [companyId, setCompanyId] = useState('');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      
      // Fetching using the EXACT column names with spaces as per your DB
      const [mRes, lRes, tRes, sRes] = await Promise.all([
        supabase.from('Models').select('"Model Name"'),
        supabase.from('Office Locations').select('"Office Name"'),
        supabase.from('Asset Types').select('"Type"'),
        supabase.from('Asset Status').select('"Status Type"')
      ]);

      setModels(mRes.data || []);
      setLocations(lRes.data || []);
      setTypes(tRes.data || []);
      setStatuses(sRes.data || []);
      setLoading(false);
    }

    fetchAllData();
  }, []);

  const filteredModels = models.filter(m => m['Model Name'].toLowerCase().includes(searchModel.toLowerCase()));
  const filteredLocations = locations.filter(l => l['Office Name'].toLowerCase().includes(searchLocation.toLowerCase()));
  const filteredTypes = types.filter(t => t['Type'].toLowerCase().includes(searchType.toLowerCase()));
  const filteredStatuses = statuses.filter(s => s['Status Type'].toLowerCase().includes(searchStatus.toLowerCase()));

  const handleSave = async (e) => {
    e.preventDefault();
    
    // The keys here MUST match the 'Assets' table columns exactly
    const { error } = await supabase
      .from('Assets')
      .insert([{
        'Model': selectedModel,
        'Office Location': selectedLocation,
        'Asset Type': selectedType,
        'Status': selectedStatus,
        'Serial Tag': serialTag || null,
        'Quantity': quantity ? parseInt(quantity) : null,
        'Company ID': companyId || null,
        'Date Added': new Date().toISOString()
      }]);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      navigate('/');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Database...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Add New Asset</h1>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Model Name *</label>
          <input
            type="text"
            placeholder="Search models..."
            value={searchModel}
            onChange={e => setSearchModel(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', marginBottom: '10px' }}
          />
          {filteredModels.length > 0 ? (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', maxHeight: '250px', overflowY: 'auto' }}>
              {filteredModels.map(m => (
                <div
                  key={m['Model Name']}
                  onClick={() => setSelectedModel(m['Model Name'])}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedModel === m['Model Name'] ? '#FFE8DC' : 'white',
                    borderLeft: selectedModel === m['Model Name'] ? '4px solid #FF5722' : '4px solid transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = selectedModel === m['Model Name'] ? '#FFE8DC' : '#f9f9f9'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = selectedModel === m['Model Name'] ? '#FFE8DC' : 'white'}
                >
                  {m['Model Name']}
                </div>
              ))}
            </div>
          ) : searchModel ? (
            <div style={{ padding: '15px', textAlign: 'center', color: '#dc3545', border: '1px solid #f5c6cb', borderRadius: '4px', backgroundColor: '#f8d7da' }}>
              No matching models found
            </div>
          ) : (
            <div style={{ padding: '15px', textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              Type to search
            </div>
          )}
        </div>

        <div>
          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Office Location *</label>
          <input
            type="text"
            placeholder="Search locations..."
            value={searchLocation}
            onChange={e => setSearchLocation(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', marginBottom: '10px' }}
          />
          {filteredLocations.length > 0 ? (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', maxHeight: '250px', overflowY: 'auto' }}>
              {filteredLocations.map(l => (
                <div
                  key={l['Office Name']}
                  onClick={() => setSelectedLocation(l['Office Name'])}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedLocation === l['Office Name'] ? '#FFE8DC' : 'white',
                    borderLeft: selectedLocation === l['Office Name'] ? '4px solid #FF5722' : '4px solid transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = selectedLocation === l['Office Name'] ? '#FFE8DC' : '#f9f9f9'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = selectedLocation === l['Office Name'] ? '#FFE8DC' : 'white'}
                >
                  {l['Office Name']}
                </div>
              ))}
            </div>
          ) : searchLocation ? (
            <div style={{ padding: '15px', textAlign: 'center', color: '#dc3545', border: '1px solid #f5c6cb', borderRadius: '4px', backgroundColor: '#f8d7da' }}>
              No matching locations found
            </div>
          ) : (
            <div style={{ padding: '15px', textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              Type to search
            </div>
          )}
        </div>

        <div>
          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Asset Type *</label>
          <input
            type="text"
            placeholder="Search types..."
            value={searchType}
            onChange={e => setSearchType(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', marginBottom: '10px' }}
          />
          {filteredTypes.length > 0 ? (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', maxHeight: '250px', overflowY: 'auto' }}>
              {filteredTypes.map(t => (
                <div
                  key={t['Type']}
                  onClick={() => setSelectedType(t['Type'])}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedType === t['Type'] ? '#FFE8DC' : 'white',
                    borderLeft: selectedType === t['Type'] ? '4px solid #FF5722' : '4px solid transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = selectedType === t['Type'] ? '#FFE8DC' : '#f9f9f9'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = selectedType === t['Type'] ? '#FFE8DC' : 'white'}
                >
                  {t['Type']}
                </div>
              ))}
            </div>
          ) : searchType ? (
            <div style={{ padding: '15px', textAlign: 'center', color: '#dc3545', border: '1px solid #f5c6cb', borderRadius: '4px', backgroundColor: '#f8d7da' }}>
              No matching types found
            </div>
          ) : (
            <div style={{ padding: '15px', textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              Type to search
            </div>
          )}
        </div>

        <div>
          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Status *</label>
          <input
            type="text"
            placeholder="Search statuses..."
            value={searchStatus}
            onChange={e => setSearchStatus(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', marginBottom: '10px' }}
          />
          {filteredStatuses.length > 0 ? (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', maxHeight: '250px', overflowY: 'auto' }}>
              {filteredStatuses.map(s => (
                <div
                  key={s['Status Type']}
                  onClick={() => setSelectedStatus(s['Status Type'])}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedStatus === s['Status Type'] ? '#FFE8DC' : 'white',
                    borderLeft: selectedStatus === s['Status Type'] ? '4px solid #FF5722' : '4px solid transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = selectedStatus === s['Status Type'] ? '#FFE8DC' : '#f9f9f9'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = selectedStatus === s['Status Type'] ? '#FFE8DC' : 'white'}
                >
                  {s['Status Type']}
                </div>
              ))}
            </div>
          ) : searchStatus ? (
            <div style={{ padding: '15px', textAlign: 'center', color: '#dc3545', border: '1px solid #f5c6cb', borderRadius: '4px', backgroundColor: '#f8d7da' }}>
              No matching statuses found
            </div>
          ) : (
            <div style={{ padding: '15px', textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              Type to search
            </div>
          )}
        </div>

        <div>
          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Quantity *</label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="Enter quantity..."
            min="1"
            required
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
          />
        </div>

        <div>
          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Assigned To/Notes (Optional)</label>
          <input
            type="text"
            value={serialTag}
            onChange={e => setSerialTag(e.target.value)}
            placeholder="Enter assigned to/notes..."
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
          />
        </div>

        <div>
          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Company ID (Optional)</label>
          <input
            type="text"
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            placeholder="Enter company ID..."
            style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
          />
        </div>

        <button type="submit" style={{ padding: '12px', background: '#28a745', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px', border: 'none', marginTop: '10px' }}>
          + Add Asset
        </button>
      </form>
    </div>
  );
}