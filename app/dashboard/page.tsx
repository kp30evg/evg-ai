'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser, UserButton, OrganizationSwitcher } from '@clerk/nextjs'
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

type State = 'welcome' | 'thinking' | 'answer'

export default function DashboardPage() {
  const { user } = useUser()
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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  }

  const prompts = [
    { 
      text: "What's our monthly burn rate?", 
      subtitle: "Financial analysis",
      icon: '💰'
    },
    { 
      text: "Show revenue by customer segment", 
      subtitle: "Business intelligence",
      icon: '📊'
    },
    { 
      text: "Who are our top 10 customers?", 
      subtitle: "Customer insights",
      icon: '👥'
    },
    { 
      text: "Optimize inventory for Q4", 
      subtitle: "Operations planning",
      icon: '📦'
    }
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
      // Call the OpenAI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: commandText }),
      });

      const data = await response.json();

      // After thinking animation completes, show the answer
      setTimeout(() => {
        setCurrentState('answer')
        startStreamingText(data.message || 'I couldn\'t generate a response.')
        setFollowupSuggestions(data.suggestions || followupSuggestions)
      }, 2500)
    } catch (error) {
      console.error('Error calling API:', error)
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

  const formatText = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, index) => {
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
    })
  }

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
      backgroundColor: '#FAFBFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}40`,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Menu size={20} color={colors.charcoal} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: colors.evergreen,
              letterSpacing: '-0.01em'
            }}>
              evergreenOS
            </div>
            <div style={{
              padding: '3px 8px',
              backgroundColor: colors.softGreen,
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: '600',
              color: colors.evergreen,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              AI Assistant
            </div>
          </div>
          
          {/* Organization Switcher */}
          <div style={{ marginLeft: '20px' }}>
            <OrganizationSwitcher 
              appearance={{
                elements: {
                  rootBox: {
                    display: 'flex',
                    alignItems: 'center'
                  },
                  organizationSwitcherTrigger: {
                    padding: '8px 12px',
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.lightGray}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    '&:hover': {
                      backgroundColor: colors.softGreen,
                      borderColor: colors.evergreen + '30'
                    }
                  },
                  organizationPreview: {
                    fontSize: '13px',
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
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: colors.evergreen,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Plus size={16} />
            New Chat
          </button>
          
          <button style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}>
            <History size={18} color={colors.mediumGray} />
          </button>
          
          <button 
            onClick={() => window.location.href = '/settings/organization'}
            style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}>
            <Settings size={18} color={colors.mediumGray} />
          </button>
          
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 56px)'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '260px',
          backgroundColor: colors.white,
          borderRight: `1px solid ${colors.lightGray}40`,
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            marginBottom: '24px'
          }}>
            <input
              type="text"
              placeholder="Search conversations..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                backgroundColor: '#F3F4F6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                position: 'relative'
              }}
            />
            <Search size={16} color={colors.mediumGray} style={{
              position: 'absolute',
              left: '28px',
              marginTop: '-26px'
            }} />
          </div>

          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: colors.mediumGray,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px'
          }}>
            Today
          </div>
          
          {['Revenue analysis Q3', 'Customer segmentation', 'Team productivity metrics'].map((item, i) => (
            <button key={i} style={{
              width: '100%',
              padding: '12px',
              backgroundColor: i === 0 ? colors.softGreen : 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              color: colors.charcoal,
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: '4px',
              transition: 'all 200ms ease-out'
            }}>
              {item}
            </button>
          ))}

          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: colors.mediumGray,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginTop: '24px',
            marginBottom: '12px'
          }}>
            Yesterday
          </div>
          
          {['Inventory optimization', 'Sales pipeline review', 'Marketing ROI analysis'].map((item, i) => (
            <button key={i} style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              color: colors.charcoal,
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: '4px',
              transition: 'all 200ms ease-out'
            }}>
              {item}
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
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
                  padding: '24px',
                  maxWidth: '720px',
                  margin: '0 auto',
                  width: '100%'
                }}
              >
                <div style={{
                  textAlign: 'center',
                  marginBottom: '48px'
                }}>
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: '600',
                    color: colors.charcoal,
                    marginBottom: '12px',
                    letterSpacing: '-0.02em'
                  }}>
                    How can I help you today{user?.firstName ? `, ${user.firstName}` : ''}?
                  </h1>
                  <p style={{
                    fontSize: '15px',
                    color: colors.mediumGray,
                    lineHeight: 1.6
                  }}>
                    Ask me anything about your business data, analytics, or operations
                  </p>
                </div>

                {/* Sample Prompts Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  width: '100%',
                  marginBottom: '32px'
                }}>
                  {prompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        padding: '16px',
                        backgroundColor: colors.white,
                        border: `1px solid ${colors.lightGray}60`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 200ms ease-out'
                      }}
                      whileHover={{ 
                        backgroundColor: colors.softGreen,
                        borderColor: colors.evergreen + '30',
                        scale: 1.02
                      }}
                      onClick={() => handleSubmit(prompt.text)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>{prompt.icon}</span>
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: colors.charcoal,
                            marginBottom: '4px'
                          }}>
                            {prompt.text}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: colors.mediumGray
                          }}>
                            {prompt.subtitle}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Input Box */}
                <div style={{
                  width: '100%',
                  position: 'relative'
                }}>
                  <motion.div 
                    style={{
                      backgroundColor: colors.white,
                      border: `2px solid ${isFocused ? colors.evergreen : colors.lightGray + '60'}`,
                      borderRadius: '16px',
                      padding: '16px',
                      transition: 'all 200ms ease-out',
                      boxShadow: isFocused ? '0 4px 16px rgba(29, 82, 56, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '12px'
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
                        placeholder="Message evergreenOS..."
                        style={{
                          flex: 1,
                          resize: 'none',
                          border: 'none',
                          outline: 'none',
                          fontSize: '15px',
                          lineHeight: 1.6,
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
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          whileHover={{ backgroundColor: colors.softGreen }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Paperclip size={18} color={colors.mediumGray} />
                        </motion.button>
                        <motion.button
                          onClick={() => handleSubmit()}
                          disabled={!inputValue.trim()}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: inputValue.trim() ? colors.evergreen : colors.lightGray,
                            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          whileHover={inputValue.trim() ? { scale: 1.1 } : {}}
                          whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
                        >
                          <Send size={16} color={colors.white} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
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
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colors.charcoal,
                      marginBottom: '8px'
                    }}>
                      Processing your request
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: colors.mediumGray
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
                            backgroundColor: isCompleted ? colors.evergreen + '15' : 
                                          isActive ? colors.softGreen : 
                                          colors.lightGray + '20'
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
                  padding: '16px',
                  backgroundColor: colors.softGreen + '30',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: colors.evergreen,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.white,
                      fontSize: '12px',
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
                  padding: '20px',
                  backgroundColor: colors.white,
                  borderRadius: '12px',
                  border: `1px solid ${colors.lightGray}40`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: colors.evergreen + '10',
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

                {/* Follow-ups */}
                {showFollowups && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginBottom: '24px'
                    }}
                  >
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.mediumGray,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '12px'
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
                            padding: '10px 16px',
                            backgroundColor: colors.white,
                            border: `1px solid ${colors.lightGray}60`,
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: colors.charcoal,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          whileHover={{ 
                            backgroundColor: colors.softGreen,
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

                {/* New Question Button */}
                <motion.button
                  onClick={resetToWelcome}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: colors.evergreen,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    alignSelf: 'center'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Ask Another Question
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}