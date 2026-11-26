'use client'
 
import { useEffect, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/auth-store'
 
let browserQueryClient: QueryClient | undefined
 
function getQueryClient() {
  // Keep server requests isolated and preserve the browser cache across renders.
  if (typeof window === 'undefined') return new QueryClient()
  browserQueryClient ??= new QueryClient()
  return browserQueryClient
}
 
export function Providers({ children }: { children: ReactNode }) {
  const client = getQueryClient()

  // Everything cached belongs to whoever was signed in. When the account changes on this tab (sign-out, then another
  // sign-in, with no reload), drop it all so the next customer never sees the previous one's data or status, such as
  // an onboarding already finished that would hide their first-login preferences popup.
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (previous.hasHydrated && state.user?.id !== previous.user?.id) client.clear()
      }),
    [client],
  )

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  )
}