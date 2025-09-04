'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, DollarSign, Building2, User, Calendar, TrendingUp, Tag } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface CreateDealSheetProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialStage?: string
}

export default function CreateDealSheet({ isOpen, onClose, onSuccess, initialStage = 'prospecting' }: CreateDealSheetProps) {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    stage: initialStage,
    companyName: '',
    contactName: '',
    closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    probability: 10,
    nextStep: '',
    tags: [] as string[],
  })
  
  const [currentTag, setCurrentTag] = useState('')
  
  const executeCommand = trpc.unified.executeCommand.useMutation({
    onSuccess: () => {
      onSuccess?.()
      onClose()
      // Reset form
      setFormData({
        name: '',
        value: '',
        stage: initialStage,
        companyName: '',
        contactName: '',
        closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        probability: 10,
        nextStep: '',
        tags: [],
      })
    },
    onError: (error) => {
      console.error('Failed to create deal:', error)
      alert('Failed to create deal. Please try again.')
    }
  })
  
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    blue: '#0EA5E9',
    purple: '#8B5CF6',
    orange: '#F97316',
    gold: '#FFD600',
    green: '#10B981'
  }
  
  const stages = [
    { id: 'prospecting', name: 'Prospecting', probability: 10, color: colors.blue },
    { id: 'qualification', name: 'Qualification', probability: 20, color: colors.purple },
    { id: 'proposal', name: 'Proposal', probability: 40, color: colors.orange },
    { id: 'negotiation', name: 'Negotiation', probability: 60, color: colors.evergreen },
    { id: 'closing', name: 'Closing', probability: 80, color: colors.gold }
  ]
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name || !formData.value) {
      alert('Please fill in required fields')
      return
    }
    
    try {
      // Create deal via natural language command
      let command = `create deal "${formData.name}" for $${formData.value} in ${formData.stage} stage`
      
      if (formData.companyName) {
        command += ` with company "${formData.companyName}"`
      }
      
      if (formData.contactName) {
        command += ` for contact "${formData.contactName}"`
      }
      
      if (formData.closeDate) {
        command += ` closing on ${formData.closeDate}`
      }
      
      if (formData.nextStep) {
        command += ` with next step "${formData.nextStep}"`
      }
      
      await executeCommand.mutateAsync({ command })
    } catch (error) {
      console.error('Error creating deal:', error)
    }
  }
  
  const handleStageChange = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    if (stage) {
      setFormData({ 
        ...formData, 
        stage: stageId,
        probability: stage.probability 
      })
    }
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
                New Deal
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
              {/* Deal Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Deal Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <Target size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.mediumGray,
                  }} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Enterprise Plan - Acme Corp"
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
              
              {/* Deal Value */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Deal Value *
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.mediumGray,
                  }} />
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="50000"
                    min="0"
                    step="100"
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
              
              {/* Pipeline Stage */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Pipeline Stage
                </label>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {stages.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => handleStageChange(stage.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: formData.stage === stage.id ? stage.color : colors.white,
                        color: formData.stage === stage.id ? colors.white : colors.charcoal,
                        border: `1px solid ${formData.stage === stage.id ? stage.color : colors.lightGray}`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (formData.stage !== stage.id) {
                          e.currentTarget.style.backgroundColor = `${stage.color}10`
                          e.currentTarget.style.borderColor = stage.color
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.stage !== stage.id) {
                          e.currentTarget.style.backgroundColor = colors.white
                          e.currentTarget.style.borderColor = colors.lightGray
                        }
                      }}
                    >
                      {stage.name}
                    </button>
                  ))}
                </div>
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: colors.softGreen,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: colors.evergreen,
                  fontWeight: '500'
                }}>
                  Probability: {formData.probability}%
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
              
              {/* Primary Contact */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Primary Contact
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
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Type to search contacts"
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
              
              {/* Expected Close Date */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Expected Close Date
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.mediumGray,
                  }} />
                  <input
                    type="date"
                    value={formData.closeDate}
                    onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
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
              
              {/* Next Step */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                }}>
                  Next Step
                </label>
                <div style={{ position: 'relative' }}>
                  <TrendingUp size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '12px',
                    color: colors.mediumGray,
                  }} />
                  <textarea
                    value={formData.nextStep}
                    onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
                    placeholder="What's the next action to move this deal forward?"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: colors.charcoal,
                      backgroundColor: colors.white,
                      outline: 'none',
                      resize: 'vertical',
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
                disabled={executeCommand.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: executeCommand.isPending ? colors.mediumGray : colors.evergreen,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.white,
                  cursor: executeCommand.isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                {executeCommand.isPending ? 'Creating...' : 'Create Deal'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}