import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counter/counterSlice';
import authReducer, { loggedOut, refreshSession } from './features/auth/authSlice';
import tasksReducer from './features/tasks/tasksSlice';
import brainReducer from './features/brain/brainSlice';
import userManagementReducer from './features/userManagement/userManagementSlice';
import customersReducer from './features/customers/customersSlice';
import { setAuthHooks } from './lib/apiClient';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    tasks: tasksReducer,
    brain: brainReducer,
    userManagement: userManagementReducer,
    customers: customersReducer,
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
