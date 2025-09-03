'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, AlertCircle, RefreshCw, Settings, ExternalLink } from 'lucide-react';

interface CalendarAccount {
  id: string;
  email: string;
  name: string;
  connected: boolean;
  lastSync?: string;
  calendarCount?: number;
}

interface CalendarConnectButtonProps {
  variant?: 'button' | 'card';
  onConnectionChange?: (connected: boolean) => void;
}

export function CalendarConnectButton({ 
  variant = 'button', 
  onConnectionChange 
}: CalendarConnectButtonProps) {
  const { userId, orgId } = useAuth();
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load connected calendar accounts
  const loadAccounts = async () => {
    if (!orgId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/calendar/accounts');
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        onConnectionChange?.(data.accounts?.length > 0);
      } else if (response.status === 401) {
        const errorData = await response.json();
        console.log('Calendar accounts require authentication:', errorData.debug);
        setAccounts([]);
        onConnectionChange?.(false);
        // Don't set this as an error for 401 - it's expected when not logged in
      } else {
        console.error('Failed to load calendar accounts');
        setError('Failed to load calendar accounts');
      }
    } catch (error) {
      console.error('Error loading calendar accounts:', error);
      setError('Failed to load calendar accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      loadAccounts();
    }
  }, [orgId]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/calendar/connect', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to initiate connection');
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      setError('Failed to connect calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (accountId?: string) => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const response = await fetch('/api/calendar/google/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Synced ${result.importedCount || 0} events from Google Calendar`);
        
        // Reload accounts to get updated sync time
        await loadAccounts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to sync calendar');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      setError('Failed to sync calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar account?')) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/auth/calendar/disconnect/${accountId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadAccounts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disconnect calendar');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      setError('Failed to disconnect calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never synced';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (variant === 'button') {
    const hasConnectedAccounts = accounts.length > 0;
    
    return (
      <div className="space-y-2">
        <Button 
          onClick={hasConnectedAccounts ? () => handleSync() : handleConnect}
          disabled={isLoading || isSyncing}
          variant={hasConnectedAccounts ? "outline" : "default"}
          className="w-full"
        >
          {hasConnectedAccounts ? (
            <>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Calendar'}
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
            </>
          )}
        </Button>
        
        {error && (
          <div className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
        
        {hasConnectedAccounts && (
          <div className="text-xs text-gray-500 text-center">
            {accounts.length} calendar{accounts.length !== 1 ? 's' : ''} connected
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
            Google Calendar
          </div>
          <Button 
            onClick={handleConnect}
            disabled={isLoading}
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add Calendar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No calendars connected
            </h3>
            <p className="text-gray-600 mb-4">
              Connect your Google Calendar to sync events and manage your schedule
            </p>
            <Button onClick={handleConnect} disabled={isLoading}>
              <Calendar className="h-4 w-4 mr-2" />
              {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {account.connected ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-600">{account.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleSync(account.id)}
                      disabled={isSyncing || !account.connected}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    
                    <Button
                      onClick={() => handleDisconnect(account.id)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 font-medium ${
                      account.connected ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {account.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Last sync:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {formatLastSync(account.lastSync)}
                    </span>
                  </div>
                  
                  {account.calendarCount !== undefined && (
                    <div>
                      <span className="text-gray-500">Calendars:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {account.calendarCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}