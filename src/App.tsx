import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { List } from './pages/organizations/List';
import { Board } from './pages/organizations/Board';
import { Details as OrganizationDetails } from './pages/organizations/Details';
import { AccountDetails } from './pages/accounts/Details';
import { CopilotIndex } from './pages/copilot/Index';
import { CreateScenario } from './pages/scenarios/CreateScenario';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SettingPlaceholder } from './pages/settings/SettingPlaceholder';
import { Integrations } from './pages/integrations/Integrations';
import { List as ContactsList } from './pages/contacts/List';
import { PipelinesPage } from './pages/pipelines/PipelinesPage';
import { useAppSelector } from './hooks';

function RootRedirect() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/organizations/list' : '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<RootRedirect />} />
          
          <Route path="dashboard" element={
            <div className="w-full h-full border-2 border-dashed border-gray-200/60 rounded-xl flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <p className="text-gray-400 font-medium tracking-wide">Main Dashboard</p>
            </div>
          } />
          
          <Route path="organizations">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<List />} />
            <Route path="board" element={<Board />} />
            <Route path=":id" element={<OrganizationDetails />} />
          </Route>

          <Route path="accounts/:id" element={<AccountDetails />} />

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
          
          <Route path="integrations" element={<Integrations />} />
          
          <Route path="contacts">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<ContactsList />} />
          </Route>

          <Route path="pipelines">
            <Route index element={<Navigate to="board" replace />} />
            <Route path="list" element={<PipelinesPage view="list" />} />
            <Route path="board" element={<PipelinesPage view="board" />} />
          </Route>
          
          {/* Catch-all route to avoid losing layout on unimplemented tabs */}
          <Route path="*" element={
            <div className="w-full h-full border-2 border-dashed border-gray-200/60 rounded-xl flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <p className="text-gray-400 font-medium tracking-wide">Under Construction</p>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
