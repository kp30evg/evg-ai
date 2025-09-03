'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ActivityTimeline from '@/components/evercore/ActivityTimeline'
import { trpc } from '@/lib/trpc/client'
import { 
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Download,
  Upload,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  HeadphonesIcon,
  Target,
  Activity,
  Edit,
  Plus,
  ChevronRight
} from 'lucide-react'

interface ContactTabsProps {
  activeTab: string
  contact: any
  relatedEntities: any[]
  contactId: string
}

export default function ContactTabs({ 
  activeTab, 
  contact, 
  relatedEntities, 
  contactId 
}: ContactTabsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
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
  
  // Filter related entities by type
  const opportunities = relatedEntities.filter(e => e.type === 'deal')
  const cases = relatedEntities.filter(e => e.type === 'ticket' || e.type === 'support_ticket')
  const files = relatedEntities.filter(e => e.type === 'document' || e.type === 'file')
  const history = relatedEntities.filter(e => e.type === 'audit' || e.type === 'change_log')
  
  const renderAboutTab = () => (
    <div style={{
      display: 'grid',
      gap: '24px'
    }}>
      {/* Basic Information */}
      <div>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: colors.charcoal,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          Basic Information
          <button
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.lightGray}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: colors.mediumGray,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Edit size={14} />
            Edit
          </button>
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          padding: '20px',
          backgroundColor: colors.lightGray + '20',
          borderRadius: '8px'
        }}>
          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '500',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              marginBottom: '4px',
              display: 'block'
            }}>
              Full Name
            </label>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal
            }}>
              {contact.data.firstName} {contact.data.lastName}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '500',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              marginBottom: '4px',
              display: 'block'
            }}>
              Email
            </label>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: colors.evergreen
            }}>
              {contact.data.email || 'Not provided'}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '500',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              marginBottom: '4px',
              display: 'block'
            }}>
              Phone
            </label>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal
            }}>
              {contact.data.phone || 'Not provided'}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '500',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              marginBottom: '4px',
              display: 'block'
            }}>
              Job Title
            </label>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal
            }}>
              {contact.data.jobTitle || 'Not provided'}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '500',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              marginBottom: '4px',
              display: 'block'
            }}>
              Company
            </label>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: colors.evergreen,
              cursor: contact.data.companyId ? 'pointer' : 'default'
            }}>
              {contact.data.company || 'Not provided'}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '500',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              marginBottom: '4px',
              display: 'block'
            }}>
              Department
            </label>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal
            }}>
              {contact.data.department || 'Not provided'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Address Information */}
      <div>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: colors.charcoal,
          marginBottom: '16px'
        }}>
          Address Information
        </h3>
        
        <div style={{
          padding: '20px',
          backgroundColor: colors.lightGray + '20',
          borderRadius: '8px'
        }}>
          {contact.data.address || contact.data.city ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px'
            }}>
              <div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: colors.mediumGray,
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  display: 'block'
                }}>
                  Street Address
                </label>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal
                }}>
                  {contact.data.address || 'Not provided'}
                </div>
              </div>
              
              <div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: colors.mediumGray,
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  display: 'block'
                }}>
                  City
                </label>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal
                }}>
                  {contact.data.city || 'Not provided'}
                </div>
              </div>
              
              <div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: colors.mediumGray,
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  display: 'block'
                }}>
                  State/Province
                </label>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal
                }}>
                  {contact.data.state || 'Not provided'}
                </div>
              </div>
              
              <div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: colors.mediumGray,
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  display: 'block'
                }}>
                  Country
                </label>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal
                }}>
                  {contact.data.country || 'Not provided'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: colors.mediumGray,
              fontSize: '14px'
            }}>
              No address information available
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Fields */}
      {contact.data.customFields && Object.keys(contact.data.customFields).length > 0 && (
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: colors.charcoal,
            marginBottom: '16px'
          }}>
            Custom Fields
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            padding: '20px',
            backgroundColor: colors.lightGray + '20',
            borderRadius: '8px'
          }}>
            {Object.entries(contact.data.customFields).map(([key, field]: [string, any]) => (
              <div key={key}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: colors.mediumGray,
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  display: 'block'
                }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal
                }}>
                  {field.value || 'Not set'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
  
  const renderActivityTab = () => (
    <div>
      <div style={{
        marginBottom: '20px'
      }}>
        <input
          type="text"
          placeholder="Search activities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px',
            border: `1px solid ${colors.lightGray}`,
            borderRadius: '8px',
            fontSize: '14px',
            color: colors.charcoal,
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = colors.evergreen
          }}
          onBlur={(e) => {
            e.target.style.borderColor = colors.lightGray
          }}
        />
      </div>
      
      <ActivityTimeline
        entityType="contact"
        entityId={contactId}
        entityName={`${contact.data.firstName} ${contact.data.lastName}`}
        height="600px"
        showFilters={true}
        showInsights={false}
      />
    </div>
  )
  
  const renderOpportunitiesTab = () => (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: colors.charcoal,
          margin: 0
        }}>
          Related Opportunities ({opportunities.length})
        </h3>
        
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: colors.evergreen,
            color: colors.white,
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          New Opportunity
        </button>
      </div>
      
      {opportunities.length > 0 ? (
        <div style={{
          display: 'grid',
          gap: '12px'
        }}>
          {opportunities.map((opp) => (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '16px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}40`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Target size={18} color={colors.evergreen} />
                  <h4 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: colors.charcoal,
                    margin: 0
                  }}>
                    {opp.data.name}
                  </h4>
                </div>
                
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: colors.evergreen + '15',
                  color: colors.evergreen,
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  ${(opp.data.value || 0).toLocaleString()}
                </span>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                fontSize: '13px'
              }}>
                <div>
                  <span style={{ color: colors.mediumGray }}>Stage: </span>
                  <span style={{ color: colors.charcoal, fontWeight: '500' }}>
                    {opp.data.stage || 'Prospecting'}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.mediumGray }}>Close Date: </span>
                  <span style={{ color: colors.charcoal, fontWeight: '500' }}>
                    {opp.data.closeDate 
                      ? new Date(opp.data.closeDate).toLocaleDateString()
                      : 'Not set'}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.mediumGray }}>Probability: </span>
                  <span style={{ color: colors.charcoal, fontWeight: '500' }}>
                    {opp.data.probability || 20}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: colors.lightGray + '20',
          borderRadius: '8px'
        }}>
          <Target size={48} color={colors.mediumGray} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{
            fontSize: '16px',
            fontWeight: '500',
            color: colors.mediumGray,
            marginBottom: '8px'
          }}>
            No opportunities yet
          </p>
          <p style={{
            fontSize: '14px',
            color: colors.mediumGray
          }}>
            Create an opportunity to track potential deals
          </p>
        </div>
      )}
    </div>
  )
  
  const renderCasesTab = () => (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: colors.charcoal,
          margin: 0
        }}>
          Support Cases ({cases.length})
        </h3>
      </div>
      
      {cases.length > 0 ? (
        <div style={{
          display: 'grid',
          gap: '12px'
        }}>
          {cases.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                padding: '16px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}40`,
                borderRadius: '8px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: colors.charcoal,
                  margin: 0
                }}>
                  {ticket.data.subject || `Case #${ticket.id.slice(0, 8)}`}
                </h4>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: ticket.data.status === 'open' ? colors.red + '15' :
                                 ticket.data.status === 'pending' ? colors.orange + '15' :
                                 colors.green + '15',
                  color: ticket.data.status === 'open' ? colors.red :
                        ticket.data.status === 'pending' ? colors.orange :
                        colors.green,
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {ticket.data.status || 'Open'}
                </span>
              </div>
              <p style={{
                fontSize: '13px',
                color: colors.mediumGray,
                marginBottom: '8px'
              }}>
                {ticket.data.description || 'No description'}
              </p>
              <div style={{
                fontSize: '12px',
                color: colors.mediumGray
              }}>
                Created {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: colors.lightGray + '20',
          borderRadius: '8px'
        }}>
          <HeadphonesIcon size={48} color={colors.mediumGray} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{
            fontSize: '16px',
            fontWeight: '500',
            color: colors.mediumGray
          }}>
            No support cases
          </p>
        </div>
      )}
    </div>
  )
  
  const renderFilesTab = () => (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: colors.charcoal,
          margin: 0
        }}>
          Files & Documents ({files.length})
        </h3>
        
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: colors.white,
            border: `1px solid ${colors.evergreen}`,
            borderRadius: '6px',
            color: colors.evergreen,
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Upload size={16} />
          Upload File
        </button>
      </div>
      
      {files.length > 0 ? (
        <div style={{
          display: 'grid',
          gap: '8px'
        }}>
          {files.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}40`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.lightGray + '20'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FileText size={20} color={colors.mediumGray} />
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.charcoal
                  }}>
                    {file.data.name || 'Untitled Document'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: colors.mediumGray
                  }}>
                    {file.data.size || 'Unknown size'} • {new Date(file.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  style={{
                    padding: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.mediumGray,
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={16} />
                </button>
                <button
                  style={{
                    padding: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.mediumGray,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: colors.lightGray + '20',
          borderRadius: '8px'
        }}>
          <FileText size={48} color={colors.mediumGray} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{
            fontSize: '16px',
            fontWeight: '500',
            color: colors.mediumGray
          }}>
            No files attached
          </p>
        </div>
      )}
    </div>
  )
  
  const renderHistoryTab = () => (
    <div>
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: colors.charcoal,
        marginBottom: '20px'
      }}>
        Change History
      </h3>
      
      <div style={{
        position: 'relative',
        paddingLeft: '24px'
      }}>
        <div style={{
          position: 'absolute',
          left: '7px',
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: colors.lightGray
        }} />
        
        {/* Sample history items */}
        {[
          { action: 'Contact created', user: 'System', date: contact.createdAt },
          { action: 'Email updated', user: 'John Doe', date: new Date(Date.now() - 86400000) },
          { action: 'Phone number added', user: 'Jane Smith', date: new Date(Date.now() - 172800000) }
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              position: 'relative',
              marginBottom: '20px'
            }}
          >
            <div style={{
              position: 'absolute',
              left: '-20px',
              top: '4px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: colors.white,
              border: `2px solid ${colors.evergreen}`
            }} />
            
            <div style={{
              padding: '12px',
              backgroundColor: colors.lightGray + '20',
              borderRadius: '6px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: colors.charcoal,
                marginBottom: '4px'
              }}>
                {item.action}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.mediumGray
              }}>
                by {item.user} • {new Date(item.date).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'opportunities' && renderOpportunitiesTab()}
        {activeTab === 'cases' && renderCasesTab()}
        {activeTab === 'files' && renderFilesTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </motion.div>
    </AnimatePresence>
  )
}