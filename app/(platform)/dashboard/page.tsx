'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser, UserButton, OrganizationSwitcher, useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { 
  Send,
  Paperclip,
  Mic,
  Plus,
  History,
  Settings,
  Menu,
  Search,
  Sparkles,
  Brain,
  Shield,
  Database,
  Activity,
  Check,
  Loader2,
  ChevronRight,
  BarChart3
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import ChatWidget from '@/components/everchat/ChatWidget'

type State = 'welcome' | 'thinking' | 'answer'

export default function DashboardPage() {
  const { user } = useUser()
  const { organization, isLoaded } = useOrganization()
  const router = useRouter()
  
  // tRPC mutation for command execution using unified API
  const executeCommand = trpc.unified.executeCommand.useMutation()
  const sendEmail = trpc.unified.sendEmail.useMutation()
  const [currentState, setCurrentState] = useState<State>('welcome')
  const [inputValue, setInputValue] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [typingStep, setTypingStep] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [showFollowups, setShowFollowups] = useState(false)
  const [followupSuggestions, setFollowupSuggestions] = useState<string[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const [emailDraft, setEmailDraft] = useState<any>(null)
  const [showEmailActions, setShowEmailActions] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const colors = {
    evergreen: '#2F5233',
    white: '#FFFFFF',
    charcoal: '#1A1A1A',
    mediumGray: '#6B7280',
    lightGray: '#F3F4F6',
    softGreen: '#E8F5E8',
    gold: '#FFD600',
    mint: '#D4E6D4'
  }

  const prompts = [
    "Show me my EverCore contacts with high deal potential",
    "Which EverCore deals are at risk this month?",
    "Generate follow-up tasks for my pipeline",
    "What's the health score of my top accounts?"
  ]

  const thinkingSteps = [
    { text: "Analyzing your request", icon: Brain },
    { text: "Applying security filters", icon: Shield },
    { text: "Querying business data", icon: Database },
    { text: "Processing information", icon: Activity },
    { text: "Generating insights", icon: Sparkles }
  ]

  const handleSubmit = async (text?: string) => {
    const commandText = text || inputValue
    if (!commandText.trim()) return
    
    setSelectedPrompt(commandText)
    setInputValue('')
    setCurrentState('thinking')
    resetAnimationStates()
    startThinkingSequence()

    try {
      // Execute command using unified API
      const result = await executeCommand.mutateAsync({ command: commandText })

      // After thinking animation completes, show the answer
      setTimeout(() => {
        setCurrentState('answer')
        
        // Check if this is an email draft response
        if (result.data?.type === 'draft_email') {
          setEmailDraft(result.data.draft)
          setShowEmailActions(true)
        } else {
          setEmailDraft(null)
          setShowEmailActions(false)
        }
        
        startStreamingText(result.message || 'I couldn\'t generate a response.')
        setFollowupSuggestions(result.suggestions || ['Try again', 'Ask a different question'])
      }, 2500)
    } catch (error) {
      console.error('Error executing command:', error)
      setTimeout(() => {
        setCurrentState('answer')
        startStreamingText('I encountered an error processing your request. Please try again.')
        setFollowupSuggestions(['Try again', 'Ask a different question'])
      }, 1000)
    }
  }

  const resetAnimationStates = () => {
    setCompletedSteps([])
    setCurrentStep(0)
    setTypingStep('')
    setStreamedText('')
    setShowFollowups(false)
    setFollowupSuggestions([])
    setEmailDraft(null)
    setShowEmailActions(false)
  }

  const startThinkingSequence = () => {
    let stepIndex = 0
    
    const processStep = () => {
      if (stepIndex >= thinkingSteps.length) return
      
      setCurrentStep(stepIndex)
      
      const stepText = thinkingSteps[stepIndex].text
      let charIndex = 0
      
      const typeInterval = setInterval(() => {
        if (charIndex <= stepText.length) {
          setTypingStep(stepText.slice(0, charIndex))
          charIndex++
        } else {
          clearInterval(typeInterval)
          setTimeout(() => {
            setCompletedSteps(prev => [...prev, stepIndex])
            stepIndex++
            setTypingStep('')
            processStep()
          }, 300)
        }
      }, 20)
    }
    
    setTimeout(processStep, 300)
  }

  const startStreamingText = (text: string) => {
    let index = 0
    const streamInterval = setInterval(() => {
      if (index >= text.length) {
        clearInterval(streamInterval)
        setTimeout(() => setShowFollowups(true), 300)
        return
      }
      setStreamedText(text.slice(0, index + 1))
      index += 2
    }, 8)
  }

  const resetToWelcome = () => {
    setCurrentState('welcome')
    setInputValue('')
    setSelectedPrompt('')
    resetAnimationStates()
  }
  
  const handleEmailAction = async (action: string) => {
    if (action === 'send' && emailDraft) {
      // Send confirmation to process the email
      setCurrentState('thinking')
      resetAnimationStates()
      startThinkingSequence()
      
      try {
        // Use the sendEmail mutation with the email draft data
        const result = await sendEmail.mutateAsync({
          to: emailDraft.to,
          subject: emailDraft.subject,
          body: emailDraft.body,
          bodyHtml: emailDraft.bodyHtml || emailDraft.body
        })
        
        setTimeout(() => {
          setCurrentState('answer')
          setEmailDraft(null)
          setShowEmailActions(false)
          startStreamingText(`✅ Email sent successfully to ${emailDraft.to}!\n\nYour email "${emailDraft.subject}" has been delivered.`)
          setFollowupSuggestions(['Compose another email', 'Check inbox', 'View sent emails'])
          setShowFollowups(true)
        }, 1500)
      } catch (error) {
        console.error('Error sending email:', error)
        setTimeout(() => {
          setCurrentState('answer')
          startStreamingText('❌ Failed to send email.\n\nPlease make sure your Gmail account is connected and try again.')
          setFollowupSuggestions(['Try again', 'Connect Gmail', 'Go to settings'])
          setShowFollowups(true)
        }, 1000)
      }
    } else if (action === 'cancel') {
      setEmailDraft(null)
      setShowEmailActions(false)
      setCurrentState('welcome')
    } else if (action === 'edit') {
      // Put the command back in the input for editing
      setInputValue(`Send email to ${emailDraft?.to || ''} about ${emailDraft?.topic || ''}`)
      setEmailDraft(null)
      setShowEmailActions(false)
      setCurrentState('welcome')
      inputRef.current?.focus()
    }
  }

  const formatText = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, index) => {
      // Skip the action button instructions line if present
      if (line.includes('_Reply with "send"') || line.includes('---')) {
        return null
      }
      
      // Check for checkmarks and buttons (these are handled by actual buttons now)
      if (line.includes('✅') || line.includes('🔘')) {
        return null
      }
      
      // Bold text
      const parts = line.split(/\*\*(.*?)\*\*/g)
      const formatted = parts.map((part, i) => 
        i % 2 === 1 ? (
          <strong key={i} style={{ color: colors.evergreen, fontWeight: 600 }}>
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )
      
      return (
        <div key={index} style={{ marginBottom: line === '' ? '12px' : '4px' }}>
          {formatted}
        </div>
      )
    }).filter(Boolean)
  }

  // Check if onboarding is needed
  useEffect(() => {
    if (isLoaded && organization) {
      // Check onboarding status from database
      const checkOnboardingStatus = async () => {
        try {
          const response = await fetch('/api/onboarding/status')
          const data = await response.json()
          
          if (data.needsOnboarding) {
            router.push('/onboarding')
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error)
          // Fallback: if we can't check status, assume onboarding is needed
          router.push('/onboarding')
        }
      }
      
      checkOnboardingStatus()
    }
  }, [isLoaded, organization, router])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
    }
  }, [inputValue])

  // Get user initials
  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName 
    ? user.firstName.slice(0, 2).toUpperCase()
    : 'U'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F9FA',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Main Content Area */}
      <div style={{
        minHeight: '100vh',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: colors.white,
          borderBottom: '1px solid #E5E7EB',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40 // Lower than sidebar panels
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              letterSpacing: '-0.01em'
            }}>
              <span style={{ color: colors.charcoal }}>evergreen</span>
              <span style={{ color: colors.evergreen }}>OS</span>
            </div>
          </div>
          
          {/* Organization Switcher moved to right side */}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Organization Switcher */}
          <OrganizationSwitcher 
            appearance={{
              elements: {
                rootBox: {
                  display: 'flex',
                  alignItems: 'center'
                },
                organizationSwitcherTrigger: {
                  padding: '10px 16px',
                  backgroundColor: colors.white,
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  '&:hover': {
                    backgroundColor: colors.mint,
                    borderColor: colors.evergreen + '30'
                  }
                },
                organizationPreview: {
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal
                },
                organizationSwitcherTriggerIcon: {
                  color: colors.mediumGray
                }
              },
              baseTheme: undefined
            }}
            createOrganizationMode="modal"
            organizationProfileMode="modal"
          />
          
          <button 
            onClick={() => window.location.href = '/settings/organization'}
            style={{
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background-color 200ms ease'
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.mint}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Settings size={20} color={colors.mediumGray} />
          </button>
          
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        width: '100%'
      }}>
          <AnimatePresence mode="wait">
            {/* Welcome State */}
            {currentState === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 24px',
                  maxWidth: '680px',
                  margin: '0 auto',
                  width: '100%'
                }}
              >
                {/* Hero Text */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '64px'
                }}>
                  {/* Main Heading */}
                  <h1 style={{
                    fontSize: '56px',
                    fontWeight: '600',
                    marginBottom: '32px',
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1
                  }}>
                    <span style={{ color: colors.charcoal }}>How can I help you today</span>
                    {user?.firstName && (
                      <>
                        <span style={{ color: colors.charcoal }}>, </span>
                        <span style={{ color: colors.evergreen }}>{user.firstName}</span>
                      </>
                    )}
                    <span style={{ color: colors.charcoal }}>?</span>
                  </h1>
                  
                  {/* Tagline with slogan styling */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 20px',
                    backgroundColor: colors.softGreen,
                    borderRadius: '24px',
                    border: `1px solid ${colors.evergreen}15`
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: colors.evergreen
                    }} />
                    <p style={{
                      fontSize: '16px',
                      color: colors.evergreen,
                      lineHeight: 1,
                      letterSpacing: '0.02em',
                      fontWeight: '500',
                      margin: 0
                    }}>
                      Business Made Simple
                    </p>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: colors.evergreen
                    }} />
                  </div>
                </div>

                {/* Main Input Box */}
                <div style={{
                  width: '100%',
                  position: 'relative',
                  marginBottom: '32px'
                }}>
                  <motion.div 
                    style={{
                      backgroundColor: colors.white,
                      border: `1.5px solid ${isFocused ? colors.evergreen : '#E2E8F0'}`,
                      borderRadius: '16px',
                      padding: '18px 20px',
                      transition: 'all 200ms ease-out',
                      boxShadow: isFocused ? '0 0 0 3px rgba(47, 82, 51, 0.08)' : 'none'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '16px'
                    }}>
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit()
                          }
                        }}
                        placeholder="Ask me anything..."
                        style={{
                          flex: 1,
                          resize: 'none',
                          border: 'none',
                          outline: 'none',
                          fontSize: '16px',
                          lineHeight: 1.5,
                          color: colors.charcoal,
                          backgroundColor: 'transparent',
                          minHeight: '24px',
                          maxHeight: '120px',
                          fontFamily: 'inherit'
                        }}
                        rows={1}
                      />
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <motion.button
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 200ms ease'
                          }}
                          whileHover={{ backgroundColor: '#F7F8FA' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Paperclip size={18} color='#9CA3AF' />
                        </motion.button>
                        <motion.button
                          onClick={() => handleSubmit()}
                          disabled={!inputValue.trim()}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: inputValue.trim() ? colors.evergreen : '#E2E8F0',
                            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 200ms ease'
                          }}
                          whileHover={inputValue.trim() ? { scale: 1.05, backgroundColor: '#245229' } : {}}
                          whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
                        >
                          <Send size={16} color={inputValue.trim() ? colors.white : '#9CA3AF'} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Suggested Questions */}
                <div style={{
                  width: '100%'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#9CA3AF',
                    marginBottom: '20px',
                    textAlign: 'center',
                    letterSpacing: '0.02em'
                  }}>
                    Try asking about:
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {prompts.map((prompt, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          padding: '14px 24px',
                          backgroundColor: colors.white,
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '15px',
                          fontWeight: '400',
                          color: '#374151',
                          transition: 'all 200ms ease-out',
                          maxWidth: '440px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
                        }}
                        whileHover={{ 
                          backgroundColor: '#FAFAFA',
                          borderColor: colors.evergreen + '40',
                          scale: 1.005,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                        }}
                        onClick={() => handleSubmit(prompt)}
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Thinking State */}
            {currentState === 'thinking' && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  maxWidth: '600px',
                  margin: '0 auto',
                  width: '100%'
                }}
              >
                <div style={{
                  width: '100%',
                  backgroundColor: colors.white,
                  borderRadius: '20px',
                  padding: '40px',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '40px'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: colors.charcoal,
                      marginBottom: '12px'
                    }}>
                      Processing your request
                    </div>
                    <div style={{
                      fontSize: '15px',
                      color: '#6B7280',
                      fontStyle: 'italic'
                    }}>
                      "{selectedPrompt}"
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    {thinkingSteps.map((step, index) => {
                      const Icon = step.icon
                      const isActive = index === currentStep
                      const isCompleted = completedSteps.includes(index)
                      const isPending = index > currentStep
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ 
                            opacity: isPending ? 0.3 : 1, 
                            x: 0 
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            backgroundColor: isActive ? colors.softGreen + '50' : 'transparent'
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            backgroundColor: isCompleted ? colors.mint : 
                                          isActive ? colors.softGreen : 
                                          '#F3F4F6'
                          }}>
                            {isCompleted ? (
                              <Check size={16} color={colors.evergreen} strokeWidth={3} />
                            ) : isActive ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              >
                                <Loader2 size={16} color={colors.evergreen} />
                              </motion.div>
                            ) : (
                              <Icon size={16} color={colors.lightGray} />
                            )}
                          </div>
                          <span style={{
                            fontSize: '14px',
                            color: isCompleted ? colors.evergreen : 
                                   isActive ? colors.charcoal : 
                                   colors.mediumGray,
                            flex: 1
                          }}>
                            {isActive && typingStep ? typingStep : step.text}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Answer State */}
            {currentState === 'answer' && (
              <motion.div
                key="answer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '24px',
                  maxWidth: '720px',
                  margin: '0 auto',
                  width: '100%',
                  overflowY: 'auto'
                }}
              >
                {/* Question */}
                <div style={{
                  marginBottom: '24px',
                  padding: '16px 20px',
                  backgroundColor: colors.mint,
                  borderRadius: '12px',
                  border: `1px solid ${colors.evergreen}20`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: colors.evergreen,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.white,
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {userInitials}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: colors.charcoal
                    }}>
                      {selectedPrompt}
                    </div>
                  </div>
                </div>

                {/* Answer */}
                <div style={{
                  marginBottom: '24px',
                  padding: '24px',
                  backgroundColor: colors.white,
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: colors.mint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Sparkles size={20} color={colors.evergreen} />
                    </div>
                    <div style={{
                      flex: 1,
                      fontSize: '15px',
                      lineHeight: 1.7,
                      color: colors.charcoal
                    }}>
                      {formatText(streamedText)}
                    </div>
                  </div>
                </div>

                {/* Email Action Buttons */}
                {showEmailActions && emailDraft && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '12px',
                      marginBottom: '24px'
                    }}
                  >
                    <motion.button
                      onClick={() => handleEmailAction('send')}
                      style={{
                        padding: '14px 28px',
                        backgroundColor: colors.evergreen,
                        color: colors.white,
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Check size={16} />
                      Send Email
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleEmailAction('edit')}
                      style={{
                        padding: '14px 28px',
                        backgroundColor: colors.white,
                        color: colors.charcoal,
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                      whileHover={{ 
                        backgroundColor: colors.mint,
                        borderColor: colors.evergreen + '30'
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit Draft
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleEmailAction('cancel')}
                      style={{
                        padding: '14px 28px',
                        backgroundColor: colors.white,
                        color: colors.mediumGray,
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                      whileHover={{ 
                        backgroundColor: '#FEF2F2',
                        borderColor: '#FCA5A5'
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                  </motion.div>
                )}

                {/* Follow-ups */}
                {showFollowups && !showEmailActions && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginBottom: '24px'
                    }}
                  >
                    <p style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '16px'
                    }}>
                      Suggested follow-ups
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {followupSuggestions.map((followup, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          style={{
                            padding: '12px 20px',
                            backgroundColor: colors.white,
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#4B5563',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                          }}
                          whileHover={{ 
                            backgroundColor: colors.mint,
                            borderColor: colors.evergreen + '30'
                          }}
                          onClick={() => handleSubmit(followup)}
                        >
                          {followup}
                          <ChevronRight size={14} />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  marginTop: '20px'
                }}>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      resetToWelcome()
                    }}
                    style={{
                      padding: '14px 28px',
                      backgroundColor: colors.evergreen,
                      color: colors.white,
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ← Ask Another Question
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* EverChat floating widget */}
        <ChatWidget />
      </div>
    </div>
  )
}