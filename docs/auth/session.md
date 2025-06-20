# Session Management with Supabase Auth

## Overview

- Use Supabase Auth's built-in session management for tracking user authentication state.
- Store JWTs securely (prefer in-memory or HTTP-only cookies for sensitive apps).
- React to session changes in the frontend and validate tokens in the backend.

## Frontend Patterns

- Use `@supabase/supabase-js` client, which auto-refreshes JWTs.
- Listen to `onAuthStateChange` for login, logout, and token refresh events.
- Store session state in a React context or global state (e.g., Zustand).
- Expose hooks: `useSession`, `useUser`, `useIsAuthenticated`.

### Example: Session Context (React)

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabaseClient';

export const SessionContext = createContext(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(supabase.auth.getSession());

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => listener?.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
```

## Token Storage

- By default, Supabase uses localStorage. For higher security, use custom storage (in-memory or cookies) via the `storage` option in `createClient`.
- Never store JWTs in localStorage for highly sensitive apps.

## Backend/Edge Function Validation

- Extract JWT from `Authorization` header.
- Use `supabase.auth.getUser(jwt)` to validate and decode.
- Return 401/403 for expired or invalid tokens.

## Automatic Session Refresh

- Supabase client auto-refreshes session using the refresh token.
- No manual refresh logic needed unless using custom storage.

## Best Practices

- Always validate JWTs on the backend.
- React to session changes in the UI.
- Use secure, HTTP-only cookies for SSR/Next.js or hybrid apps.

## Testing

- Write tests for session context, login/logout flows, and token refresh logic.
