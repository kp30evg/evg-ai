'use client'

import { OrganizationList, CreateOrganization } from '@clerk/nextjs'
import { useState } from 'react'
import { Building2, Plus, Users, ArrowRight } from 'lucide-react'

export default function SelectOrgPage() {
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  }

  if (showCreateOrg) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FAFBFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: colors.white,
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
        }}>
          <button
            onClick={() => setShowCreateOrg(false)}
            style={{
              marginBottom: '24px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.lightGray}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: colors.mediumGray,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Back to organizations
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: colors.softGreen,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={24} color={colors.evergreen} />
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: colors.charcoal,
                margin: 0
              }}>
                Create Organization
              </h1>
              <p style={{
                fontSize: '14px',
                color: colors.mediumGray,
                margin: '4px 0 0 0'
              }}>
                Set up your workspace for team collaboration
              </p>
            </div>
          </div>
          
          <CreateOrganization
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
                headerTitle: {
                  display: 'none'
                },
                headerSubtitle: {
                  display: 'none'
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
                }
              },
              baseTheme: undefined
            }}
            afterCreateOrganizationUrl="/dashboard"
            skipInvitationScreen={false}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFBFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: colors.softGreen,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Building2 size={32} color={colors.evergreen} />
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '600',
            color: colors.charcoal,
            marginBottom: '12px',
            letterSpacing: '-0.02em'
          }}>
            Select Your Organization
          </h1>
          <p style={{
            fontSize: '16px',
            color: colors.mediumGray,
            lineHeight: 1.6
          }}>
            Choose an organization to continue or create a new one to get started
          </p>
        </div>

        {/* Create Organization Button */}
        <button
          onClick={() => setShowCreateOrg(true)}
          style={{
            width: '100%',
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: colors.white,
            border: `2px dashed ${colors.evergreen}40`,
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 200ms ease-out'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = colors.softGreen
            e.currentTarget.style.borderColor = colors.evergreen
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = colors.white
            e.currentTarget.style.borderColor = colors.evergreen + '40'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: colors.evergreen + '10',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Plus size={20} color={colors.evergreen} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: colors.evergreen,
              marginBottom: '4px'
            }}>
              Create New Organization
            </div>
            <div style={{
              fontSize: '14px',
              color: colors.mediumGray
            }}>
              Start fresh with a new workspace for your team
            </div>
          </div>
          <ArrowRight size={20} color={colors.evergreen} style={{ marginLeft: 'auto' }} />
        </button>

        {/* Organization List */}
        <div style={{
          backgroundColor: colors.white,
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <Users size={18} color={colors.mediumGray} />
            <h2 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: 0
            }}>
              Your Organizations
            </h2>
          </div>
          
          <OrganizationList
            appearance={{
              elements: {
                rootBox: {
                  width: '100%'
                },
                card: {
                  border: 'none',
                  boxShadow: 'none',
                  padding: 0,
                  backgroundColor: 'transparent'
                },
                organizationListItem: {
                  padding: '16px',
                  marginBottom: '8px',
                  backgroundColor: '#FAFBFC',
                  borderRadius: '10px',
                  border: `1px solid ${colors.lightGray}40`,
                  cursor: 'pointer',
                  transition: 'all 200ms ease-out',
                  '&:hover': {
                    backgroundColor: colors.softGreen,
                    borderColor: colors.evergreen + '30',
                    transform: 'translateX(4px)'
                  }
                },
                organizationListItemTextContainer: {
                  gap: '4px'
                },
                organizationListItemName: {
                  fontSize: '15px',
                  fontWeight: '600',
                  color: colors.charcoal
                },
                organizationListItemSlug: {
                  fontSize: '13px',
                  color: colors.mediumGray
                },
                organizationAvatarBox: {
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px'
                },
                organizationListCreateOrganizationActionButton: {
                  display: 'none'
                },
                organizationListItemMembersCount: {
                  fontSize: '12px',
                  padding: '4px 8px',
                  backgroundColor: colors.evergreen + '10',
                  color: colors.evergreen,
                  borderRadius: '6px',
                  fontWeight: '500'
                }
              },
              baseTheme: undefined
            }}
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
            hideSlug={false}
            hidePersonal={true}
          />
        </div>

        {/* Help Text */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px'
        }}>
          <p style={{
            fontSize: '13px',
            color: colors.mediumGray
          }}>
            Organizations help you manage teams, projects, and permissions
          </p>
        </div>
      </div>
    </div>
  )
}