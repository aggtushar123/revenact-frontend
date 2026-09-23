import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RequireCapability } from './components/auth/RequireCapability';
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
import CommunicationsPage from './pages/communications/CommunicationsPage';
import { LifecyclePage } from './pages/lifecycle/LifecyclePage';
import { HealthPage } from './pages/health/HealthPage';
import { CreateScenario } from './pages/scenarios/CreateScenario';
import { ScenariosList } from './pages/scenarios/ScenariosList';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SettingsLayout } from './layouts/SettingsLayout';
import { AccountSettingsPage } from './pages/settings/AccountSettingsPage';
import { BillingSettingsPage } from './pages/settings/BillingSettingsPage';
import { IntegrationsSettingsPage } from './pages/settings/IntegrationsSettingsPage';
import { PersonalizationPage } from './pages/settings/PersonalizationPage';
import { SkillsTasksPage } from './pages/settings/SkillsTasksPage';
import { AboutSettingsPage } from './pages/settings/AboutSettingsPage';
import { SettingPlaceholder } from './pages/settings/SettingPlaceholder';
import { CurrencyPage } from './pages/settings/CurrencyPage';
import { ProductsPage } from './pages/settings/ProductsPage';
import { GlobalPresetsPage } from './pages/settings/GlobalPresetsPage';
import { AIAgentPage } from './pages/settings/AIAgentPage';
import { AIAttributesPage } from './pages/settings/AIAttributesPage';
import { AgentAccessPage } from './pages/settings/AgentAccessPage';
import { EntityUploadsPage } from './pages/settings/EntityUploadsPage';
import { WebhooksPage } from './pages/settings/WebhooksPage';
import { Integrations } from './pages/integrations/Integrations';
import { List as ContactsList } from './pages/contacts/List';
import { ContactDetails } from './pages/contacts/Details';
import { CustomObjectRecordsPage } from './pages/customObjects/CustomObjectRecordsPage';
import { PipelinesPage } from './pages/pipelines/PipelinesPage';
import { SurveysPage } from './pages/surveys/SurveysPage';
import { CanvasPage } from './pages/canvas/CanvasPage';
import { CanvasEditor } from './pages/canvas/CanvasEditor';
import { CampaignsList } from './pages/campaigns/CampaignsList';
import { CampaignEditor } from './pages/campaigns/CampaignEditor';
import { useAppSelector } from './hooks';
import { AdvanceDashboard } from './pages/dashboard/AdvanceDashboard';
import { AITrendingTopics } from './pages/dashboard/tabs/AITrendingTopics';
import { ControlsView } from './pages/dashboard/tabs/ai-trending/ControlsView';
import { HealthOverviewContainer } from './pages/dashboard/tabs/HealthOverviewContainer';
import { ControlsView as HealthControlsView } from './pages/dashboard/tabs/health-overview/ControlsView';
import { TriageView } from './pages/dashboard/tabs/health-overview/TriageView';
import { DivergenceView } from './pages/dashboard/tabs/health-overview/DivergenceView';
import { MovementView } from './pages/dashboard/tabs/health-overview/MovementView';
import { RenewalView } from './pages/dashboard/tabs/health-overview/RenewalView';
import { ActivityContainer } from './pages/dashboard/tabs/ActivityContainer';
import { CustomerOverviewContainer } from './pages/dashboard/tabs/CustomerOverviewContainer';
import { ControlsView as CustomerControlsView } from './pages/dashboard/tabs/customer-overview/ControlsView';
import { ControlsView as ActivityControlsView } from './pages/dashboard/tabs/activity/ControlsView';
import { ForecastContainer } from './pages/dashboard/tabs/ForecastContainer';
import { ControlsView as ForecastControlsView } from './pages/dashboard/tabs/forecast/ControlsView';
import { UsageOverviewContainer } from './pages/dashboard/tabs/UsageOverviewContainer';
import { ControlsView as UsageControlsView } from './pages/dashboard/tabs/usage-overview/ControlsView';
import { ProductUsageContainer } from './pages/dashboard/tabs/ProductUsageContainer';
import { ControlsView as ProductControlsView } from './pages/dashboard/tabs/product-usage/ControlsView';
import { TicketOverviewContainer } from './pages/dashboard/tabs/ticket-overview/TicketOverviewContainer';
import { ControlsView as TicketControlsView } from './pages/dashboard/tabs/ticket-overview/ControlsView';
// Company Brain pages
import { BrainDashboard } from './pages/brain/Dashboard';
import { InitiativesPage } from './pages/brain/Initiatives';
import { ReviewQueuePage } from './pages/brain/Review';
import { FeedbackLogPage } from './pages/brain/Feedback';
import { AgentsPage } from './pages/brain/Agents';
import { SkillsPage } from './pages/brain/Skills';
import { GraphPage } from './pages/brain/Graph';
import { FeatureRequestsPage } from './pages/brain/FeatureRequests';
import { AnomaliesPage } from './pages/brain/Anomalies';
import { OnboardingCarousel } from './pages/onboarding/OnboardingCarousel';
import { AuthCallback } from './pages/auth/AuthCallback';
import { RequirePlatform } from './components/auth/RequirePlatform';
import { PlatformLayout } from './layouts/PlatformLayout';
import { PlatformOverview } from './pages/platform/PlatformOverview';
import { PlatformOrganisations } from './pages/platform/PlatformOrganisations';
import { PlatformOrganisationDetail } from './pages/platform/PlatformOrganisationDetail';
import { PlatformStaff } from './pages/platform/PlatformStaff';
import { PlatformAccount } from './pages/platform/PlatformAccount';

