'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

/**
 * CRITICAL SECURITY FIX: Clear tRPC cache on user change
 * This prevents cross-user data leaks when switching accounts
 */
export function TRPCCacheBuster({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { userId, orgId } = useAuth();
  
  useEffect(() => {
    // Clear all queries when user or org changes
    if (userId || orgId) {
      console.log('[SECURITY] User context changed, clearing tRPC cache');
      queryClient.invalidateQueries();
      queryClient.clear();
    }
  }, [userId, orgId, queryClient]);
  
  // Also clear cache on mount to ensure fresh state
  useEffect(() => {
    console.log('[SECURITY] Component mounted, clearing stale cache');
    queryClient.invalidateQueries();
    return () => {
      // Clear cache on unmount as well
      queryClient.clear();
    };
  }, [queryClient]);
  
  return <>{children}</>;
}