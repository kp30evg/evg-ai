'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  ChevronDown,
  Search,
  Check,
  AlertCircle
} from 'lucide-react'
import { useCRM } from '@/lib/contexts/crm-context'
import { validateEmail, formatPhoneNumber } from '@/lib/utils/validation'
import { useUser, useOrganization, useOrganizationList } from '@clerk/nextjs'
import { trpc } from '@/lib/trpc/client'

interface ContactCreateSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (contact: any) => void
  onCreateAnother?: () => void
}

export default function ContactCreateSidebar({ 
  isOpen, 
  onClose, 
  onSuccess,
  onCreateAnother 
}: ContactCreateSidebarProps) {
  const { createContact, contacts, companies } = useCRM()
  const { user } = useUser()
  const { organization } = useOrganization()
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    companyId: '', // Store the selected company ID
    jobTitle: '',
    contactOwner: user?.fullName || user?.firstName || 'Me',
    leadStatus: 'New' as 'New' | 'Open' | 'Unqualified' | 'Attempted to Contact' | 'Connected' | 'Bad Timing',
    lifecycleStage: 'Lead' as 'Lead' | 'MQL' | 'SQL' | 'Opportunity' | 'Customer' | 'Evangelist'
  })
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const [ownerSearch, setOwnerSearch] = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const sidebarRef = useRef<HTMLDivElement>(null)
  
  // Fetch organization members from Clerk
  const { data: organizationMembers } = trpc.organization.getMembers.useQuery(undefined, {
    enabled: !!organization
  })
  
  // Transform organization members to team members format
  const teamMembers = React.useMemo(() => {
    if (!organizationMembers || organizationMembers.length === 0) {
      // Fallback to current user only
      return [{
        id: user?.id || '1',
        name: user?.fullName || user?.firstName || 'Me',
        email: user?.primaryEmailAddress?.emailAddress || '',
        avatar: user?.imageUrl || null,
        isCurrentUser: true
      }]
    }
    
    // Use actual organization members
    return organizationMembers.map((member: any) => ({
      id: member.id,
      name: member.name || member.email || 'Team Member',
      email: member.email,
      avatar: member.imageUrl || null,
      isCurrentUser: member.id === user?.id,
      role: member.role
    }))
  }, [organizationMembers, user])
  
  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
    member.email?.toLowerCase().includes(ownerSearch.toLowerCase())
  )
  
  // Filter companies based on search
  const filteredCompanies = React.useMemo(() => {
    if (!companySearch) return companies.slice(0, 10) // Show first 10 when no search
    
    return companies.filter(company =>
      company.name.toLowerCase().includes(companySearch.toLowerCase()) ||
      company.domain?.toLowerCase().includes(companySearch.toLowerCase())
    ).slice(0, 20) // Limit results for performance
  }, [companies, companySearch])
  
  // Validate field
  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required'
        } else if (!validateEmail(value)) {
          newErrors.email = 'Please enter a valid email'
        } else {
          delete newErrors.email
        }
        break
        
      case 'firstName':
        if (!value || value.trim().length < 1) {
          newErrors.firstName = 'First name is required'
        } else {
          delete newErrors.firstName
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
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent, createAnother: boolean = false) => {
    e.preventDefault()
    
    setTouched({
      firstName: true,
      email: true
    })
    
    const isValid = validateField('firstName', formData.firstName) && 
                   validateField('email', formData.email)
    
    if (!isValid) return
    
    setIsSubmitting(true)
    
    try {
      const newContact = await createContact({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        companyId: formData.companyId, // Link to existing company
        title: formData.jobTitle,
        owner: formData.contactOwner,
        leadStatus: formData.leadStatus,
        lifecycleStage: formData.lifecycleStage,
        status: 'Cold',
        lastContact: new Date(),
        dealValue: 0
      })
      
      if (createAnother) {
        // Reset form but keep sidebar open
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          companyId: '',
          jobTitle: '',
          contactOwner: formData.contactOwner, // Keep the same owner
          leadStatus: 'New',
          lifecycleStage: 'Lead'
        })
        setErrors({})
        setTouched({})
        if (onCreateAnother) onCreateAnother()
      } else {
        if (onSuccess) onSuccess(newContact)
        onClose()
      }
      
    } catch (error: any) {
      setErrors({ submit: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Check if click is outside of dropdown areas
      if (!target.closest('.owner-dropdown') && !target.closest('.owner-dropdown-trigger')) {
        setShowOwnerDropdown(false)
      }
      
      if (!target.closest('.company-dropdown') && !target.closest('.company-dropdown-trigger')) {
        setShowCompanyDropdown(false)
      }
    }
    
    if (showOwnerDropdown || showCompanyDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOwnerDropdown, showCompanyDropdown])
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
          />
          
          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 30,
              mass: 0.8
            }}
            className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Create contact
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <form className="p-6 space-y-6">
                {/* Contact Information Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Contact information
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Email - Primary Field */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          placeholder="email@company.com"
                          className={`
                            w-full px-3 py-2.5 bg-white border rounded-lg text-sm
                            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                            transition-all duration-200
                            ${errors.email && touched.email ? 'border-red-500' : 'border-gray-200'}
                          `}
                          disabled={isSubmitting}
                        />
                        {formData.email && !errors.email && (
                          <Check size={16} className="absolute right-3 top-3 text-emerald-500" />
                        )}
                      </div>
                      {errors.email && touched.email && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.email}
                        </p>
                      )}
                    </div>
                    
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1.5">
                          First name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                          onBlur={() => handleBlur('firstName')}
                          placeholder="First"
                          className={`
                            w-full px-3 py-2.5 bg-white border rounded-lg text-sm
                            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                            transition-all duration-200
                            ${errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-200'}
                          `}
                          disabled={isSubmitting}
                        />
                        {errors.firstName && touched.firstName && (
                          <p className="mt-1 text-xs text-red-600">Required</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-700 mb-1.5">
                          Last name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          placeholder="Last"
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm
                            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                            transition-all duration-200"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    
                    {/* Contact Owner - Custom Dropdown */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">
                        Contact owner
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                          className="owner-dropdown-trigger w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm
                            text-left flex items-center justify-between
                            hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                            transition-all duration-200"
                          disabled={isSubmitting}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-emerald-700">
                                {formData.contactOwner.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-gray-900">{formData.contactOwner}</span>
                          </div>
                          <ChevronDown size={16} className={`text-gray-400 transition-transform ${showOwnerDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Dropdown */}
                        <AnimatePresence>
                          {showOwnerDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="owner-dropdown absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                            >
                              {/* Search */}
                              <div className="p-2 border-b border-gray-100">
                                <div className="relative">
                                  <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                  <input
                                    type="text"
                                    value={ownerSearch}
                                    onChange={(e) => setOwnerSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm
                                      placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              
                              {/* Team Members List */}
                              <div className="max-h-48 overflow-y-auto">
                                {filteredTeamMembers.map(member => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => {
                                      handleChange('contactOwner', member.name)
                                      setShowOwnerDropdown(false)
                                      setOwnerSearch('')
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      {member.avatar ? (
                                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
                                      ) : (
                                        <span className="text-xs font-medium text-emerald-700">
                                          {member.name.charAt(0).toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900">{member.name}</span>
                                        {member.isCurrentUser && (
                                          <span className="text-xs text-gray-500">(You)</span>
                                        )}
                                      </div>
                                      {member.email && (
                                        <div className="text-xs text-gray-500">{member.email}</div>
                                      )}
                                    </div>
                                    {formData.contactOwner === member.name && (
                                      <Check size={16} className="text-emerald-500" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    {/* Job Title */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">
                        Job title
                      </label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => handleChange('jobTitle', e.target.value)}
                        placeholder="e.g. Sales Manager"
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm
                          placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                          transition-all duration-200"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    {/* Phone */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">
                        Phone number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm
                          placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                          transition-all duration-200"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Lead & Pipeline Status Section */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Lead & pipeline status
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Lifecycle Stage */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">
                        Lifecycle stage
                      </label>
                      <select
                        value={formData.lifecycleStage}
                        onChange={(e) => handleChange('lifecycleStage', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                          transition-all duration-200 appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem'
                        }}
                        disabled={isSubmitting}
                      >
                        <option value="Lead">Lead</option>
                        <option value="MQL">Marketing Qualified Lead</option>
                        <option value="SQL">Sales Qualified Lead</option>
                        <option value="Opportunity">Opportunity</option>
                        <option value="Customer">Customer</option>
                        <option value="Evangelist">Evangelist</option>
                      </select>
                    </div>
                    
                    {/* Lead Status */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">
                        Lead status
                      </label>
                      <select
                        value={formData.leadStatus}
                        onChange={(e) => handleChange('leadStatus', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                          transition-all duration-200 appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem'
                        }}
                        disabled={isSubmitting}
                      >
                        <option value="New">New</option>
                        <option value="Open">Open</option>
                        <option value="Unqualified">Unqualified</option>
                        <option value="Attempted to Contact">Attempted to Contact</option>
                        <option value="Connected">Connected</option>
                        <option value="Bad Timing">Bad Timing</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Company Information Section */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Company information
                  </h3>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">
                      Company name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => {
                          handleChange('company', e.target.value)
                          handleChange('companyId', '') // Clear ID when typing
                          setCompanySearch(e.target.value)
                          setShowCompanyDropdown(true)
                        }}
                        onFocus={() => {
                          setShowCompanyDropdown(true)
                          setCompanySearch(formData.company)
                        }}
                        placeholder="Search or enter company name"
                        className="company-dropdown-trigger w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm
                          placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                          transition-all duration-200"
                        disabled={isSubmitting}
                      />
                      
                      {/* Company Dropdown */}
                      <AnimatePresence>
                        {showCompanyDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="company-dropdown absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
                          >
                            {filteredCompanies.length > 0 ? (
                              <>
                                <div className="p-2 border-b border-gray-100">
                                  <p className="text-xs text-gray-500 px-2">
                                    Select existing company or create new
                                  </p>
                                </div>
                                {filteredCompanies.map(company => (
                                  <button
                                    key={company.id}
                                    type="button"
                                    onClick={() => {
                                      handleChange('company', company.name)
                                      handleChange('companyId', company.id)
                                      setShowCompanyDropdown(false)
                                      setCompanySearch('')
                                    }}
                                    className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                  >
                                    <Building2 size={16} className="text-gray-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {company.name}
                                      </div>
                                      {company.domain && (
                                        <div className="text-xs text-gray-500 truncate">
                                          {company.domain}
                                        </div>
                                      )}
                                    </div>
                                    {formData.companyId === company.id && (
                                      <Check size={16} className="text-emerald-500 flex-shrink-0" />
                                    )}
                                  </button>
                                ))}
                              </>
                            ) : companySearch ? (
                              <div className="p-4 text-center">
                                <p className="text-sm text-gray-500 mb-2">
                                  No companies found matching "{companySearch}"
                                </p>
                                <p className="text-xs text-gray-400">
                                  Press Enter to create a new company
                                </p>
                              </div>
                            ) : (
                              <div className="p-4 text-center">
                                <p className="text-sm text-gray-500">
                                  Start typing to search companies
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                
                {/* Error Message */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{errors.submit}</p>
                  </div>
                )}
              </form>
            </div>
            
            {/* Sticky Footer with Actions */}
            <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as any, true)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-sm font-medium text-emerald-700 bg-white border border-emerald-700 rounded-lg
                    hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Create and add another
                </button>
                
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as any, false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg
                    hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                    flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Creating...
                    </>
                  ) : (
                    'Create contact'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}