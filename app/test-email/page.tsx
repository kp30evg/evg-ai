'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@clerk/nextjs';

export default function TestEmailPage() {
  const { user } = useUser();
  const [to, setTo] = useState('kian.pezeshki1@gmail.com');
  const [subject, setSubject] = useState('Test Email');
  const [body, setBody] = useState('This is a test email');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = trpc.evermail.sendEmail.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      setResult(null);
    }
  });

  const checkStatus = trpc.evermail.getGmailStatus.useQuery();

  const handleSend = () => {
    sendEmail.mutate({
      to: [to],
      subject,
      body
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Email Test Page</h1>
      
      <div style={{ marginBottom: '20px', background: '#f0f0f0', padding: '10px' }}>
        <h3>Current User Info:</h3>
        <p>Clerk User ID: {user?.id || 'Not loaded'}</p>
        <p>Email: {user?.primaryEmailAddress?.emailAddress || 'Not loaded'}</p>
      </div>

      <div style={{ marginBottom: '20px', background: '#f0f0f0', padding: '10px' }}>
        <h3>Gmail Status:</h3>
        {checkStatus.isLoading && <p>Loading...</p>}
        {checkStatus.data && (
          <>
            <p>Connected: {checkStatus.data.connected ? 'Yes' : 'No'}</p>
            <p>Email Count: {checkStatus.data.emailCount}</p>
            <p>Last Sync: {checkStatus.data.lastSyncAt || 'Never'}</p>
          </>
        )}
        {checkStatus.error && <p style={{ color: 'red' }}>Error: {checkStatus.error.message}</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Send Test Email:</h3>
        <div>
          <label>To: </label>
          <input 
            type="email" 
            value={to} 
            onChange={(e) => setTo(e.target.value)}
            style={{ width: '300px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <label>Subject: </label>
          <input 
            type="text" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            style={{ width: '300px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <label>Body: </label>
          <textarea 
            value={body} 
            onChange={(e) => setBody(e.target.value)}
            style={{ width: '300px', height: '100px', marginBottom: '10px' }}
          />
        </div>
        <button 
          onClick={handleSend}
          disabled={sendEmail.isPending}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          {sendEmail.isPending ? 'Sending...' : 'Send Email'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#ffcccc', padding: '10px', marginTop: '20px' }}>
          <h3>Error:</h3>
          <pre>{error}</pre>
        </div>
      )}

      {result && (
        <div style={{ background: '#ccffcc', padding: '10px', marginTop: '20px' }}>
          <h3>Success!</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}