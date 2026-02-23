import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Link } from 'react-router-dom';
import { exportToCSV } from './utils/csvExport';

export default function App() {
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('Model');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [user, setUser] = useState(null);

  // Fetch user info from Azure Static Web Apps
  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch('/.auth/me');
        const data = await response.json();
        if (data.clientPrincipal) {
          setUser(data.clientPrincipal);
        }
      } catch (err) {
        console.log('Not authenticated or auth endpoint unavailable');
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const getAssets = async () => {
      const { data, error } = await supabase
        .from('Assets')
        .select('*');

      if (error) {
        setError(error.message);
      } else {
        setAssets(data);
      }
    };
    getAssets();
  }, []);

  const filteredAssets = assets.filter(asset => {
    const searchLower = searchQuery.toLowerCase();
    switch(searchField) {
      case 'Model':
        return asset.Model.toLowerCase().includes(searchLower);
      case 'Location':
        return asset['Office Location'].toLowerCase().includes(searchLower);
      case 'Type':
        return asset['Asset Type'].toLowerCase().includes(searchLower);
      case 'Status':
        return asset.Status.toLowerCase().includes(searchLower);
      case 'Assigned To/Notes':
        return asset['Serial Tag'] && asset['Serial Tag'].toLowerCase().includes(searchLower);
      case 'Company ID':
        return asset['Company ID'] && asset['Company ID'].toLowerCase().includes(searchLower);
      default:
        return true;
    }
  });

  const handleExport = () => {
    exportToCSV(filteredAssets, `inventory_export_${new Date().toISOString().split('T')[0]}`);
  };

  const handleQuantityChange = async (assetId, currentQuantity, change) => {
    const newQuantity = Math.max(1, currentQuantity + change);
    const { error } = await supabase
      .from('Assets')
      .update({ 'Quantity': newQuantity })
      .eq('id', assetId);

    if (error) {
      alert('Error updating quantity: ' + error.message);
    } else {
      setAssets(assets.map(a => a.id === assetId ? { ...a, Quantity: newQuantity } : a));
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedAssets = () => {
    if (!sortColumn) return filteredAssets;
    
    const sorted = [...filteredAssets].sort((a, b) => {
      let aVal, bVal;
      
      switch(sortColumn) {
        case 'Model':
          aVal = a.Model?.toLowerCase() || '';
          bVal = b.Model?.toLowerCase() || '';
          break;
        case 'Type':
          aVal = a['Asset Type']?.toLowerCase() || '';
          bVal = b['Asset Type']?.toLowerCase() || '';
          break;
        case 'Location':
          aVal = a['Office Location']?.toLowerCase() || '';
          bVal = b['Office Location']?.toLowerCase() || '';
          break;
        case 'Status':
          aVal = a.Status?.toLowerCase() || '';
          bVal = b.Status?.toLowerCase() || '';
          break;
        case 'Quantity':
          aVal = a.Quantity || 0;
          bVal = b.Quantity || 0;
          break;
        case 'Company ID':
          aVal = a['Company ID']?.toLowerCase() || '';
          bVal = b['Company ID']?.toLowerCase() || '';
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  const sortedAndFilteredAssets = getSortedAssets();

  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'Inter Tight, sans-serif',
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        borderBottom: '3px solid #FF5722',
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Link to="/analytics" style={{
          display: 'inline-block',
          textDecoration: 'none',
          backgroundColor: '#FF5722',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'background-color 0.3s'
        }}>
          📊 Analytics
        </Link>
        <h1 style={{ margin: '0', fontSize: '48px', color: '#000000', fontWeight: 'bold', flex: 1, textAlign: 'center', fontFamily: 'Archivo Black, sans-serif' }}>Elevate IT: INVENTORY</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {user && (
            <div style={{ textAlign: 'right', fontSize: '13px' }}>
              <div style={{ fontWeight: '600', color: '#000000' }}>{user.userDetails}</div>
              <a href="/.auth/logout" style={{ color: '#FF5722', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>Logout</a>
            </div>
          )}
          <img src="/icon.png" alt="Elevate IT Icon" style={{ height: '60px', width: 'auto' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        
        {/* Left Column - Table */}
        <div style={{ flex: 1 }}>
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {assets.length === 0 && !error && <p>Loading assets or table is empty...</p>}

          {/* Search and Export */}
          <div style={{ marginTop: '20px', marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select 
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              style={{
                padding: '12px',
                fontSize: '15px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                minWidth: '140px'
              }}
            >
              <option value="Model">Model</option>
              <option value="Location">Location</option>
              <option value="Type">Type</option>
              <option value="Status">Status</option>
              <option value="Assigned To/Notes">Assigned To/Notes</option>
              <option value="Company ID">Company ID</option>
            </select>
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '15px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                minWidth: '200px'
              }}
            />
            <button 
              onClick={handleExport}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: '#0055cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ⬇️ Export CSV
            </button>
            {sortColumn && (
              <button 
                onClick={() => {
                  setSortColumn(null);
                  setSortDirection('asc');
                }}
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ↻ Reset Sort
              </button>
            )}
          </div>

          <table border="1" cellPadding="15" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0', fontSize: '15px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f4f4' }}>
                <th style={{ fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Model')}>Model {sortColumn === 'Model' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th style={{ fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Type')}>Type {sortColumn === 'Type' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th style={{ fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Location')}>Location {sortColumn === 'Location' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th style={{ fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Status')}>Status {sortColumn === 'Status' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th style={{ fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Quantity')}>Quantity {sortColumn === 'Quantity' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th style={{ fontSize: '16px', fontWeight: 'bold' }}>Assigned To/Notes</th>
                <th style={{ fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Company ID')}>Company ID {sortColumn === 'Company ID' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No matching models found</td>
                </tr>
              ) : (
                sortedAndFilteredAssets.map((item) => (
                  <tr 
                    key={item.id}
                    onClick={() => setSelectedAssetId(selectedAssetId === item.id ? null : item.id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedAssetId === item.id ? '#FFE8DC' : 'white'
                    }}
                  >
                    <td>{item.Model}</td>
                    <td>{item["Asset Type"]}</td>
                    <td>{item["Office Location"]}</td>
                    <td>{item.Status}</td>
                    <td>{item.Quantity}</td>
                    <td>{item["Serial Tag"] || '-'}</td>
                    <td>{item["Company ID"] || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column - Manage Data */}
        <div style={{ flex: 0, minWidth: '380px' }}>
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#FFE8DC', 
            borderLeft: '4px solid #FF5722',
            borderRadius: '4px'
          }}>
            <p style={{ marginTop: 0, fontWeight: 'bold', marginBottom: '15px', fontSize: '16px', color: '#FF5722' }}>Assets:</p>
            {selectedAssetId && (
              <div style={{ marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #FFB399' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                  <strong>Quantity Adjustment:</strong>
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      const asset = assets.find(a => a.id === selectedAssetId);
                      if (asset) handleQuantityChange(selectedAssetId, asset.Quantity, -1);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontWeight: '700',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    −
                  </button>
                  <span style={{ fontSize: '16px', fontWeight: '600', minWidth: '30px', textAlign: 'center' }}>
                    {assets.find(a => a.id === selectedAssetId)?.Quantity}
                  </span>
                  <button
                    onClick={() => {
                      const asset = assets.find(a => a.id === selectedAssetId);
                      if (asset) handleQuantityChange(selectedAssetId, asset.Quantity, 1);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontWeight: '700',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            <div style={{ marginBottom: '15px', paddingBottom: '0' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Link to="/add_asset" style={{
                  display: 'inline-block',
                  textDecoration: 'none',
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '15px',
                  fontWeight: '500',
                  flex: 1,
                  textAlign: 'center'
                }}>
                  + Add New Asset
                </Link>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/modify_asset" style={{
                  display: 'inline-block',
                  textDecoration: 'none',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  flex: 1,
                  textAlign: 'center'
                }}>
                  ✎ Modify Asset
                </Link>
                <Link to="/remove_asset" style={{
                  display: 'inline-block',
                  textDecoration: 'none',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  flex: 1,
                  textAlign: 'center'
                }}>
                  - Remove Asset
                </Link>
              </div>
            </div>
          </div>

          {/* Admin Section */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fff3cd', 
            borderLeft: '4px solid #ffc107',
            borderRadius: '4px',
            marginTop: '15px'
            }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', fontSize: '16px', color: '#856404' }}>
                Manage Asset Data Types:
              </p>

              {/* Models */}
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '6px 0', fontSize: '14px', fontWeight: '500', color: '#666' }}>Models:</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to="/view_models" style={{
                    textDecoration: 'none',
                    backgroundColor: '#FF5722',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    👁 View
                  </Link>
                  <Link to="/add_model" style={{
                    textDecoration: 'none',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    + Add
                  </Link>
                  <Link to="/modify_model" style={{
                    textDecoration: 'none',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    ✎ Modify
                  </Link>
                  <Link to="/remove_model" style={{
                    textDecoration: 'none',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    - Remove
                  </Link>
                </div>
              </div>

              {/* Office Locations */}
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '6px 0', fontSize: '14px', fontWeight: '500', color: '#666' }}>Office Locations:</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to="/view_office_locations" style={{
                    textDecoration: 'none',
                    backgroundColor: '#FF5722',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    👁 View
                  </Link>
                  <Link to="/add_office_location" style={{
                    textDecoration: 'none',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    + Add
                  </Link>
                  <Link to="/modify_office_location" style={{
                    textDecoration: 'none',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    ✎ Modify
                  </Link>
                  <Link to="/remove_office_location" style={{
                    textDecoration: 'none',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    - Remove
                  </Link>
                </div>
              </div>

              {/* Asset Types */}
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '6px 0', fontSize: '14px', fontWeight: '500', color: '#666' }}>Asset Types:</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to="/view_asset_types" style={{
                    textDecoration: 'none',
                    backgroundColor: '#FF5722',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    👁 View
                  </Link>
                  <Link to="/add_asset_type" style={{
                    textDecoration: 'none',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    + Add
                  </Link>
                  <Link to="/remove_asset_type" style={{
                    textDecoration: 'none',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    - Remove
                  </Link>
                </div>
              </div>

              {/* Asset Status */}
              <div>
                <p style={{ margin: '6px 0', fontSize: '14px', fontWeight: '500', color: '#666' }}>Asset Status:</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to="/view_asset_status" style={{
                    textDecoration: 'none',
                    backgroundColor: '#FF5722',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    👁 View
                  </Link>
                  <Link to="/add_asset_status" style={{
                    textDecoration: 'none',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    + Add
                  </Link>
                  <Link to="/remove_asset_status" style={{
                    textDecoration: 'none',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    - Remove
                  </Link>
                </div>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}