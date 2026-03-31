---
description: Authentication flow - login, session management, and logout
---

# Authentication Flow

## Overview
The app uses a client-side authentication system with Redux Toolkit for state management and Zod for form validation. There is no backend — credentials and tokens are simulated.

## Dummy Credentials
| Email | Password |
|---|---|
| `admin@revenact.io` | `password123` |
| `demo@revenact.io` | `demo1234` |

## Login Flow

1. User navigates to any route → `ProtectedRoute` checks Redux `auth.isAuthenticated`
2. If not authenticated → redirect to `/login`
3. User fills in email + password → **Zod validates** the form
4. On submit → `login` async thunk fires (simulates 800ms API call)
5. Credentials matched → dummy access + refresh tokens generated, user stored
6. State + tokens persisted to `localStorage`
7. User redirected to `/dashboard` (or their originally intended route)

## Session Persistence

- On app load, `authSlice` hydrates from `localStorage` keys:
  - `revenact_access_token`
  - `revenact_refresh_token`
  - `revenact_user`
- If all three exist, user is auto-authenticated (no re-login needed)

## Logout Flow

1. User expands the sidebar → "Sign out" button appears at the bottom
2. Click "Sign out" → dispatches `logout()` action
3. Redux state cleared + `localStorage` keys removed
4. User redirected to `/login`

## Key Files

| File | Purpose |
|---|---|
| `src/features/auth/authSlice.ts` | Redux slice — state, thunks, persistence |
| `src/features/auth/loginSchema.ts` | Zod validation schema |
| `src/pages/auth/Login.tsx` | Login page UI component |
| `src/pages/auth/Login.css` | Login page styles |
| `src/components/auth/ProtectedRoute.tsx` | Route guard component |
| `src/store.ts` | Redux store (includes auth reducer) |
| `src/App.tsx` | Routes (public /login + protected dashboard) |

## Adding New Dummy Users

Edit `DUMMY_USERS` in `src/features/auth/authSlice.ts`:

```ts
const DUMMY_USERS = {
  'newemail@revenact.io': {
    password: 'newpassword',
    user: {
      email: 'newemail@revenact.io',
      name: 'New User',
      avatar: 'https://i.pravatar.cc/150?u=newuser',
    },
  },
  // ... existing users
};
```
