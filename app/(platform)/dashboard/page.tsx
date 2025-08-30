'use client'

import CommandInterface from '@/components/dashboard/CommandInterface'

export default function DashboardPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: '#FAFBFC'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px'
      }}>
        <CommandInterface />
      </div>
    </div>
  )
}