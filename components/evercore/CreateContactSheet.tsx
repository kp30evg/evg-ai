'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Phone, Building2, Briefcase, Tag } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface CreateContactSheetProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateContactSheet({ isOpen, onClose, onSuccess }: CreateContactSheetProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    companyName: '',
    tags: [] as string[],
  })
  
  const [currentTag, setCurrentTag] = useState('')
  
  const createContactMutation = trpc.unified.createContact.useMutation({
    onSuccess: () => {
      onSuccess?.()
      onClose()
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        companyName: '',
        tags: [],
      })
    },
    onError: (error) => {
      console.error('Failed to create contact:', error)
      alert('Failed to create contact. Please try again.')
    }
  })
  
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    red: '#EF4444'
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName || !formData.email) {
      alert('Please fill in required fields')
      return
    }
    
    createContactMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      jobTitle: formData.jobTitle || undefined,
      companyId: undefined, // TODO: Link to company
    })
  }
  
  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag] })
      setCurrentTag('')
    }
  }
  
  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
            }}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: '480px',
              backgroundColor: colors.white,
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.1)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: `1px solid ${colors.lightGray}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: colors.charcoal,
                margin: 0,
              }}>
                New Contact
              </h2>
              <button
                onClick={onClose}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: colors.mediumGray,
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              {/* Name Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '8px',
                  }}>
                    First Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: colors.mediumGray,
                    }} />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 40px',
                        border: `1px solid ${colors.lightGray}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: colors.charcoal,
                        backgroundColor: colors.white,
                        outline: 'none',
                        transition: 'all 200ms ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.evergreen
                        e.target.style.boxShadow = `0 0 0 3px ${colors.evergreen}15`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.lightGray
                        e.target.style.boxShadow = 'none'
                      }}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '8px',
                  }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: colors.charcoal,
                      backgroundColor: colors.white,
                      outline: 'none',
                      transition: 'all 200ms ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.evergreen
                      e.target.style.boxShadow = `0 0 0 3px ${colors.evergreen}15`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.lightGray
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.mediumGray,
                  }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: colors.charcoal,
                      backgroundColor: colors.white,
                      outline: 'none',
                      transition: 'all 200ms ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.evergreen
                      e.target.style.boxShadow = `0 0 0 3px ${colors.evergreen}15`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.lightGray
                      e.target.style.boxShadow = 'none'
                    }}
                    required
                  />
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.mediumGray,
                  }} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: colors.charcoal,
                      backgroundColor: colors.white,
                      outline: 'none',
                      transition: 'all 200ms ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.evergreen
                      e.target.style.boxShadow = `0 0 0 3px ${colors.evergreen}15`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.lightGray
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              
              {/* Job Title */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Job Title
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.mediumGray,
                  }} />
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: colors.charcoal,
                      backgroundColor: colors.white,
                      outline: 'none',
                      transition: 'all 200ms ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.evergreen
                      e.target.style.boxShadow = `0 0 0 3px ${colors.evergreen}15`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.lightGray
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              
              {/* Company */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Company
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.mediumGray,
                  }} />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Type to search or create new"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: colors.charcoal,
                      backgroundColor: colors.white,
                      outline: 'none',
                      transition: 'all 200ms ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.evergreen
                      e.target.style.boxShadow = `0 0 0 3px ${colors.evergreen}15`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.lightGray
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              
              {/* Tags */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Tags
                </label>
                <div style={{ position: 'relative' }}>
                  <Tag size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '12px',
                    color: colors.mediumGray,
                  }} />
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Add tags..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: colors.charcoal,
                      backgroundColor: colors.white,
                      outline: 'none',
                      transition: 'all 200ms ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.evergreen
                      e.target.style.boxShadow = `0 0 0 3px ${colors.evergreen}15`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.lightGray
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                {formData.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: '8px',
                  }}>
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: colors.softGreen,
                          color: colors.evergreen,
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            color: colors.evergreen,
                          }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </form>
            
            {/* Footer */}
            <div style={{
              padding: '24px',
              borderTop: `1px solid ${colors.lightGray}`,
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                onClick={handleSubmit}
                disabled={createContactMutation.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: createContactMutation.isPending ? colors.mediumGray : colors.evergreen,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.white,
                  cursor: createContactMutation.isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                {createContactMutation.isPending ? 'Creating...' : 'Create Contact'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}