import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function RemoveAsset() {
  const navigate = useNavigate();
  
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      setLoading(true);
      const { data, error } = await supabase
        .from('Assets')
        .select('*');

      if (error) {
        alert("Error fetching assets: " + error.message);
      } else {
        setAssets(data || []);
      }
      setLoading(false);
    }

    fetchAssets();
  }, []);

  const filteredAssets = assets.filter(asset =>
    asset.Model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset['Asset Type'].toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset['Office Location'].toLowerCase().includes(searchQuery.toLowerCase()) ||
    (asset['Serial Tag'] && asset['Serial Tag'].toLowerCase().includes(searchQuery.toLowerCase())) ||
    (asset['Company ID'] && asset['Company ID'].toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRemove = async (e) => {
    e.preventDefault();
    
    if (!selectedAssetId) {
      alert("Please select an asset to remove");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to remove this asset? This action cannot be undone.");
    
    if (confirmed) {
      const { error } = await supabase
        .from('Assets')
        .delete()
        .eq('id', selectedAssetId);

      if (error) {
        alert("Error removing asset: " + error.message);
      } else {
        alert("Asset removed successfully!");
        navigate('/');
      }
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading assets...</div>;

  const selectedAsset = assets.find(a => a.id === parseInt(selectedAssetId));

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block' }}>← Back to Home</Link>
      <h1 style={{ color: '#000000', marginBottom: '30px' }}>Remove Asset</h1>

      {assets.length === 0 ? (
        <p>No assets available to remove.</p>
      ) : (
        <form onSubmit={handleRemove} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '0' }}>
          <div>
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

          <div>
            <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block' }}>Select Asset to Remove *</label>
            {filteredAssets.length > 0 ? (
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredAssets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
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

          {selectedAsset && (
            <div style={{ padding: '15px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', marginTop: '10px' }}>
              <h3 style={{ marginTop: 0, color: '#721c24' }}>Asset Details:</h3>
              <p><strong>Model:</strong> {selectedAsset.Model}</p>
              <p><strong>Type:</strong> {selectedAsset['Asset Type']}</p>
              <p><strong>Location:</strong> {selectedAsset['Office Location']}</p>
              <p><strong>Status:</strong> {selectedAsset.Status}</p>
              <p><strong>Quantity:</strong> {selectedAsset.Quantity}</p>
              {selectedAsset['Serial Tag'] && <p><strong>Assigned To/Notes:</strong> {selectedAsset['Serial Tag']}</p>}
              {selectedAsset['Company ID'] && <p><strong>Company ID:</strong> {selectedAsset['Company ID']}</p>}
            </div>
          )}

          <button type="submit" style={{ padding: '12px', background: '#e74c3c', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px', border: 'none', marginTop: '10px' }}>
            - Remove Asset
          </button>
        </form>
      )}
    </div>
  );
}
