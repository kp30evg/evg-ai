'use client'

import { motion } from 'framer-motion'
import { 
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Edit,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ContactHeaderProps {
  contact: any
  insights?: any
  activitySummary?: any
}

export default function ContactHeader({ contact, insights, activitySummary }: ContactHeaderProps) {
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600',
    blue: '#0EA5E9',
    purple: '#8B5CF6',
    orange: '#F97316',
    red: '#EF4444',
    green: '#10B981'
  }
  
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }
  
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'hot':
        return colors.green
      case 'inactive':
      case 'cold':
        return colors.blue
      case 'pending':
      case 'warm':
        return colors.orange
      default:
        return colors.mediumGray
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '12px',
        border: `1px solid ${colors.lightGray}40`,
        padding: '24px'
      }}
    >
      <div style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start'
      }}>
        {/* Avatar */}
        <div style={{
          position: 'relative'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: colors.evergreen + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: '600',
            color: colors.evergreen,
            border: `3px solid ${colors.white}`,
            boxShadow: `0 0 0 1px ${colors.lightGray}40`
          }}>
            {contact.data.avatar ? (
              <img 
                src={contact.data.avatar} 
                alt={`${contact.data.firstName} ${contact.data.lastName}`}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              getInitials(contact.data.firstName, contact.data.lastName)
            )}
          </div>
          
          {/* Status Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(contact.data.status || insights?.engagementLevel),
            border: `3px solid ${colors.white}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {contact.data.status === 'active' || insights?.engagementLevel === 'hot' ? (
              <CheckCircle size={10} color={colors.white} />
            ) : (
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: colors.white
              }} />
            )}
          </div>
        </div>
        
        {/* Contact Info */}
        <div style={{
          flex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: colors.charcoal,
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {contact.data.firstName} {contact.data.lastName}
                {contact.data.verified && (
                  <CheckCircle size={20} color={colors.blue} />
                )}
              </h1>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: colors.mediumGray
                }}>
                  {contact.data.jobTitle || 'No title'}
                </span>
                {contact.data.company && (
                  <>
                    <span style={{
                      color: colors.lightGray
                    }}>
                      at
                    </span>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colors.evergreen,
                      cursor: 'pointer'
                    }}>
                      {contact.data.company}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.evergreen
                  e.currentTarget.style.backgroundColor = colors.softGreen
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.lightGray
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Edit size={18} color={colors.mediumGray} />
              </button>
              
              <button
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MoreVertical size={18} color={colors.mediumGray} />
              </button>
            </div>
          </div>
          
          {/* Contact Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '20px'
          }}>
            {/* Email */}
            {contact.data.email && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Mail size={16} color={colors.mediumGray} />
                <a 
                  href={`mailto:${contact.data.email}`}
                  style={{
                    fontSize: '14px',
                    color: colors.evergreen,
                    textDecoration: 'none'
                  }}
                >
                  {contact.data.email}
                </a>
              </div>
            )}
            
            {/* Phone */}
            {contact.data.phone && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Phone size={16} color={colors.mediumGray} />
                <a 
                  href={`tel:${contact.data.phone}`}
                  style={{
                    fontSize: '14px',
                    color: colors.evergreen,
                    textDecoration: 'none'
                  }}
                >
                  {contact.data.phone}
                </a>
              </div>
            )}
            
            {/* Location */}
            {(contact.data.city || contact.data.country) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <MapPin size={16} color={colors.mediumGray} />
                <span style={{
                  fontSize: '14px',
                  color: colors.charcoal
                }}>
                  {[contact.data.city, contact.data.state, contact.data.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
            
            {/* Website */}
            {contact.data.website && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Globe size={16} color={colors.mediumGray} />
                <a 
                  href={contact.data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '14px',
                    color: colors.evergreen,
                    textDecoration: 'none'
                  }}
                >
                  {contact.data.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
          
          {/* Social Links */}
          {(contact.data.linkedin || contact.data.twitter) && (
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '16px'
            }}>
              {contact.data.linkedin && (
                <a 
                  href={contact.data.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px',
                    backgroundColor: colors.lightGray + '30',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 200ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0077B5' + '20'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.lightGray + '30'
                  }}
                >
                  <Linkedin size={18} color="#0077B5" />
                </a>
              )}
              
              {contact.data.twitter && (
                <a 
                  href={contact.data.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px',
                    backgroundColor: colors.lightGray + '30',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 200ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1DA1F2' + '20'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.lightGray + '30'
                  }}
                >
                  <Twitter size={18} color="#1DA1F2" />
                </a>
              )}
            </div>
          )}
        </div>
        
        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          minWidth: '200px'
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: colors.lightGray + '20',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px'
            }}>
              <Activity size={14} color={colors.mediumGray} />
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                Activities
              </span>
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: colors.charcoal
            }}>
              {activitySummary?.totalActivities || 0}
            </div>
            <div style={{
              fontSize: '11px',
              color: activitySummary?.trend === 'increasing' ? colors.green :
                     activitySummary?.trend === 'decreasing' ? colors.red :
                     colors.mediumGray,
              marginTop: '2px'
            }}>
              {activitySummary?.trend === 'increasing' ? '↑' : 
               activitySummary?.trend === 'decreasing' ? '↓' : '→'} Last 30 days
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: colors.softGreen,
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px'
            }}>
              <DollarSign size={14} color={colors.evergreen} />
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.evergreen,
                textTransform: 'uppercase'
              }}>
                Deal Value
              </span>
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: colors.evergreen
            }}>
              ${(contact.data.totalDealValue || 0).toLocaleString()}
            </div>
            <div style={{
              fontSize: '11px',
              color: colors.evergreen,
              marginTop: '2px'
            }}>
              {contact.data.dealCount || 0} deals
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: colors.lightGray + '20',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px'
            }}>
              <Calendar size={14} color={colors.mediumGray} />
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                Created
              </span>
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: colors.charcoal
            }}>
              {new Date(contact.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: colors.lightGray + '20',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px'
            }}>
              <Clock size={14} color={colors.mediumGray} />
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                Last Activity
              </span>
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: colors.charcoal
            }}>
              {activitySummary?.lastActivity 
                ? new Date(activitySummary.lastActivity).toLocaleDateString()
                : 'Never'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Description */}
      {contact.data.description && (
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: `1px solid ${colors.lightGray}40`
        }}>
          <p style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: colors.charcoal,
            margin: 0
          }}>
            {contact.data.description}
          </p>
        </div>
      )}
      
      {/* Tags */}
      {contact.data.tags && contact.data.tags.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          {contact.data.tags.map((tag: string, idx: number) => (
            <span
              key={idx}
              style={{
                padding: '4px 10px',
                backgroundColor: colors.evergreen + '15',
                color: colors.evergreen,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}