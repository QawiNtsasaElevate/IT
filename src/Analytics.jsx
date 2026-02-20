import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from './lib/supabaseClient';
import { Link } from 'react-router-dom';
import { exportToCSV } from './utils/csvExport';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#FF5722', '#28a745', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', '#6c757d', '#20c997', '#dc3545'];

export default function Analytics() {
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [models, setModels] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [modelListOpen, setModelListOpen] = useState(false);
  const [mode, setMode] = useState('filter'); // 'filter' or 'selection'
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [selectionViewMode, setSelectionViewMode] = useState('list'); // 'list', 'byModel', 'byLocation', 'byType', 'byStatus'
  const [chartData, setChartData] = useState({
    byLocation: [],
    byType: [],
    byStatus: [],
    byModel: [],
    byLocationAndType: [],
    byLocationAndModel: [],
    filteredBreakdown: []
  });

  // Refs for chart containers
  const chartsContainerRef = useRef(null);
  const chartRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      const [aRes, lRes, tRes, mRes, sRes] = await Promise.all([
        supabase.from('Assets').select('*'),
        supabase.from('Office Locations').select('"Office Name"'),
        supabase.from('Asset Types').select('"Type"'),
        supabase.from('Models').select('"Model Name"'),
        supabase.from('Asset Status').select('"Status Type"')
      ]);

      setAssets(aRes.data || []);
      setLocations(lRes.data || []);
      setTypes(tRes.data || []);
      setModels(mRes.data || []);
      setStatuses(sRes.data || []);
    };

    fetchData();
  }, []);

  // Memoized calculation of selected models data
  const selectedModelsData = useMemo(() => {
    if (selectedAssets.size === 0) return [];
    
    const modelMap = {};
    Array.from(selectedAssets).forEach(id => {
      const asset = assets.find(a => a.id === id);
      if (asset) {
        const model = asset.Model;
        modelMap[model] = (modelMap[model] || 0) + (asset.Quantity || 1);
      }
    });
    
    return Object.entries(modelMap)
      .map(([name, count]) => ({ name, count: Math.floor(count) }))
      .sort((a, b) => b.count - a.count);
  }, [selectedAssets, assets]);

  useEffect(() => {
    if (assets.length === 0) return;

    // Determine which assets to use based on mode
    let dataSourceAssets = assets;
    if (mode === 'selection') {
      dataSourceAssets = assets.filter(a => selectedAssets.has(a.id));
    }

    // Apply filters (only in filter mode)
    let filteredAssets = dataSourceAssets;
    if (mode === 'filter') {
      if (selectedLocation) {
        filteredAssets = filteredAssets.filter(a => a['Office Location'] === selectedLocation);
      }
      if (selectedType) {
        filteredAssets = filteredAssets.filter(a => a['Asset Type'] === selectedType);
      }
      if (selectedModel) {
        filteredAssets = filteredAssets.filter(a => a.Model === selectedModel);
      }
    }

    // Assets by Location
    const byLocation = {};
    dataSourceAssets.forEach(asset => {
      const loc = asset['Office Location'];
      byLocation[loc] = (byLocation[loc] || 0) + 1;
    });
    const byLocationData = Object.keys(byLocation).map(loc => ({
      name: loc,
      count: Math.floor(byLocation[loc])
    }));

    // Assets by Type
    const byType = {};
    dataSourceAssets.forEach(asset => {
      const type = asset['Asset Type'];
      byType[type] = (byType[type] || 0) + 1;
    });
    const byTypeData = Object.keys(byType).map(type => ({
      name: type,
      count: Math.floor(byType[type])
    }));

    // Assets by Model
    const byModel = {};
    dataSourceAssets.forEach(asset => {
      const model = asset.Model;
      byModel[model] = (byModel[model] || 0) + 1;
    });
    const byModelData = Object.keys(byModel)
      .map(model => ({
        name: model,
        count: Math.floor(byModel[model])
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 models

    // Assets by Status
    const byStatus = {};
    dataSourceAssets.forEach(asset => {
      const status = asset.Status;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    const byStatusData = Object.keys(byStatus).map(status => ({
      name: status,
      count: Math.floor(byStatus[status])
    }));

    // Filtered breakdown - by Location (if type or model selected in filter mode)
    let breakdownData = [];
    if (mode === 'filter' && (selectedType || selectedModel)) {
      const byLoc = {};
      filteredAssets.forEach(asset => {
        const loc = asset['Office Location'];
        byLoc[loc] = (byLoc[loc] || 0) + 1;
      });
      breakdownData = Object.keys(byLoc)
        .map(loc => ({
          name: loc,
          count: Math.floor(byLoc[loc])
        }))
        .sort((a, b) => b.count - a.count);
    }

    // Assets by Type (for selected location in filter mode)
    let byLocationType = {};
    if (mode === 'filter' && selectedLocation) {
      dataSourceAssets.filter(a => a['Office Location'] === selectedLocation).forEach(asset => {
        const type = asset['Asset Type'];
        byLocationType[type] = (byLocationType[type] || 0) + 1;
      });
    }
    const byLocationAndTypeData = Object.keys(byLocationType)
      .map(type => ({
        name: type,
        count: Math.floor(byLocationType[type])
      }))
      .sort((a, b) => b.count - a.count);

    // Assets by Model (for selected location in filter mode)
    let byLocationModel = {};
    if (mode === 'filter' && selectedLocation) {
      dataSourceAssets.filter(a => a['Office Location'] === selectedLocation).forEach(asset => {
        const model = asset.Model;
        byLocationModel[model] = (byLocationModel[model] || 0) + 1;
      });
    }
    const byLocationAndModelData = Object.keys(byLocationModel)
      .map(model => ({
        name: model,
        count: Math.floor(byLocationModel[model])
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Filtered Status breakdown (for type, model, or location selection in filter mode)
    let filteredStatusData = [];
    if (mode === 'filter' && (selectedType || selectedModel || selectedLocation)) {
      const filteredByStatus = {};
      filteredAssets.forEach(asset => {
        const status = asset.Status;
        filteredByStatus[status] = (filteredByStatus[status] || 0) + 1;
      });
      filteredStatusData = Object.keys(filteredByStatus).map(status => ({
        name: status,
        count: Math.floor(filteredByStatus[status])
      }));
    }

    // Quantity data by Model (for type, model, or location selection in filter mode)
    let quantityData = [];
    if (mode === 'filter' && (selectedType || selectedModel || selectedLocation)) {
      const quantityByModel = {};
      filteredAssets.forEach(asset => {
        const modelName = asset.Model;
        const qty = asset['Quantity'] || 0;
        quantityByModel[modelName] = (quantityByModel[modelName] || 0) + qty;
      });
      quantityData = Object.keys(quantityByModel)
        .map(modelName => ({
          name: modelName,
          count: Math.floor(quantityByModel[modelName])
        }))
        .sort((a, b) => b.count - a.count);
    }

    setChartData({
      byLocation: byLocationData.sort((a, b) => b.count - a.count),
      byType: byTypeData.sort((a, b) => b.count - a.count),
      byStatus: byStatusData,
      byModel: byModelData,
      byLocationAndType: byLocationAndTypeData,
      byLocationAndModel: byLocationAndModelData,
      filteredBreakdown: breakdownData,
      filteredStatus: filteredStatusData,
      filteredQuantity: quantityData
    });
  }, [assets, selectedLocation, selectedType, selectedModel, mode, selectedAssets]);

  const totalAssets = assets.length;
  const typeCount = selectedType 
    ? assets.filter(a => a['Asset Type'] === selectedType).length
    : 0;
  const modelCount = selectedModel
    ? assets.filter(a => a.Model === selectedModel).length
    : 0;
  const locationCount = selectedLocation
    ? assets.filter(a => a['Office Location'] === selectedLocation).length
    : 0;

  let displayCount = totalAssets;
  let displayLabel = 'Total Assets';
  
  if (mode === 'selection') {
    displayCount = selectedAssets.size;
    displayLabel = `Selected Asset${selectedAssets.size !== 1 ? 's' : ''}`;
  } else if (selectedModel) {
    displayCount = modelCount;
    displayLabel = `${selectedModel} (Model)`;
  } else if (selectedType) {
    displayCount = typeCount;
    displayLabel = `${selectedType} (Type)`;
  } else if (selectedLocation) {
    displayCount = locationCount;
    displayLabel = `${selectedLocation} (Location)`;
  }

  // Apply filters or use selected assets based on mode
  let filteredAssets = assets;
  
  if (mode === 'selection') {
    // In selection mode, only include selected assets
    filteredAssets = assets.filter(a => selectedAssets.has(a.id));
  } else {
    // In filter mode, apply filter criteria
    if (selectedLocation) {
      filteredAssets = filteredAssets.filter(a => a['Office Location'] === selectedLocation);
    }
    if (selectedType) {
      filteredAssets = filteredAssets.filter(a => a['Asset Type'] === selectedType);
    }
    if (selectedModel) {
      filteredAssets = filteredAssets.filter(a => a.Model === selectedModel);
    }
  }

  const toggleAssetSelection = (assetId) => {
    const newSelection = new Set(selectedAssets);
    if (newSelection.has(assetId)) {
      newSelection.delete(assetId);
    } else {
      newSelection.add(assetId);
    }
    setSelectedAssets(newSelection);
  };

  const selectAllAssets = () => {
    const allIds = new Set(assets.map(a => a.id));
    setSelectedAssets(allIds);
  };

  const deselectAllAssets = () => {
    setSelectedAssets(new Set());
  };

  const getFilteredAssetsForSelection = () => {
    return assets.filter(asset => 
      asset.Model.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
      asset['Office Location'].toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
      asset['Asset Type'].toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
      asset.Status.toLowerCase().includes(assetSearchQuery.toLowerCase())
    );
  };

  const groupAssetsByModel = () => {
    const filteredAssets = getFilteredAssetsForSelection();
    const grouped = {};
    
    filteredAssets.forEach(asset => {
      const model = asset.Model;
      if (!grouped[model]) {
        grouped[model] = [];
      }
      grouped[model].push(asset);
    });
    
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const selectAllByModel = (modelName) => {
    const modelAssets = assets.filter(a => a.Model === modelName);
    const newSelection = new Set(selectedAssets);
    modelAssets.forEach(asset => newSelection.add(asset.id));
    setSelectedAssets(newSelection);
  };

  const deselectAllByModel = (modelName) => {
    const modelAssets = assets.filter(a => a.Model === modelName);
    const newSelection = new Set(selectedAssets);
    modelAssets.forEach(asset => newSelection.delete(asset.id));
    setSelectedAssets(newSelection);
  };

  const groupAssetsByLocation = () => {
    const filteredAssets = getFilteredAssetsForSelection();
    const grouped = {};
    
    filteredAssets.forEach(asset => {
      const location = asset['Office Location'];
      if (!grouped[location]) {
        grouped[location] = [];
      }
      grouped[location].push(asset);
    });
    
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const selectAllByLocation = (locationName) => {
    const locationAssets = assets.filter(a => a['Office Location'] === locationName);
    const newSelection = new Set(selectedAssets);
    locationAssets.forEach(asset => newSelection.add(asset.id));
    setSelectedAssets(newSelection);
  };

  const deselectAllByLocation = (locationName) => {
    const locationAssets = assets.filter(a => a['Office Location'] === locationName);
    const newSelection = new Set(selectedAssets);
    locationAssets.forEach(asset => newSelection.delete(asset.id));
    setSelectedAssets(newSelection);
  };

  const groupAssetsByType = () => {
    const filteredAssets = getFilteredAssetsForSelection();
    const grouped = {};
    
    filteredAssets.forEach(asset => {
      const type = asset['Asset Type'];
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(asset);
    });
    
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const selectAllByType = (typeName) => {
    const typeAssets = assets.filter(a => a['Asset Type'] === typeName);
    const newSelection = new Set(selectedAssets);
    typeAssets.forEach(asset => newSelection.add(asset.id));
    setSelectedAssets(newSelection);
  };

  const deselectAllByType = (typeName) => {
    const typeAssets = assets.filter(a => a['Asset Type'] === typeName);
    const newSelection = new Set(selectedAssets);
    typeAssets.forEach(asset => newSelection.delete(asset.id));
    setSelectedAssets(newSelection);
  };

  const groupAssetsByStatus = () => {
    const filteredAssets = getFilteredAssetsForSelection();
    const grouped = {};
    
    filteredAssets.forEach(asset => {
      const status = asset.Status;
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(asset);
    });
    
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const selectAllByStatus = (statusName) => {
    const statusAssets = assets.filter(a => a.Status === statusName);
    const newSelection = new Set(selectedAssets);
    statusAssets.forEach(asset => newSelection.add(asset.id));
    setSelectedAssets(newSelection);
  };

  const deselectAllByStatus = (statusName) => {
    const statusAssets = assets.filter(a => a.Status === statusName);
    const newSelection = new Set(selectedAssets);
    statusAssets.forEach(asset => newSelection.delete(asset.id));
    setSelectedAssets(newSelection);
  };

  const handleExport = async () => {
    const filename = `analytics_export_${selectedLocation || selectedType || selectedModel || 'all'}_${new Date().toISOString().split('T')[0]}`;
    
    // Export CSV first
    exportToCSV(filteredAssets, filename);

    // Capture and export charts
    try {
      const zip = new JSZip();
      const chartsFolder = zip.folder('charts');
      let chartCount = 0;
      
      // Get all chart containers in the charts grid
      const chartElements = document.querySelectorAll('[data-chart-id]');
      
      if (chartElements.length === 0) {
        return; // No charts to export
      }

      for (let i = 0; i < chartElements.length; i++) {
        const chartElement = chartElements[i];
        const chartId = chartElement.getAttribute('data-chart-id');
        
        try {
          const canvas = await html2canvas(chartElement, {
            allowTaint: true,
            useCORS: true,
            backgroundColor: '#f9f9f9',
            logging: false
          });
          
          const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png');
          });
          
          chartsFolder.file(`${chartId}.png`, blob);
          chartCount++;
        } catch (error) {
          console.error(`Error capturing chart ${chartId}:`, error);
        }
      }

      // Generate and download zip if charts were captured
      if (chartCount > 0) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${filename}_with_charts.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    } catch (error) {
      console.error('Error exporting charts:', error);
    }
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', width: '100%' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#FF5722', marginBottom: '60px', display: 'block', fontSize: '16px' }}>← Back to Home</Link>
      <h1 style={{ margin: '20px 0 40px 0', fontSize: '48px', color: '#000000', fontWeight: 'bold', textAlign: 'center' }}>Analytics Dashboard</h1>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setMode('filter');
              setSelectedAssets(new Set());
            }}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: mode === 'filter' ? '#FF5722' : '#ccc',
              color: mode === 'filter' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📊 Filter Mode
          </button>
          <button
            onClick={() => {
              setMode('selection');
              setSelectedLocation('');
              setSelectedType('');
              setSelectedModel('');
            }}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: mode === 'selection' ? '#FF5722' : '#ccc',
              color: mode === 'selection' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✓ Selection Mode
          </button>
        </div>
        {mode === 'filter' ? (
          <>
          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', color: '#000000' }}>Filter by Location:</label>
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">All Locations</option>
              {locations.map(loc => {
                const count = assets.filter(a => a['Office Location'] === loc['Office Name']).length;
                return (
                  <option key={loc['Office Name']} value={loc['Office Name']}>
                    {loc['Office Name']} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', color: '#000000' }}>Filter by Type:</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">All Types</option>
              {types.map(type => {
                const count = assets.filter(a => a['Asset Type'] === type['Type']).length;
                return (
                  <option key={type['Type']} value={type['Type']}>
                    {type['Type']} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', color: '#000000' }}>Filter by Model:</label>
            <button 
              onClick={() => setModelListOpen(!modelListOpen)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: '500'
              }}
            >
              {selectedModel ? selectedModel : 'All Models'} ▼
            </button>
            {modelListOpen && (
              <div style={{ 
                border: '1px solid #ccc', 
                borderRadius: '4px', 
                maxHeight: '300px', 
                overflowY: 'auto',
                backgroundColor: '#f9f9f9',
                marginTop: '8px'
              }}>
                <input 
                  type="text"
                  placeholder="Search model..."
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: 'none',
                    borderBottom: '1px solid #ccc',
                    boxSizing: 'border-box'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div 
                  onClick={() => { setSelectedModel(''); setModelSearchQuery(''); }}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    backgroundColor: selectedModel === '' ? '#FF5722' : 'transparent',
                    color: selectedModel === '' ? 'white' : 'black',
                    fontWeight: selectedModel === '' ? '600' : 'normal'
                  }}
                >
                  ✓ All Models
                </div>
                {models
                  .filter(model => 
                    model['Model Name'].toLowerCase().includes(modelSearchQuery.toLowerCase())
                  )
                  .map(model => {
                    const count = assets.filter(a => a.Model === model['Model Name']).length;
                    return (
                      <div 
                        key={model['Model Name']}
                        onClick={() => { setSelectedModel(model['Model Name']); setModelSearchQuery(''); setModelListOpen(false); }}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          backgroundColor: selectedModel === model['Model Name'] ? '#FF5722' : 'transparent',
                          color: selectedModel === model['Model Name'] ? 'white' : 'black',
                          fontWeight: selectedModel === model['Model Name'] ? '600' : 'normal',
                          borderTop: '1px solid #eee'
                        }}
                      >
                        {selectedModel === model['Model Name'] && '✓ '} {model['Model Name']} ({count})
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
        // Selection Mode
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={selectAllAssets}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✓ Select All
            </button>
            <button
              onClick={deselectAllAssets}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '50px'
              }}
            >
              ✗ Deselect All
            </button>
            <button
              onClick={() => setSelectionViewMode('list')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: selectionViewMode === 'list' ? '#FF5722' : '#ccc',
                color: selectionViewMode === 'list' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📋 List View
            </button>
            <button
              onClick={() => setSelectionViewMode('byModel')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: selectionViewMode === 'byModel' ? '#FF5722' : '#ccc',
                color: selectionViewMode === 'byModel' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🏷️ By Model
            </button>
            <button
              onClick={() => setSelectionViewMode('byLocation')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: selectionViewMode === 'byLocation' ? '#FF5722' : '#ccc',
                color: selectionViewMode === 'byLocation' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📍 By Location
            </button>
            <button
              onClick={() => setSelectionViewMode('byType')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: selectionViewMode === 'byType' ? '#FF5722' : '#ccc',
                color: selectionViewMode === 'byType' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📦 By Type
            </button>
            <button
              onClick={() => setSelectionViewMode('byStatus')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: selectionViewMode === 'byStatus' ? '#FF5722' : '#ccc',
                color: selectionViewMode === 'byStatus' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✅ By Status
            </button>
          </div>

          {selectionViewMode === 'list' && (
            <>
              <input
                type="text"
                placeholder="Search assets by model, location, type, or status..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}>
                {getFilteredAssetsForSelection().map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => toggleAssetSelection(asset.id)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedAssets.has(asset.id) ? '#FFE8DC' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset.id)}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', color: '#000000' }}>{asset.Model}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {asset['Office Location']} • {asset['Asset Type']} • {asset.Status} • Qty: {asset.Quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectionViewMode === 'byModel' && (
            <>
              <input
                type="text"
                placeholder="Search models..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}>
                {groupAssetsByModel().map(([modelName, modelAssets]) => {
                  const modelSelectedCount = modelAssets.filter(a => selectedAssets.has(a.id)).length;
                  const isAllSelected = modelSelectedCount === modelAssets.length && modelAssets.length > 0;
                  const isPartiallySelected = modelSelectedCount > 0 && modelSelectedCount < modelAssets.length;
                  
                  return (
                    <div key={modelName}>
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: isAllSelected ? '#FFE8DC' : '#f9f9f9',
                          borderBottom: '1px solid #ddd',
                          fontWeight: '600',
                          color: '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isPartiallySelected;
                          }}
                          onChange={() => {
                            if (isAllSelected) {
                              deselectAllByModel(modelName);
                            } else {
                              selectAllByModel(modelName);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{modelName}</span>
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: 'auto' }}>
                          {modelSelectedCount}/{modelAssets.length}
                        </span>
                      </div>
                      {modelAssets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => toggleAssetSelection(asset.id)}
                          style={{
                            padding: '10px 12px 10px 40px',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            backgroundColor: selectedAssets.has(asset.id) ? '#FFF0E6' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '13px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.id)}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ color: '#666' }}>
                              {asset['Office Location']} • {asset['Asset Type']} • {asset.Status} • Qty: {asset.Quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '15px', fontSize: '14px', fontWeight: '600', color: '#000000' }}>
                Selected: {selectedAssets.size} asset(s)
              </div>
            </>
          )}

          {selectionViewMode === 'byLocation' && (
            <>
              <input
                type="text"
                placeholder="Search locations..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}>
                {groupAssetsByLocation().map(([locationName, locationAssets]) => {
                  const locationSelectedCount = locationAssets.filter(a => selectedAssets.has(a.id)).length;
                  const isAllSelected = locationSelectedCount === locationAssets.length && locationAssets.length > 0;
                  const isPartiallySelected = locationSelectedCount > 0 && locationSelectedCount < locationAssets.length;
                  
                  return (
                    <div key={locationName}>
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: isAllSelected ? '#FFE8DC' : '#f9f9f9',
                          borderBottom: '1px solid #ddd',
                          fontWeight: '600',
                          color: '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isPartiallySelected;
                          }}
                          onChange={() => {
                            if (isAllSelected) {
                              deselectAllByLocation(locationName);
                            } else {
                              selectAllByLocation(locationName);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{locationName}</span>
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: 'auto' }}>
                          {locationSelectedCount}/{locationAssets.length}
                        </span>
                      </div>
                      {locationAssets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => toggleAssetSelection(asset.id)}
                          style={{
                            padding: '10px 12px 10px 40px',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            backgroundColor: selectedAssets.has(asset.id) ? '#FFF0E6' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '13px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.id)}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ color: '#666' }}>
                              {asset.Model} • {asset['Asset Type']} • {asset.Status} • Qty: {asset.Quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '15px', fontSize: '14px', fontWeight: '600', color: '#000000' }}>
                Selected: {selectedAssets.size} asset(s)
              </div>
            </>
          )}

          {selectionViewMode === 'byType' && (
            <>
              <input
                type="text"
                placeholder="Search types..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}>
                {groupAssetsByType().map(([typeName, typeAssets]) => {
                  const typeSelectedCount = typeAssets.filter(a => selectedAssets.has(a.id)).length;
                  const isAllSelected = typeSelectedCount === typeAssets.length && typeAssets.length > 0;
                  const isPartiallySelected = typeSelectedCount > 0 && typeSelectedCount < typeAssets.length;
                  
                  return (
                    <div key={typeName}>
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: isAllSelected ? '#FFE8DC' : '#f9f9f9',
                          borderBottom: '1px solid #ddd',
                          fontWeight: '600',
                          color: '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isPartiallySelected;
                          }}
                          onChange={() => {
                            if (isAllSelected) {
                              deselectAllByType(typeName);
                            } else {
                              selectAllByType(typeName);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{typeName}</span>
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: 'auto' }}>
                          {typeSelectedCount}/{typeAssets.length}
                        </span>
                      </div>
                      {typeAssets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => toggleAssetSelection(asset.id)}
                          style={{
                            padding: '10px 12px 10px 40px',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            backgroundColor: selectedAssets.has(asset.id) ? '#FFF0E6' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '13px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.id)}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ color: '#666' }}>
                              {asset.Model} • {asset['Office Location']} • {asset.Status} • Qty: {asset.Quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '15px', fontSize: '14px', fontWeight: '600', color: '#000000' }}>
                Selected: {selectedAssets.size} asset(s)
              </div>
            </>
          )}

          {selectionViewMode === 'byStatus' && (
            <>
              <input
                type="text"
                placeholder="Search statuses..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}>
                {groupAssetsByStatus().map(([statusName, statusAssets]) => {
                  const statusSelectedCount = statusAssets.filter(a => selectedAssets.has(a.id)).length;
                  const isAllSelected = statusSelectedCount === statusAssets.length && statusAssets.length > 0;
                  const isPartiallySelected = statusSelectedCount > 0 && statusSelectedCount < statusAssets.length;
                  
                  return (
                    <div key={statusName}>
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: isAllSelected ? '#FFE8DC' : '#f9f9f9',
                          borderBottom: '1px solid #ddd',
                          fontWeight: '600',
                          color: '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isPartiallySelected;
                          }}
                          onChange={() => {
                            if (isAllSelected) {
                              deselectAllByStatus(statusName);
                            } else {
                              selectAllByStatus(statusName);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{statusName}</span>
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: 'auto' }}>
                          {statusSelectedCount}/{statusAssets.length}
                        </span>
                      </div>
                      {statusAssets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => toggleAssetSelection(asset.id)}
                          style={{
                            padding: '10px 12px 10px 40px',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            backgroundColor: selectedAssets.has(asset.id) ? '#FFF0E6' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '13px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.id)}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ color: '#666' }}>
                              {asset.Model} • {asset['Office Location']} • {asset['Asset Type']} • Qty: {asset.Quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '15px', fontSize: '14px', fontWeight: '600', color: '#000000' }}>
                Selected: {selectedAssets.size} asset(s)
              </div>
            </>
          )}
        </div>
        )}

        {/* Stats Box */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#FFE8DC',
          border: '2px solid #FF5722',
          borderRadius: '4px',
          marginBottom: '40px',
          textAlign: 'center',
          fontWeight: '600',
          color: '#000000',
          fontSize: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{displayCount} {displayLabel}</span>
          <button 
            onClick={handleExport}
            style={{
              padding: '10px 16px',
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
            ⬇️ Export CSV & Charts
          </button>
        </div>

        {/* Charts Grid */}
        <div ref={chartsContainerRef} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '40px' }}>
          
          {/* BASE LEVEL - No filters selected (or in selection mode) */}
          {(mode === 'selection' || (!selectedLocation && !selectedType && !selectedModel)) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
              {/* Assets by Location - Bar Chart */}
              <div data-chart-id="assets-by-location" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                <h3 style={{ color: '#000000', marginTop: 0 }}>Assets by Location</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.byLocation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#20c997" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Assets by Type - Bar Chart */}
              <div data-chart-id="assets-by-type" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                <h3 style={{ color: '#000000', marginTop: 0 }}>Assets by Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.byType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ffc107" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Assets by Status - Pie Chart */}
              <div data-chart-id="assets-by-status" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ color: '#000000', marginTop: 0 }}>Assets by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.byStatus}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {chartData.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* SELECTION MODE - Selected Models Chart */}
          {mode === 'selection' && selectedAssets.size > 0 && (
            <div data-chart-id="selected-models" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', gridColumn: '1 / -1' }}>
              <h3 style={{ color: '#000000', marginTop: 0 }}>Assets by Model</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={selectedModelsData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6f42c1" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* LOCATION SELECTED - Show Type and Model breakdowns for this location */}
          {selectedLocation && !selectedType && !selectedModel && (
            <>
              {/* Asset Types in Location */}
              {chartData.byLocationAndType && chartData.byLocationAndType.length > 0 && (
                  <div data-chart-id="assets-by-location-type" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                  <h3 style={{ color: '#000000', marginTop: 0 }}>Asset Types in {selectedLocation}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.byLocationAndType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#e83e8c" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Status Breakdown for Location */}
              {chartData.filteredStatus.length > 0 && (
                  <div data-chart-id="assets-status-location" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ color: '#000000', marginTop: 0 }}>Asset Status in {selectedLocation}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.filteredStatus}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {chartData.filteredStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Quantity Distribution for Location */}
              {chartData.filteredQuantity.length > 0 && (
                <div data-chart-id="inventory-by-model-location" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                  <h3 style={{ color: '#000000', marginTop: 0 }}>Total Inventory by Model in {selectedLocation}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.filteredQuantity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF5722" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* TYPE OR MODEL SELECTED - Show breakdown by Location, Status, and Quantity */}
          {(selectedType || selectedModel) && (
            <>
              {chartData.filteredBreakdown.length > 0 && (
                <div data-chart-id="filtered-distribution-location" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                  <h3 style={{ color: '#000000', marginTop: 0 }}>
                    {selectedModel ? `${selectedModel} ` : ''}{selectedType ? `${selectedType} ` : ''}Distribution by Location
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.filteredBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#28a745" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartData.filteredStatus.length > 0 && (
                <div data-chart-id="filtered-status-breakdown" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ color: '#000000', marginTop: 0 }}>
                    {selectedModel ? `${selectedModel} ` : ''}{selectedType ? `${selectedType} ` : ''}Status Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.filteredStatus}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {chartData.filteredStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartData.filteredQuantity.length > 0 && (
                <div data-chart-id="filtered-inventory-by-model" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                  <h3 style={{ color: '#000000', marginTop: 0 }}>
                    {selectedModel ? `${selectedModel} ` : ''}{selectedType ? `${selectedType} ` : ''}Total Inventory by Model
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.filteredQuantity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0055cc" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
