import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Link } from 'react-router-dom';
import { exportToCSV } from './utils/csvExport';

export default function ViewModels() {
  const [models, setModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      const { data, error } = await supabase
        .from('Models')
        .select('*');

      if (error) {
        setError(error.message);
      } else {
        setModels(data || []);
      }
    };
    fetchModels();
  }, []);

  const filteredModels = models.filter(model =>
    model['Model Name'].toLowerCase().includes(searchQuery.toLowerCase()) ||
    (model['Manufacturer'] && model['Manufacturer'].toLowerCase().includes(searchQuery.toLowerCase())) ||
    (model['Specs'] && model['Specs'].toLowerCase().includes(searchQuery.toLowerCase())) ||
    (model['Model Type'] && model['Model Type'].toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExport = () => {
    exportToCSV(filteredModels, `models_export_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'Inter Tight, sans-serif',
      width: '100%'
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '20px', display: 'inline-block', fontSize: '16px' }}>← Back to Home</Link>
      <h1 style={{ margin: '20px 0 40px 0', fontSize: '48px', color: '#000000', fontWeight: 'bold', textAlign: 'center' }}>View Models</h1>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {models.length === 0 && !error && <p>Loading models or table is empty...</p>}

        {/* Search Section */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="text"
            placeholder="Search by model name, manufacturer, specs, or model type..."
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
              <th style={{ fontSize: '16px', fontWeight: 'bold' }}>Model Name</th>
              <th style={{ fontSize: '16px', fontWeight: 'bold' }}>Manufacturer</th>
              <th style={{ fontSize: '16px', fontWeight: 'bold' }}>Specs</th>
              <th style={{ fontSize: '16px', fontWeight: 'bold' }}>Model Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>
                  {searchQuery ? 'No matching models found' : 'No models available'}
                </td>
              </tr>
            ) : (
              filteredModels.map((model) => (
                <tr key={model['Model Name']}>
                  <td>{model['Model Name']}</td>
                  <td>{model['Manufacturer'] || '-'}</td>
                  <td>{model['Specs'] || '-'}</td>
                  <td>{model['Model Type'] || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
