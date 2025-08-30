'use client'

import CommandInterface from '@/components/dashboard/CommandInterface'

export default function CommandPage() {
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFBFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Simple Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}40`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: colors.evergreen,
            letterSpacing: '-0.01em'
          }}>
            evergreenOS
          </div>
          <div style={{
            padding: '4px 10px',
            backgroundColor: colors.softGreen,
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            color: colors.evergreen,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            AI Command Center
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: colors.mediumGray,
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            History
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: colors.mediumGray,
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Settings
          </button>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: colors.evergreen,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.white,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            U
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 65px)',
        position: 'relative'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '240px',
          backgroundColor: colors.white,
          borderRight: `1px solid ${colors.lightGray}40`,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '8px'
        }}>
          <button style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: colors.evergreen,
            color: colors.white,
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '16px' }}>+</span>
            New Chat
          </button>

          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: colors.mediumGray,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '8px 16px'
          }}>
            Recent
          </div>

          {['Revenue analysis Q3', 'Customer segmentation', 'Inventory optimization', 'Team performance'].map((item, i) => (
            <button key={i} style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              color: colors.charcoal,
              cursor: 'pointer',
              textAlign: 'left' as const,
              transition: 'all 200ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.softGreen
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}>
              {item}
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '800px'
          }}>
            <CommandInterface />
          </div>
        </div>
      </div>
    </div>
  )
}