'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Phone, Building2, Briefcase, Tag, AlertCircle, Check } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { useCRM } from '@/lib/contexts/crm-context'
import { validateEmail, formatPhoneNumber } from '@/lib/utils/validation'

interface ContactCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (contact: any) => void
}

export default function ContactCreateModal({ isOpen, onClose, onSuccess }: ContactCreateModalProps) {
  const { createContact, contacts } = useCRM()
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'Cold' as 'Hot' | 'Warm' | 'Cold',
    source: 'Direct',
    tags: [] as string[],
    customFields: {} as Record<string, any>
  })
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [tagInput, setTagInput] = useState('')
  
  // Auto-save to localStorage
  useEffect(() => {
    if (isOpen && formData.name) {
      localStorage.setItem('contact_draft', JSON.stringify(formData))
    }
  }, [formData, isOpen])
  
  // Load draft on mount
  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem('contact_draft')
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          setFormData(parsed)
        } catch (e) {
          console.error('Failed to load draft:', e)
        }
      }
    }
  }, [isOpen])
  
  // Validate field
  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          newErrors.name = 'Name is required (min 2 characters)'
        } else {
          delete newErrors.name
        }
        break
        
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required'
        } else if (!validateEmail(value)) {
          newErrors.email = 'Please enter a valid email'
        } else {
          // Check for duplicates
          const duplicate = contacts.find(c => c.email === value)
          if (duplicate) {
            newErrors.email = 'A contact with this email already exists'
          } else {
            delete newErrors.email
          }
        }
        break
        
      case 'phone':
        if (value && value.length < 10) {
          newErrors.phone = 'Phone number seems too short'
        } else {
          delete newErrors.phone
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle field change
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (touched[field]) {
      validateField(field, value)
    }
  }
  
  // Handle field blur
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, formData[field as keyof typeof formData])
  }
  
  // Format phone on blur
  const handlePhoneBlur = () => {
    if (formData.phone) {
      const formatted = formatPhoneNumber(formData.phone)
      setFormData(prev => ({ ...prev, phone: formatted }))
    }
    handleBlur('phone')
  }
  
  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }
  
  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }
  
  // Validate form
  const validateForm = () => {
    const requiredFields = ['name', 'email']
    let isValid = true
    
    requiredFields.forEach(field => {
      if (!validateField(field, formData[field as keyof typeof formData])) {
        isValid = false
      }
    })
    
    return isValid
  }
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      company: true,
      title: true
    })
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const newContact = await createContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        title: formData.title,
        status: formData.status,
        source: formData.source,
        tags: formData.tags,
        customFields: formData.customFields,
        lastContact: new Date(),
        dealValue: 0
      })
      
      // Clear draft
      localStorage.removeItem('contact_draft')
      
      // Show success
      setShowSuccess(true)
      
      // Reset form
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          title: '',
          status: 'Cold',
          source: 'Direct',
          tags: [],
          customFields: {}
        })
        setErrors({})
        setTouched({})
        setShowSuccess(false)
        
        if (onSuccess) onSuccess(newContact)
        onClose()
      }, 1500)
      
    } catch (error: any) {
      setErrors({ submit: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Reset on close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: theme.shadows['2xl'],
              zIndex: 1001,
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: theme.spacing.xl,
              borderBottom: `1px solid ${theme.colors.lightGray}`,
            }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text,
                margin: 0,
              }}>
                Create New Contact
              </h2>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: theme.borderRadius.base,
                  color: theme.colors.textSecondary,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    margin: theme.spacing.lg,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.success + '20',
                    border: `1px solid ${theme.colors.success}`,
                    borderRadius: theme.borderRadius.base,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  <Check size={20} color={theme.colors.success} />
                  <span style={{ color: theme.colors.text }}>
                    Contact created successfully!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: theme.spacing.xl }}>
              {/* Basic Information */}
              <div style={{ marginBottom: theme.spacing.xl }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.lg,
                }}>
                  Basic Information
                </h3>
                
                <div style={{ display: 'grid', gap: theme.spacing.lg }}>
                  {/* Name Field */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                    }}>
                      <User size={16} />
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      placeholder="Enter contact name"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: theme.spacing.md,
                        border: `1px solid ${errors.name && touched.name ? theme.colors.error : theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        fontSize: theme.typography.fontSize.sm,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        outline: 'none',
                      }}
                    />
                    {errors.name && touched.name && (
                      <div style={{
                        marginTop: theme.spacing.xs,
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.error,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                      }}>
                        <AlertCircle size={12} />
                        {errors.name}
                      </div>
                    )}
                  </div>
                  
                  {/* Email Field */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                    }}>
                      <Mail size={16} />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="contact@example.com"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: theme.spacing.md,
                        border: `1px solid ${errors.email && touched.email ? theme.colors.error : theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        fontSize: theme.typography.fontSize.sm,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        outline: 'none',
                      }}
                    />
                    {errors.email && touched.email && (
                      <div style={{
                        marginTop: theme.spacing.xs,
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.error,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                      }}>
                        <AlertCircle size={12} />
                        {errors.email}
                      </div>
                    )}
                  </div>
                  
                  {/* Phone Field */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                    }}>
                      <Phone size={16} />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={handlePhoneBlur}
                      placeholder="+1 (555) 123-4567"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: theme.spacing.md,
                        border: `1px solid ${errors.phone && touched.phone ? theme.colors.error : theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        fontSize: theme.typography.fontSize.sm,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        outline: 'none',
                      }}
                    />
                    {errors.phone && touched.phone && (
                      <div style={{
                        marginTop: theme.spacing.xs,
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.error,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                      }}>
                        <AlertCircle size={12} />
                        {errors.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Professional Information */}
              <div style={{ marginBottom: theme.spacing.xl }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.lg,
                }}>
                  Professional Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                  {/* Company Field */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                    }}>
                      <Building2 size={16} />
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      onBlur={() => handleBlur('company')}
                      placeholder="Company name"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: theme.spacing.md,
                        border: `1px solid ${theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        fontSize: theme.typography.fontSize.sm,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        outline: 'none',
                      }}
                    />
                  </div>
                  
                  {/* Title Field */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                    }}>
                      <Briefcase size={16} />
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      onBlur={() => handleBlur('title')}
                      placeholder="Job title"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: theme.spacing.md,
                        border: `1px solid ${theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        fontSize: theme.typography.fontSize.sm,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Status and Source */}
              <div style={{ marginBottom: theme.spacing.xl }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                  {/* Status */}
                  <div>
                    <label style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                      display: 'block',
                    }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: theme.spacing.md,
                        border: `1px solid ${theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        fontSize: theme.typography.fontSize.sm,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </div>
                  
                  {/* Source */}
                  <div>
                    <label style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                      display: 'block',
                    }}>
                      Source
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => handleChange('source', e.target.value)}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: theme.spacing.md,
                        border: `1px solid ${theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        fontSize: theme.typography.fontSize.sm,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Direct">Direct</option>
                      <option value="Referral">Referral</option>
                      <option value="Website">Website</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Cold Outreach">Cold Outreach</option>
                      <option value="Inbound">Inbound</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Tags */}
              <div style={{ marginBottom: theme.spacing.xl }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm,
                }}>
                  <Tag size={16} />
                  Tags
                </label>
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tags..."
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.sm,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={isSubmitting || !tagInput.trim()}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                      backgroundColor: theme.colors.evergreen,
                      color: theme.colors.white,
                      border: 'none',
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      cursor: isSubmitting || !tagInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting || !tagInput.trim() ? 0.5 : 1,
                    }}
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: theme.spacing.sm,
                  }}>
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          backgroundColor: theme.colors.softGreen,
                          color: theme.colors.evergreen,
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          borderRadius: theme.borderRadius.full,
                          fontSize: theme.typography.fontSize.xs,
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.xs,
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          disabled={isSubmitting}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: theme.colors.evergreen,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Error Message */}
              {errors.submit && (
                <div style={{
                  marginBottom: theme.spacing.lg,
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.error + '20',
                  border: `1px solid ${theme.colors.error}`,
                  borderRadius: theme.borderRadius.base,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}>
                  <AlertCircle size={20} color={theme.colors.error} />
                  <span style={{ color: theme.colors.text }}>
                    {errors.submit}
                  </span>
                </div>
              )}
              
              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: theme.spacing.md,
                justifyContent: 'flex-end',
              }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    backgroundColor: 'transparent',
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    backgroundColor: theme.colors.evergreen,
                    color: theme.colors.white,
                    border: 'none',
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: isSubmitting || Object.keys(errors).length > 0 ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || Object.keys(errors).length > 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: '16px',
                          height: '16px',
                          border: `2px solid ${theme.colors.white}`,
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                        }}
                      />
                      Creating...
                    </>
                  ) : (
                    'Create Contact'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}