function ThemeSynchronizer() {
  const theme = useAppSelector((state) => state.settings.theme);

  useEffect(() => {
    const updateTheme = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  return null;
}

// The tenant shell is not for staff. Anything under it sends a superuser to
// the portal, so there is no way to wander into an empty tenant view.
function TenantOnly({ children }: { children: React.ReactNode }) {
  const isStaff = useAppSelector((state) => state.auth.user?.is_superuser === true);
  if (isStaff) return <Navigate to="/platform" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Staff belong to no tenant: the portal is the whole of their app.
  if (user?.is_superuser) return <Navigate to="/platform" replace />;
  // `tour_completed_at` is stamped by the server when the tour is finished
  // or skipped. A user cached from before the field existed has it
  // undefined; they have been here a while, so they are not shown the tour.
  const owesTour = user !== null && user.tour_completed_at === null;
  if (owesTour) return <Navigate to="/onboarding" replace />;
  // The Copilot is the home page: one question, asked well, is where a day
  // starts. Dashboards are a click away in the sidebar.
  return <Navigate to="/copilot" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeSynchronizer />
      <Routes>
        {/* Public routes — nobody is signed in yet on any of these. */}
        <Route path="/login" element={<Login />} />
        {/* Where revenact-backend's OAuth callback redirects the browser. */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* The product tour shows real surfaces, so it is behind the session
            like everything else rather than public. */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <TenantOnly>
                <OnboardingCarousel />
              </TenantOnly>
            </ProtectedRoute>
          }
        />

        {/* The internal portal: Revenact staff, second factor required. Its
            own shell, never the tenant one. */}
        <Route
          path="/platform"
          element={
            <ProtectedRoute>
              <RequirePlatform>
                <PlatformLayout />
              </RequirePlatform>
            </ProtectedRoute>
          }
        >
          <Route index element={<PlatformOverview />} />
          <Route path="organisations" element={<PlatformOrganisations />} />
          <Route path="organisations/:id" element={<PlatformOrganisationDetail />} />
          <Route path="staff" element={<PlatformStaff />} />
        </Route>
        {/* Where the second factor is set up, so it cannot require one. */}
        <Route
          path="/platform/account"
          element={
            <ProtectedRoute>
              <RequirePlatform requireMfa={false}>
                <PlatformLayout />
              </RequirePlatform>
            </ProtectedRoute>
          }
        >
          <Route index element={<PlatformAccount />} />
        </Route>

        {/* Protected routes (tenant shell) */}
        <Route path="/" element={
          <ProtectedRoute>
            <TenantOnly>
              <DashboardLayout />
            </TenantOnly>
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
                {/* Account Name / Activity Type / Sentiment / AI Area /
                    AI Category / AI Subcategory / Revenue Bracket used to be
                    routes here, each falling through to a placeholder — so
                    clicking a control that reads "All" unmounted the
                    dashboard. They're real filter dropdowns on the
                    container's own bar now, and the old paths land back on
                    Controls. Same fix, and same absolute-redirect reason, as
                    the ticket block below. */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard/advance/ai-trending/controls" replace />}
                />
              </Route>
              <Route path="health" element={<HealthOverviewContainer />}>
                {/* Triage lands first: it answers "who do I call today", which
                    is what a CSM opens this screen for. Controls keeps the
                    nine-card portfolio view for the manager's read. */}
                <Route index element={<Navigate to="triage" replace />} />
                <Route path="triage" element={<TriageView />} />
                <Route path="divergence" element={<DivergenceView />} />
                <Route path="movement" element={<MovementView />} />
                <Route path="renewal-date" element={<RenewalView />} />
                <Route path="controls" element={<HealthControlsView />} />
                {/* Primary Owner / Lifecycle Stage / Account used to be
                    routes here, each falling through to a placeholder. Primary
                    Owner is a real filter on the container's own bar now; the
                    other two are gone rather than left as dead ends. Old paths
                    land back on Triage, same as the other two dashboards.
                    Absolute, not relative: a relative "triage" resolves against
                    the unmatched path and would match this catch-all again. */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard/advance/health/triage" replace />}
                />
              </Route>
              <Route path="customer" element={<CustomerOverviewContainer />}>
                <Route index element={<Navigate to="controls" replace />} />
                <Route path="controls" element={<CustomerControlsView />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard/advance/customer/controls" replace />}
                />
              </Route>
              <Route path="activity" element={<ActivityContainer />}>
                <Route index element={<Navigate to="controls" replace />} />
                <Route path="controls" element={<ActivityControlsView />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard/advance/activity/controls" replace />}
                />
              </Route>
              <Route path="revenue" element={<ForecastContainer />}>
                <Route index element={<Navigate to="controls" replace />} />
                <Route path="controls" element={<ForecastControlsView />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard/advance/revenue/controls" replace />}
                />
              </Route>
              <Route path="usage" element={<UsageOverviewContainer />}>
                <Route index element={<Navigate to="controls" replace />} />
                <Route path="controls" element={<UsageControlsView />} />
                {/* Same absolute redirect as the other dashboards — a relative
                    "controls" resolves against the unmatched path and would
                    match this catch-all again, appending forever. */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard/advance/usage/controls" replace />}
                />
              </Route>
              <Route path="product" element={<ProductUsageContainer />}>
                <Route index element={<Navigate to="controls" replace />} />
                <Route path="controls" element={<ProductControlsView />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard/advance/product/controls" replace />}
                />
              </Route>
              <Route path="ticket" element={<TicketOverviewContainer />}>
                <Route index element={<Navigate to="controls" replace />} />
                <Route path="controls" element={<TicketControlsView />} />
                {/* Ticket Date / Primary Owner / Ticket Priority / Account
                    used to be routes here, each falling through to the
                    placeholder below — so clicking a control that reads
                    "All" unmounted the dashboard. They're real filter
                    dropdowns on the container's own bar now, and anything
                    still pointing at the old paths lands back on Controls
                    rather than on "under development". */}
                {/* Absolute, not relative: a relative "controls" resolves
                    against the unmatched path, so /ticket/ticket-priority
                    would redirect to /ticket/ticket-priority/controls,
                    match this same catch-all again, and append forever. */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard/advance/ticket/controls" replace />}
                />
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

          <Route path="communications" element={<CommunicationsPage />} />

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

          <Route path="campaigns">
            <Route index element={<CampaignsList />} />
            <Route path="create" element={<CampaignEditor />} />
            <Route path=":id" element={<CampaignEditor />} />
          </Route>

          <Route path="settings">
            <Route index element={<Navigate to="data" replace />} />
            <Route path="data" element={<SettingsPage />} />
            <Route path="currency" element={<CurrencyPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="entity-uploads" element={<EntityUploadsPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="activities" element={<SettingPlaceholder title="Activities" />} />
            <Route path="global-presets" element={<GlobalPresetsPage />} />
            <Route path="connect-widget" element={<SettingPlaceholder title="Connect Widget" />} />
            <Route path="ai-agent" element={<AIAgentPage />} />
            <Route path="ai-attributes" element={<AIAttributesPage />} />
            <Route path="agent-access" element={<AgentAccessPage />} />
          </Route>

          <Route path="account-settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<AccountSettingsPage />} />
            <Route path="billing" element={<BillingSettingsPage />} />
            <Route path="integrations" element={<IntegrationsSettingsPage />} />
            <Route path="personalization" element={<PersonalizationPage />} />
            <Route path="skills" element={<SkillsTasksPage />} />
            <Route path="about" element={<AboutSettingsPage />} />
          </Route>
          
          <Route path="integrations" element={<Integrations />} />

          <Route path="profile" element={<Profile />} />
          <Route path="users" element={<RequireCapability capability="manage_users"><UserManagement /></RequireCapability>} />
          
          <Route path="contacts">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<ContactsList />} />
            <Route path=":id" element={<ContactDetails />} />
          </Route>

          <Route path="custom-objects/:id" element={<CustomObjectRecordsPage />} />

          <Route path="pipelines">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<PipelinesPage view="list" />} />
            <Route path="board" element={<PipelinesPage view="board" />} />
          </Route>

          {/* Company Brain: one real page now (the metric layer). The mock
              knowledge-graph pages that lived under here were removed. */}
          <Route path="brain" element={<RequireCapability capability="view_all_accounts"><Outlet /></RequireCapability>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BrainDashboard />} />
            <Route path="initiatives" element={<InitiativesPage />} />
            <Route path="review" element={<ReviewQueuePage />} />
            <Route path="feedback" element={<FeedbackLogPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="graph" element={<GraphPage />} />
            <Route path="requests" element={<FeatureRequestsPage />} />
            <Route path="anomalies" element={<AnomaliesPage />} />
            <Route path="*" element={<Navigate to="/brain/dashboard" replace />} />
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
