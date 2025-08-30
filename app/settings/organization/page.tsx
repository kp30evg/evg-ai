'use client'

import { OrganizationProfile } from '@clerk/nextjs'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OrganizationSettingsPage() {
  const router = useRouter()
  
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFBFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}40`,
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.lightGray}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: colors.mediumGray,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 200ms ease-out'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.softGreen
              e.currentTarget.style.borderColor = colors.evergreen + '30'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = colors.lightGray
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: colors.softGreen,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} color={colors.evergreen} />
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: colors.charcoal,
                margin: 0
              }}>
                Organization Settings
              </h1>
              <p style={{
                fontSize: '13px',
                color: colors.mediumGray,
                margin: '2px 0 0 0'
              }}>
                Manage your organization, members, and permissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '32px auto',
        padding: '0 24px'
      }}>
        <div style={{
          backgroundColor: colors.white,
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
        }}>
          <OrganizationProfile
            appearance={{
              elements: {
                rootBox: {
                  width: '100%'
                },
                card: {
                  border: 'none',
                  boxShadow: 'none',
                  padding: 0
                },
                navbar: {
                  backgroundColor: '#FAFBFC',
                  borderRadius: '10px',
                  padding: '8px',
                  marginBottom: '24px'
                },
                navbarButton: {
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  color: colors.mediumGray,
                  '&:hover': {
                    backgroundColor: colors.white
                  },
                  '&[data-active="true"]': {
                    backgroundColor: colors.white,
                    color: colors.evergreen,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }
                },
                pageScrollBox: {
                  padding: '24px 0'
                },
                profileSectionTitle: {
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.charcoal,
                  marginBottom: '16px'
                },
                profileSectionSubtitle: {
                  fontSize: '14px',
                  color: colors.mediumGray
                },
                formFieldLabel: {
                  fontSize: '13px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '6px'
                },
                formFieldInput: {
                  fontSize: '14px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.lightGray}`,
                  '&:focus': {
                    borderColor: colors.evergreen,
                    boxShadow: `0 0 0 3px ${colors.evergreen}15`
                  }
                },
                formButtonPrimary: {
                  backgroundColor: colors.evergreen,
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: '#154029'
                  }
                },
                formButtonSecondary: {
                  color: colors.mediumGray,
                  border: `1px solid ${colors.lightGray}`,
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: colors.softGreen
                  }
                },
                avatarBox: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px'
                },
                avatarImageActionBox: {
                  borderRadius: '8px'
                },
                badge: {
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: colors.evergreen + '10',
                  color: colors.evergreen
                },
                tableHead: {
                  backgroundColor: '#FAFBFC',
                  borderBottom: `1px solid ${colors.lightGray}40`
                },
                tableHeadCell: {
                  fontSize: '12px',
                  fontWeight: '600',
                  color: colors.mediumGray,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '12px 16px'
                },
                tableCell: {
                  fontSize: '14px',
                  color: colors.charcoal,
                  padding: '16px',
                  borderBottom: `1px solid ${colors.lightGray}20`
                },
                memberListItem: {
                  padding: '16px',
                  borderBottom: `1px solid ${colors.lightGray}20`,
                  '&:hover': {
                    backgroundColor: '#FAFBFC'
                  }
                },
                invitationListItem: {
                  padding: '16px',
                  borderBottom: `1px solid ${colors.lightGray}20`,
                  backgroundColor: colors.softGreen + '20'
                },
                formButtonDanger: {
                  backgroundColor: '#EF4444',
                  color: colors.white,
                  '&:hover': {
                    backgroundColor: '#DC2626'
                  }
                }
              },
              baseTheme: undefined
            }}
          />
        </div>

        {/* Features Info */}
        <div style={{
          marginTop: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${colors.lightGray}40`
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.evergreen,
              marginBottom: '8px'
            }}>
              Member Management
            </h3>
            <p style={{
              fontSize: '13px',
              color: colors.mediumGray,
              lineHeight: 1.6
            }}>
              Invite team members, manage roles, and control access to your organization's resources.
            </p>
          </div>
          
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${colors.lightGray}40`
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.evergreen,
              marginBottom: '8px'
            }}>
              Roles & Permissions
            </h3>
            <p style={{
              fontSize: '13px',
              color: colors.mediumGray,
              lineHeight: 1.6
            }}>
              Define custom roles and permissions to ensure team members have appropriate access levels.
            </p>
          </div>
          
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${colors.lightGray}40`
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.evergreen,
              marginBottom: '8px'
            }}>
              Domain Verification
            </h3>
            <p style={{
              fontSize: '13px',
              color: colors.mediumGray,
              lineHeight: 1.6
            }}>
              Verify your domain to automatically invite users with your company email addresses.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}