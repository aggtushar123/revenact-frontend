import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Profile } from './pages/profile/Profile';
import { UserManagement } from './pages/users/UserManagement';
import { List } from './pages/organizations/List';
import { Board } from './pages/organizations/Board';
import { Details as OrganizationDetails } from './pages/organizations/Details';
import { AccountDetails } from './pages/accounts/Details';
import { List as AccountsList } from './pages/accounts/List';
import { Board as AccountsBoard } from './pages/accounts/Board';
import { CopilotIndex } from './pages/copilot/Index';
import { LifecyclePage } from './pages/lifecycle/LifecyclePage';
import { HealthPage } from './pages/health/HealthPage';
import { CreateScenario } from './pages/scenarios/CreateScenario';
import { ScenariosList } from './pages/scenarios/ScenariosList';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SettingPlaceholder } from './pages/settings/SettingPlaceholder';
import { CurrencyPage } from './pages/settings/CurrencyPage';
import { GlobalPresetsPage } from './pages/settings/GlobalPresetsPage';
import { AIAgentPage } from './pages/settings/AIAgentPage';
import { EntityUploadsPage } from './pages/settings/EntityUploadsPage';
import { WebhooksPage } from './pages/settings/WebhooksPage';
import { Integrations } from './pages/integrations/Integrations';
import { List as ContactsList } from './pages/contacts/List';
import { ContactDetails } from './pages/contacts/Details';
import { PipelinesPage } from './pages/pipelines/PipelinesPage';
import { SurveysPage } from './pages/surveys/SurveysPage';
import { CanvasPage } from './pages/canvas/CanvasPage';
import { CanvasEditor } from './pages/canvas/CanvasEditor';
import { useAppSelector } from './hooks';
import { AdvanceDashboard } from './pages/dashboard/AdvanceDashboard';
import { AITrendingTopics } from './pages/dashboard/tabs/AITrendingTopics';
import { ControlsView } from './pages/dashboard/tabs/ai-trending/ControlsView';
import { PlaceholderView } from './pages/dashboard/tabs/ai-trending/PlaceholderView';
import { HealthOverviewContainer } from './pages/dashboard/tabs/HealthOverviewContainer';
import { ControlsView as HealthControlsView } from './pages/dashboard/tabs/health-overview/ControlsView';
import { TicketOverviewContainer } from './pages/dashboard/tabs/ticket-overview/TicketOverviewContainer';
import { ControlsView as TicketControlsView } from './pages/dashboard/tabs/ticket-overview/ControlsView';
// Company Brain pages
import { BrainDashboard } from './pages/brain/Dashboard';
import { KnowledgeGraph } from './pages/brain/Graph';
import { KnowledgeNodes } from './pages/brain/Nodes';
import { NodeDetail } from './pages/brain/NodeDetail';
import { SkillsLibrary } from './pages/brain/Skills';
import { SkillDetail } from './pages/brain/SkillDetail';
import { ConnectorsPage } from './pages/brain/Connectors';
import { ReviewQueue } from './pages/brain/Review';
import { FeedbackLog } from './pages/brain/Feedback';

function RootRedirect() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<RootRedirect />} />
          
          <Route path="dashboard">
            <Route index element={<Navigate to="advance" replace />} />
            <Route path="advance" element={<AdvanceDashboard />}>
              <Route index element={<Navigate to="health" replace />} />
              <Route path="ai-trending" element={<AITrendingTopics />}>
                <Route index element={<Navigate to="controls" replace />} />
                <Route path="controls" element={<ControlsView />} />
                <Route path="*" element={<PlaceholderView />} />
              </Route>
              <Route path="health" element={<HealthOverviewContainer />}>
                <Route index element={<Navigate to="controls" replace />} />
                <Route path="controls" element={<HealthControlsView />} />
                <Route path="*" element={<PlaceholderView />} />
              </Route>
              <Route path="ticket" element={<TicketOverviewContainer />}>
                <Route index element={<Navigate to="controls" replace />} />
                <Route path="controls" element={<TicketControlsView />} />
                <Route path="*" element={<PlaceholderView />} />
              </Route>
              {/* Fallback for other tabs */}
              <Route path="*" element={
                <div className="w-full h-full border-2 border-dashed border-line/60 rounded-xl flex items-center justify-center bg-surface/50 backdrop-blur-sm">
                  <p className="text-ink-faint font-medium tracking-wide">Tab under development</p>
                </div>
              } />
            </Route>
            <Route path="custom" element={
              <div className="w-full h-full border-2 border-dashed border-line/60 rounded-xl flex items-center justify-center bg-surface/50 backdrop-blur-sm m-4 p-8">
                <p className="text-ink-faint font-medium tracking-wide">Custom Dashboard (Beta) Coming Soon...</p>
              </div>
            } />
          </Route>
          
          <Route path="organizations">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<List />} />
            <Route path="board" element={<Board />} />
            <Route path=":id" element={<OrganizationDetails />} />
          </Route>

          <Route path="accounts">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<AccountsList />} />
            <Route path="board" element={<AccountsBoard />} />
            <Route path=":id" element={<AccountDetails />} />
          </Route>

          <Route path="copilot" element={<CopilotIndex />} />

          <Route path="lifecycle" element={<LifecyclePage />} />

          <Route path="health" element={<HealthPage />} />

          <Route path="scenarios">
            <Route index element={<ScenariosList />} />
            <Route path="create" element={<CreateScenario />} />
            <Route path=":id" element={<CreateScenario />} />
          </Route>

          <Route path="surveys" element={<SurveysPage />} />

          <Route path="canvas">
            <Route index element={<CanvasPage />} />
            <Route path="create" element={<CanvasEditor />} />
            <Route path=":id" element={<CanvasEditor />} />
          </Route>

          <Route path="settings">
            <Route index element={<Navigate to="data" replace />} />
            <Route path="data" element={<SettingsPage />} />
            <Route path="currency" element={<CurrencyPage />} />
            <Route path="entity-uploads" element={<EntityUploadsPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="activities" element={<SettingPlaceholder title="Activities" />} />
            <Route path="global-presets" element={<GlobalPresetsPage />} />
            <Route path="connect-widget" element={<SettingPlaceholder title="Connect Widget" />} />
            <Route path="ai-agent" element={<AIAgentPage />} />
          </Route>
          
          <Route path="integrations" element={<Integrations />} />

          <Route path="profile" element={<Profile />} />
          <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          
          <Route path="contacts">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<ContactsList />} />
            <Route path=":id" element={<ContactDetails />} />
          </Route>

          <Route path="pipelines">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<PipelinesPage view="list" />} />
            <Route path="board" element={<PipelinesPage view="board" />} />
          </Route>

          {/* Company Brain routes */}
          <Route path="brain">
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BrainDashboard />} />
            <Route path="graph" element={<KnowledgeGraph />} />
            <Route path="nodes" element={<KnowledgeNodes />} />
            <Route path="nodes/:id" element={<NodeDetail />} />
            <Route path="skills" element={<SkillsLibrary />} />
            <Route path="skills/:id" element={<SkillDetail />} />
            <Route path="connectors" element={<ConnectorsPage />} />
            <Route path="review" element={<ReviewQueue />} />
            <Route path="feedback" element={<FeedbackLog />} />
          </Route>
          
          {/* Catch-all route to avoid losing layout on unimplemented tabs */}
          <Route path="*" element={
            <div className="w-full h-full border-2 border-dashed border-line/60 rounded-xl flex items-center justify-center bg-surface/50 backdrop-blur-sm">
              <p className="text-ink-faint font-medium tracking-wide">Under Construction</p>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
