'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings,
  Calendar,
  Clock,
  Database,
  Link,
  Unlink,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function EmailSettingsPage() {
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Get Gmail status
  const { data: gmailStatus, refetch } = trpc.evermail.getGmailStatus.useQuery();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success === 'gmail_connected') {
      setMessage({ type: 'success', text: 'Gmail account connected successfully!' });
      refetch();
      // Clear URL params
      window.history.replaceState({}, '', '/mail/settings');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'oauth_denied': 'You denied the permission request',
        'no_code': 'No authorization code received from Google',
        'not_authenticated': 'Please sign in first',
        'token_exchange_failed': 'Failed to exchange authorization code',
        'gmail_api_disabled': 'Gmail API needs to be enabled in Google Cloud Console',
        'callback_failed': 'OAuth callback failed',
        'config_error': 'OAuth configuration error',
        'oauth_init_failed': 'Failed to initiate OAuth flow'
      };
      
      setMessage({ 
        type: 'error', 
        text: errorMessages[error] || 'Failed to connect Gmail account' 
      });
      // Clear URL params
      window.history.replaceState({}, '', '/mail/settings');
    }
  }, [searchParams, refetch]);
  
  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Connect Gmail mutation
  const connectGmail = trpc.evermail.connectGmail.useMutation({
    onSuccess: () => {
      refetch();
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error('Failed to connect Gmail:', error);
      setIsConnecting(false);
    }
  });

  // Disconnect Gmail mutation
  const disconnectGmail = trpc.evermail.disconnectGmail.useMutation({
    onSuccess: () => {
      refetch();
      setIsDisconnecting(false);
    },
    onError: (error) => {
      console.error('Failed to disconnect Gmail:', error);
      setIsDisconnecting(false);
    }
  });

  // Sync emails mutation
  const syncEmails = trpc.evermail.syncEmails.useMutation({
    onSuccess: (data) => {
      refetch();
      setIsSyncing(false);
      setMessage({ 
        type: 'success', 
        text: `Successfully synced ${data.synced} emails!` 
      });
      
      // Redirect to inbox after successful sync
      if (data.redirectTo) {
        setTimeout(() => {
          window.location.href = data.redirectTo;
        }, 1500);
      }
    },
    onError: (error) => {
      console.error('Sync failed:', error);
      setIsSyncing(false);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to sync emails' 
      });
    }
  });

  const handleConnectGmail = () => {
    setIsConnecting(true);
    // Redirect to our OAuth initiation endpoint
    window.location.href = '/api/auth/gmail/connect';
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Gmail account? Your emails will remain in EverMail.')) {
      setIsDisconnecting(true);
      await disconnectGmail.mutateAsync();
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncEmails.mutateAsync();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Email Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your email account connections and sync settings
          </p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`px-6 py-4 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-b`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Gmail Connection Status */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Mail className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Gmail Account</h2>
                {gmailStatus?.connected ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Connected</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span>{gmailStatus.emailCount} emails synced</span>
                      </div>
                      {gmailStatus.lastSyncAt && (
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Last synced: {new Date(gmailStatus.lastSyncAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-gray-500">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Not connected</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Connect your Gmail account to sync emails and enable sending
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {gmailStatus?.connected ? (
                <>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectGmail}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4" />
                  )}
                  Connect Gmail
                </button>
              )}
            </div>
          </div>

          {/* Sync Error */}
          {gmailStatus?.syncError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Sync Error</p>
                  <p className="text-sm text-red-700 mt-1">{gmailStatus.syncError}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sync Settings */}
        {gmailStatus?.connected && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Sync Settings</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <p className="font-medium">Auto-sync new emails</p>
                  <p className="text-sm text-gray-600">
                    Automatically sync new emails as they arrive
                  </p>
                </div>
              </label>
              
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <p className="font-medium">Two-way sync</p>
                  <p className="text-sm text-gray-600">
                    Sync changes back to Gmail (read status, labels, etc.)
                  </p>
                </div>
              </label>
              
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <p className="font-medium">Sync attachments</p>
                  <p className="text-sm text-gray-600">
                    Download and store email attachments
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Instructions for setup */}
        {!gmailStatus?.connected && (
          <div className="p-6 bg-gray-50">
            <h3 className="text-lg font-medium mb-4">Setup Instructions</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>To connect your Gmail account:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Click the "Connect Gmail" button above</li>
                <li>Sign in to your Google account</li>
                <li>Grant EverMail permission to access your emails</li>
                <li>Wait for the initial sync to complete</li>
              </ol>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-900 font-medium">What permissions are required?</p>
                <ul className="list-disc list-inside mt-2 text-blue-800">
                  <li>Read and modify your emails</li>
                  <li>Send emails on your behalf</li>
                  <li>Manage drafts and labels</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}