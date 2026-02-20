import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function ModifyAsset() {
  const navigate = useNavigate();
  
  // Data for Dropdowns
  const [models, setModels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // Selection State
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Optional Fields
  const [assignedToNotes, setAssignedToNotes] = useState('');
  const [quantity, setQuantity] = useState('');
  const [companyId, setCompanyId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [assetSelected, setAssetSelected] = useState(false);

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      
      const [mRes, lRes, tRes, sRes, aRes] = await Promise.all([
        supabase.from('Models').select('"Model Name"'),
        supabase.from('Office Locations').select('"Office Name"'),
        supabase.from('Asset Types').select('"Type"'),
        supabase.from('Asset Status').select('"Status Type"'),
        supabase.from('Assets').select('*')
      ]);

      setModels(mRes.data || []);
      setLocations(lRes.data || []);
      setTypes(tRes.data || []);
      setStatuses(sRes.data || []);
      setAssets(aRes.data || []);
      setLoading(false);
    }

    fetchAllData();
  }, []);

  const filteredAssets = assets.filter(asset =>
    asset.Model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset['Asset Type'].toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset['Office Location'].toLowerCase().includes(searchQuery.toLowerCase()) ||
    (asset['Serial Tag'] && asset['Serial Tag'].toLowerCase().includes(searchQuery.toLowerCase())) ||
    (asset['Company ID'] && asset['Company ID'].toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssetSelect = (assetId) => {
    setSelectedAssetId(assetId);
    const asset = assets.find(a => a.id === parseInt(assetId));
    if (asset) {
      setSelectedModel(asset.Model);
      setSelectedLocation(asset['Office Location']);
      setSelectedType(asset['Asset Type']);
      setSelectedStatus(asset.Status);
      setAssignedToNotes(asset['Serial Tag'] || '');
      setQuantity(asset['Quantity']?.toString() || '');
      setCompanyId(asset['Company ID'] || '');
      setAssetSelected(true);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedAssetId) {
      alert("Please select an asset to modify");
      return;
    }

    const { error } = await supabase
      .from('Assets')
      .update({
        'Model': selectedModel,
        'Office Location': selectedLocation,
        'Asset Type': selectedType,
        'Status': selectedStatus,
        'Serial Tag': assignedToNotes || null,
        'Quantity': quantity ? parseInt(quantity) : null,
        'Company ID': companyId || null
      })
      .eq('id', parseInt(selectedAssetId));

    if (error) {
      alert("Error updating asset: " + error.message);
    } else {
      alert("Asset updated successfully!");
      navigate('/');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Database...</div>;

  const selectedAsset = assets.find(a => a.id === parseInt(selectedAssetId));

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Modify Asset</h1>

      {assets.length === 0 ? (
        <p>No assets available to modify.</p>
      ) : (
        <>
          <div style={{ marginBottom: '30px' }}>
            <label htmlFor="search" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Search Assets *</label>
            <input 
              id="search"
              type="text"
              placeholder="Search by model, type, location, assigned to/notes, or company ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Select Asset to Modify *</label>
            {filteredAssets.length > 0 ? (
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredAssets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => handleAssetSelect(asset.id)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedAssetId === asset.id ? '#FFE8DC' : 'white',
                      borderLeft: selectedAssetId === asset.id ? '4px solid #FF5722' : '4px solid transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = selectedAssetId === asset.id ? '#FFE8DC' : '#f9f9f9'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = selectedAssetId === asset.id ? '#FFE8DC' : 'white'}
                  >
                    <div style={{ fontWeight: '500', color: '#000000' }}>{asset.Model}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                      {asset['Company ID'] && `${asset['Company ID']} • `}
                      {asset['Serial Tag'] && `${asset['Serial Tag']} • `}
                      {asset['Asset Type']} • {asset['Office Location']}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545', border: '1px solid #f5c6cb', borderRadius: '4px', backgroundColor: '#f8d7da', marginTop: '4px' }}>
                No matching assets found
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', marginTop: '4px' }}>
                Type to search for assets
              </div>
            )}
          </div>

          {assetSelected && (
            <>
              <div style={{ padding: '15px', backgroundColor: '#FFE8DC', border: '1px solid #FFB366', borderRadius: '4px', marginTop: '10px' }}>
                <h3 style={{ marginTop: 0, color: '#FF5722' }}>Current Asset Details:</h3>
                <p><strong>Model:</strong> {selectedAsset.Model}</p>
                <p><strong>Type:</strong> {selectedAsset['Asset Type']}</p>
                <p><strong>Location:</strong> {selectedAsset['Office Location']}</p>
                <p><strong>Status:</strong> {selectedAsset.Status}</p>
                <p><strong>Quantity:</strong> {selectedAsset.Quantity}</p>
                {selectedAsset['Serial Tag'] && <p><strong>Assigned To/Notes:</strong> {selectedAsset['Serial Tag']}</p>}
                {selectedAsset['Company ID'] && <p><strong>Company ID:</strong> {selectedAsset['Company ID']}</p>}
              </div>

              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                
                <div>
                  <label htmlFor="model" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Model Name *</label>
                <select id="model" value={selectedModel} onChange={e => setSelectedModel(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                  <option value="">-- Select --</option>
                  {models.map(m => (
                    <option key={m['Model Name']} value={m['Model Name']}>{m['Model Name']}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Office Location *</label>
                <select id="location" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                  <option value="">-- Select --</option>
                  {locations.map(l => (
                    <option key={l['Office Name']} value={l['Office Name']}>{l['Office Name']}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Asset Type *</label>
                <select id="type" value={selectedType} onChange={e => setSelectedType(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                  <option value="">-- Select --</option>
                  {types.map(t => (
                    <option key={t['Type']} value={t['Type']}>{t['Type']}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Status *</label>
                <select id="status" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                  <option value="">-- Select --</option>
                  {statuses.map(s => (
                    <option key={s['Status Type']} value={s['Status Type']}>{s['Status Type']}</option>
                  ))}
                </select>
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
                  value={assignedToNotes}
                  onChange={e => setAssignedToNotes(e.target.value)}
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

              <button type="submit" style={{ padding: '12px', background: '#6c757d', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px', border: 'none', marginTop: '10px' }}>
                ✎ Update Asset
              </button>
            </form>
            </>
          )}
        </>
      )}
    </div>
  );
}
