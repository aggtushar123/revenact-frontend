import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counter/counterSlice';
import authReducer, { loggedOut, refreshSession } from './features/auth/authSlice';
import tasksReducer from './features/tasks/tasksSlice';
import userManagementReducer from './features/userManagement/userManagementSlice';
import customersReducer from './features/customers/customersSlice';
import copilotSessionsReducer from './features/copilotSessions/copilotSessionsSlice';
import notificationsReducer from './features/notifications/notificationsSlice';
import ticketsReducer from './features/tickets/ticketsSlice';
import healthReducer from './features/health/healthSlice';
import interactionsReducer from './features/interactions/interactionsSlice';
import usageReducer from './features/usage/usageSlice';
import forecastReducer from './features/forecast/forecastSlice';
import activityReducer from './features/activity/activitySlice';
import portfolioReducer from './features/portfolio/portfolioSlice';
import productsReducer from './features/products/productsSlice';
import metricsReducer from './features/metrics/metricsSlice';
import initiativesReducer from './features/initiatives/initiativesSlice';
import proposalsReducer from './features/proposals/proposalsSlice';
import feedbackReducer from './features/feedback/feedbackSlice';
import agentsReducer from './features/agents/agentsSlice';
import skillsReducer from './features/skills/skillsSlice';
import connectorsReducer from './features/connectors/connectorsSlice';
import { setAuthHooks } from './lib/apiClient';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    tasks: tasksReducer,
    userManagement: userManagementReducer,
    customers: customersReducer,
    copilotSessions: copilotSessionsReducer,
    notifications: notificationsReducer,
    tickets: ticketsReducer,
    health: healthReducer,
    interactions: interactionsReducer,
    usage: usageReducer,
    forecast: forecastReducer,
    activity: activityReducer,
    portfolio: portfolioReducer,
    products: productsReducer,
    metrics: metricsReducer,
    initiatives: initiativesReducer,
    proposals: proposalsReducer,
    feedback: feedbackReducer,
    agents: agentsReducer,
    skills: skillsReducer,
    connectors: connectorsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Wires apiClient's auto-refresh-on-401 to this store, without apiClient
// importing the store or authSlice directly (that would cycle back through
// authSlice's own thunks, which call apiFetch). See lib/apiClient.ts.
setAuthHooks({
  getAccessToken: () => store.getState().auth.accessToken,
  refreshAccessToken: async () => {
    const result = await store.dispatch(refreshSession());
    return refreshSession.fulfilled.match(result) ? result.payload.accessToken : null;
  },
  onAuthFailure: () => store.dispatch(loggedOut()),
});
