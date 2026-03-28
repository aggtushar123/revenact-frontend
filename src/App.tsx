import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { List } from './pages/organizations/List';
import { Board } from './pages/organizations/Board';
import { CopilotIndex } from './pages/copilot/Index';
import { CreateScenario } from './pages/scenarios/CreateScenario';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SettingPlaceholder } from './pages/settings/SettingPlaceholder';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={
            <div className="w-full h-full border-2 border-dashed border-gray-200/60 rounded-xl flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <p className="text-gray-400 font-medium tracking-wide">Main Dashboard</p>
            </div>
          } />
          
          <Route path="organizations">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<List />} />
            <Route path="board" element={<Board />} />
          </Route>

          <Route path="copilot" element={<CopilotIndex />} />
          <Route path="scenarios/create" element={<CreateScenario />} />
          
          <Route path="settings">
            <Route index element={<Navigate to="data" replace />} />
            <Route path="data" element={<SettingsPage />} />
            <Route path="currency" element={<SettingPlaceholder title="Currency" />} />
            <Route path="entity-uploads" element={<SettingPlaceholder title="Entity Uploads" />} />
            <Route path="webhooks" element={<SettingPlaceholder title="Webhooks" />} />
            <Route path="activities" element={<SettingPlaceholder title="Activities" />} />
            <Route path="global-presets" element={<SettingPlaceholder title="Global Presets" />} />
            <Route path="connect-widget" element={<SettingPlaceholder title="Connect Widget" />} />
            <Route path="ai-agent" element={<SettingPlaceholder title="AI Agent" />} />
          </Route>
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
