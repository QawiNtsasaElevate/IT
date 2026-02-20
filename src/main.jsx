import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import AddAsset from './AddAsset.jsx'
import RemoveAsset from './RemoveAsset.jsx'
import ModifyAsset from './ModifyAsset.jsx'
import AddModel from './AddModel.jsx'
import AddOfficeLocation from './AddOfficeLocation.jsx'
import AddAssetType from './AddAssetType.jsx'
import AddAssetStatus from './AddAssetStatus.jsx'
import RemoveModel from './RemoveModel.jsx'
import RemoveOfficeLocation from './RemoveOfficeLocation.jsx'
import RemoveAssetType from './RemoveAssetType.jsx'
import RemoveAssetStatus from './RemoveAssetStatus.jsx'
import ModifyModel from './ModifyModel.jsx'
import ModifyOfficeLocation from './ModifyOfficeLocation.jsx'
import ViewModels from './ViewModels.jsx'
import ViewOfficeLocations from './ViewOfficeLocations.jsx'
import ViewAssetTypes from './ViewAssetTypes.jsx'
import ViewAssetStatus from './ViewAssetStatus.jsx'
import Analytics from './Analytics.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/add_asset" element={<AddAsset />} />
        <Route path="/remove_asset" element={<RemoveAsset />} />
        <Route path="/modify_asset" element={<ModifyAsset />} />
        <Route path="/add_model" element={<AddModel />} />
        <Route path="/add_office_location" element={<AddOfficeLocation />} />
        <Route path="/add_asset_type" element={<AddAssetType />} />
        <Route path="/add_asset_status" element={<AddAssetStatus />} />
        <Route path="/remove_model" element={<RemoveModel />} />
        <Route path="/remove_office_location" element={<RemoveOfficeLocation />} />
        <Route path="/remove_asset_type" element={<RemoveAssetType />} />
        <Route path="/remove_asset_status" element={<RemoveAssetStatus />} />
        <Route path="/modify_model" element={<ModifyModel />} />
        <Route path="/modify_office_location" element={<ModifyOfficeLocation />} />
        <Route path="/view_models" element={<ViewModels />} />
        <Route path="/view_office_locations" element={<ViewOfficeLocations />} />
        <Route path="/view_asset_types" element={<ViewAssetTypes />} />
        <Route path="/view_asset_status" element={<ViewAssetStatus />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)