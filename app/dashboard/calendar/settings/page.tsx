'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { CalendarConnectButton } from '@/components/evercal/calendar-connect-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  Settings, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Globe,
  Bell,
  Users,
  Download
} from 'lucide-react';

interface CalendarSettings {
  defaultDuration: number;
  workingHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  timezone: string;
  autoSync: boolean;
  syncInterval: number; // minutes
  notifications: {
    newMeeting: boolean;
    meetingReminder: boolean;
    reminderMinutes: number;
  };
}

const defaultSettings: CalendarSettings = {
  defaultDuration: 60,
  workingHours: {
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '17:00', enabled: true },
    saturday: { start: '09:00', end: '17:00', enabled: false },
    sunday: { start: '09:00', end: '17:00', enabled: false }
  },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  autoSync: true,
  syncInterval: 15,
  notifications: {
    newMeeting: true,
    meetingReminder: true,
    reminderMinutes: 15
  }
};

export default function CalendarSettingsPage() {
  const { userId, orgId } = useAuth();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<CalendarSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accounts, setAccounts] = useState([]);

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams?.get('success');
    const error = searchParams?.get('error');

    if (success === 'connected') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
      loadAccounts();
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        'connection_failed': 'Failed to connect Google Calendar. Please try again.',
        'oauth_not_configured': 'Google OAuth is not properly configured.',
        'invalid_state': 'Invalid authentication state. Please try again.',
        'missing_parameters': 'Missing required parameters. Please try again.',
        'no_access_token': 'Failed to obtain access token. Please try again.',
        'no_email': 'Could not get email from Google. Please check permissions.'
      };
      setMessage({ 
        type: 'error', 
        text: errorMessages[error] || 'An error occurred during connection.' 
      });
    }

    // Clear URL parameters after showing message
    if (success || error) {
      setTimeout(() => {
        window.history.replaceState({}, '', '/dashboard/calendar/settings');
      }, 100);
    }
  }, [searchParams]);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/auth/calendar/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading calendar accounts:', error);
    }
  };

  const loadSettings = async () => {
    if (!orgId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/calendar/settings`);
      
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data.settings });
      }
    } catch (error) {
      console.error('Error loading calendar settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!orgId) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/calendar/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const exportCalendarData = async () => {
    try {
      const response = await fetch('/api/calendar/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendar-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: 'Calendar data exported successfully!' });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting calendar data:', error);
      setMessage({ type: 'error', text: 'Failed to export calendar data.' });
    }
  };

  useEffect(() => {
    if (orgId) {
      loadSettings();
      loadAccounts();
    }
  }, [orgId]);

  const updateWorkingHours = (day: string, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day as keyof typeof prev.workingHours],
          [field]: value
        }
      }
    }));
  };

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday', 
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar Settings</h1>
          <p className="text-gray-600">Manage your calendar connections and preferences</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={exportCalendarData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            <Settings className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 
          'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {message.type === 'success' ? 
            <CheckCircle2 className="h-4 w-4 mr-2" /> : 
            <AlertCircle className="h-4 w-4 mr-2" />
          }
          {message.text}
        </div>
      )}

      {/* Google Calendar Connection */}
      <CalendarConnectButton variant="card" />

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-emerald-600" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="defaultDuration">Default Meeting Duration (minutes)</Label>
              <Input
                id="defaultDuration"
                type="number"
                value={settings.defaultDuration}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultDuration: parseInt(e.target.value) || 60 
                }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              checked={settings.autoSync}
              onCheckedChange={(checked) => setSettings(prev => ({ 
                ...prev, 
                autoSync: checked 
              }))}
            />
            <div>
              <Label>Auto-sync with Google Calendar</Label>
              <p className="text-sm text-gray-600">
                Automatically sync events every {settings.syncInterval} minutes
              </p>
            </div>
          </div>

          {settings.autoSync && (
            <div>
              <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
              <Input
                id="syncInterval"
                type="number"
                value={settings.syncInterval}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  syncInterval: parseInt(e.target.value) || 15 
                }))}
                className="mt-1 max-w-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-emerald-600" />
            Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(dayNames).map(([day, displayName]) => (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-24">
                  <Switch
                    checked={settings.workingHours[day as keyof typeof settings.workingHours].enabled}
                    onCheckedChange={(checked) => updateWorkingHours(day, 'enabled', checked)}
                  />
                </div>
                <div className="w-20 font-medium">{displayName}</div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="time"
                    value={settings.workingHours[day as keyof typeof settings.workingHours].start}
                    onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                    disabled={!settings.workingHours[day as keyof typeof settings.workingHours].enabled}
                    className="w-32"
                  />
                  <span>to</span>
                  <Input
                    type="time"
                    value={settings.workingHours[day as keyof typeof settings.workingHours].end}
                    onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                    disabled={!settings.workingHours[day as keyof typeof settings.workingHours].enabled}
                    className="w-32"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-emerald-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Switch
              checked={settings.notifications.newMeeting}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, newMeeting: checked }
              }))}
            />
            <div>
              <Label>New Meeting Notifications</Label>
              <p className="text-sm text-gray-600">
                Get notified when someone schedules a meeting with you
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              checked={settings.notifications.meetingReminder}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, meetingReminder: checked }
              }))}
            />
            <div>
              <Label>Meeting Reminders</Label>
              <p className="text-sm text-gray-600">
                Get reminded before meetings start
              </p>
            </div>
          </div>

          {settings.notifications.meetingReminder && (
            <div className="ml-8">
              <Label htmlFor="reminderMinutes">Reminder Time (minutes before)</Label>
              <Input
                id="reminderMinutes"
                type="number"
                value={settings.notifications.reminderMinutes}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { 
                    ...prev.notifications, 
                    reminderMinutes: parseInt(e.target.value) || 15 
                  }
                }))}
                className="mt-1 max-w-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts Summary */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-emerald-600" />
              Connected Accounts Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>{accounts.length} Google Calendar account{accounts.length !== 1 ? 's' : ''} connected</p>
              <p>Last sync: {accounts.some((acc: any) => acc.lastSync) ? 'Recently' : 'Never'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}