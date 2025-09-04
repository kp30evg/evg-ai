'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Calendar, Shield, CheckCircle2, ArrowRight, Lock } from 'lucide-react';

interface OAuthConnectionPromptProps {
  type: 'gmail' | 'calendar';
  onConnect: () => void;
  userEmail?: string;
}

export default function OAuthConnectionPrompt({ type, onConnect, userEmail }: OAuthConnectionPromptProps) {
  const isGmail = type === 'gmail';
  const Icon = isGmail ? Mail : Calendar;
  const service = isGmail ? 'Gmail' : 'Google Calendar';
  const module = isGmail ? 'EverMail' : 'EverCal';
  
  const features = isGmail ? [
    'Sync all your Gmail messages',
    'Send emails with AI assistance',
    'Smart filtering and search',
    'Unified inbox management',
    'Email analytics and insights'
  ] : [
    'Sync your Google Calendar events',
    'Smart scheduling with AI',
    'Meeting availability management',
    'Automated calendar insights',
    'Cross-platform event sync'
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full border-2">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-2xl flex items-center justify-center">
                <Icon className="h-10 w-10 text-emerald-600" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-200">
                <Lock className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Connect Your {service}
          </CardTitle>
          
          <CardDescription className="text-base mt-3">
            {module} requires access to your {service} account to provide its intelligent features.
            Your data is always encrypted and private to you.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security Badge */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Enterprise-grade Security</p>
              <p className="text-sm text-blue-700 mt-1">
                Your {service} data is encrypted and isolated. Only you can access your personal emails and events.
                We use OAuth 2.0 for secure authentication without storing your password.
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">After connecting, you'll be able to:</p>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Current User Info */}
          {userEmail && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Connecting as: <span className="font-medium text-gray-900">{userEmail}</span>
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-6">
          <Button 
            onClick={onConnect}
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-6 text-base group"
          >
            <Icon className="mr-2 h-5 w-5" />
            Connect {service}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            By connecting, you agree to our data processing terms. 
            You can disconnect at any time from Settings.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}