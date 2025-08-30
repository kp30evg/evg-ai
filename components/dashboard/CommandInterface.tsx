'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  Activity,
  Check,
  ChevronRight,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Shield,
  Database,
  Brain,
  Zap,
  Send,
  Paperclip,
  Mic
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

type State = 'welcome' | 'thinking' | 'answer'

export default function CommandInterface() {
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
  const containerRef = useRef<HTMLDivElement>(null)

  const executeMutation = trpc.command.execute.useMutation()

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
      subtitle: "Financial analysis"
    },
    { 
      text: "Show revenue by customer segment", 
      subtitle: "Business intelligence"
    },
    { 
      text: "Who are our top 10 customers?", 
      subtitle: "Customer insights"
    },
    { 
      text: "Optimize inventory for Q4", 
      subtitle: "Operations planning"
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
      const result = await executeMutation.mutateAsync({
        input: commandText
      })

      // After thinking animation completes, show the answer
      setTimeout(() => {
        setCurrentState('answer')
        startStreamingText(result.message)
        setFollowupSuggestions(result.suggestions || [])
      }, 2500)
    } catch (error) {
      console.error('Error executing command:', error)
      setTimeout(() => {
        setCurrentState('answer')
        startStreamingText('I encountered an error processing your request. Please try again.')
      }, 1000)
    }
  }

  const handlePromptClick = (prompt: string) => {
    handleSubmit(prompt)
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
      if (stepIndex >= thinkingSteps.length) {
        return
      }

      setCurrentStep(stepIndex)
      
      // Type out the step text
      const stepText = thinkingSteps[stepIndex].text
      let charIndex = 0
      
      const typeInterval = setInterval(() => {
        if (charIndex <= stepText.length) {
          setTypingStep(stepText.slice(0, charIndex))
          charIndex++
        } else {
          clearInterval(typeInterval)
          
          // After typing completes, mark as completed and move to next
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
        setTimeout(() => {
          setShowFollowups(true)
        }, 300)
        return
      }
      setStreamedText(text.slice(0, index + 1))
      index += 3 // Speed of streaming
    }, 10)
  }

  const resetToWelcome = () => {
    setCurrentState('welcome')
    setInputValue('')
    setSelectedPrompt('')
    setCompletedSteps([])
    setCurrentStep(0)
    setTypingStep('')
    setStreamedText('')
    setShowFollowups(false)
    setFollowupSuggestions([])
    setIsFocused(false)
  }

  // Format text with markdown-style bold
  const formatText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, index) => 
      index % 2 === 1 ? (
        <strong key={index} style={{ color: colors.evergreen, fontWeight: 600 }}>
          {part}
        </strong>
      ) : (
        <span key={index}>{part}</span>
      )
    )
  }

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
    }
  }, [inputValue])

  const styles = {
    container: {
      position: 'relative' as const,
      minHeight: '600px',
      height: '600px',
      backgroundColor: colors.white,
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${colors.lightGray}40`,
      display: 'flex',
      flexDirection: 'column' as const
    },
    stateContainer: {
      position: 'absolute' as const,
      inset: 0,
      padding: '32px',
      display: 'flex',
      flexDirection: 'column' as const
    },
    welcomeContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const
    },
    welcomeHeader: {
      marginBottom: '24px',
      textAlign: 'center' as const
    },
    welcomeTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: colors.charcoal,
      marginBottom: '8px',
      letterSpacing: '-0.02em'
    },
    welcomeSubtitle: {
      fontSize: '14px',
      color: colors.mediumGray,
      lineHeight: 1.6
    },
    inputBoxContainer: {
      marginBottom: '24px'
    },
    inputBox: {
      position: 'relative' as const,
      backgroundColor: colors.white,
      border: `2px solid ${colors.lightGray}60`,
      borderRadius: '16px',
      padding: '16px',
      transition: 'all 200ms ease-out',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
    },
    inputBoxFocused: {
      borderColor: colors.evergreen,
      boxShadow: '0 4px 16px rgba(29, 82, 56, 0.1)'
    },
    inputWrapper: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '12px'
    },
    textArea: {
      flex: 1,
      resize: 'none' as const,
      border: 'none',
      outline: 'none',
      fontSize: '15px',
      lineHeight: 1.6,
      color: colors.charcoal,
      backgroundColor: 'transparent',
      minHeight: '24px',
      maxHeight: '120px',
      fontFamily: 'inherit',
      padding: 0
    },
    inputActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    iconButton: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 200ms ease-out'
    },
    sendButton: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: colors.evergreen,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 200ms ease-out'
    },
    sendButtonDisabled: {
      backgroundColor: colors.lightGray,
      cursor: 'not-allowed'
    },
    promptsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
      marginTop: 'auto'
    },
    promptButton: {
      padding: '12px 16px',
      backgroundColor: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.lightGray}60`,
      cursor: 'pointer',
      transition: 'all 200ms ease-out',
      textAlign: 'left' as const
    },
    promptText: {
      fontSize: '13px',
      fontWeight: '500',
      color: colors.charcoal,
      marginBottom: '2px'
    },
    promptSubtext: {
      fontSize: '11px',
      color: colors.mediumGray
    },
    thinkingContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center'
    },
    thinkingHeader: {
      marginBottom: '32px',
      textAlign: 'center' as const
    },
    thinkingTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.charcoal,
      marginBottom: '8px'
    },
    thinkingPrompt: {
      fontSize: '14px',
      color: colors.mediumGray
    },
    stepsContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px'
    },
    stepRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px 16px',
      borderRadius: '10px',
      backgroundColor: 'transparent',
      transition: 'all 200ms ease-out'
    },
    stepIcon: {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      transition: 'all 200ms ease-out'
    },
    stepText: {
      fontSize: '14px',
      color: colors.charcoal,
      flex: 1
    },
    answerContent: {
      flex: 1,
      overflowY: 'auto' as const,
      paddingRight: '8px',
      scrollbarWidth: 'thin' as const,
      scrollbarColor: `${colors.lightGray}50 transparent`
    },
    answerHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px'
    },
    answerIconBox: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      backgroundColor: `${colors.evergreen}10`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    answerTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: colors.charcoal,
      letterSpacing: '-0.01em'
    },
    answerText: {
      fontSize: '15px',
      color: colors.charcoal,
      lineHeight: 1.8,
      marginBottom: '28px'
    },
    followupsContainer: {
      paddingTop: '24px',
      borderTop: `1px solid ${colors.lightGray}40`,
      marginTop: 'auto'
    },
    followupsTitle: {
      fontSize: '12px',
      fontWeight: '600',
      color: colors.mediumGray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '12px'
    },
    followupsGrid: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const
    },
    followupButton: {
      padding: '10px 16px',
      backgroundColor: colors.white,
      border: `1px solid ${colors.lightGray}60`,
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
      color: colors.charcoal,
      cursor: 'pointer',
      transition: 'all 200ms ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    cursor: {
      display: 'inline-block',
      width: '2px',
      height: '18px',
      backgroundColor: colors.charcoal,
      marginLeft: '1px',
      animation: 'blink 1s infinite'
    }
  }

  return (
    <div ref={containerRef} style={styles.container}>
      <AnimatePresence mode="wait">
        {/* Welcome State */}
        {currentState === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={styles.stateContainer}
          >
            <div style={styles.welcomeContainer}>
              <div style={styles.welcomeHeader}>
                <h3 style={styles.welcomeTitle}>Welcome to evergreenOS</h3>
                <p style={styles.welcomeSubtitle}>
                  Ask anything about your business. I'll analyze your data and execute actions instantly.
                </p>
              </div>

              {/* THE BOX - Input area like ChatGPT/Perplexity */}
              <div style={styles.inputBoxContainer}>
                <motion.div 
                  style={{
                    ...styles.inputBox,
                    ...(isFocused ? styles.inputBoxFocused : {})
                  }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={styles.inputWrapper}>
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
                      placeholder="Ask anything..."
                      style={styles.textArea}
                      rows={1}
                    />
                    <div style={styles.inputActions}>
                      <motion.button
                        style={styles.iconButton}
                        whileHover={{ backgroundColor: colors.softGreen }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Paperclip size={18} color={colors.mediumGray} />
                      </motion.button>
                      <motion.button
                        style={styles.iconButton}
                        whileHover={{ backgroundColor: colors.softGreen }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Mic size={18} color={colors.mediumGray} />
                      </motion.button>
                      <motion.button
                        onClick={() => handleSubmit()}
                        disabled={!inputValue.trim()}
                        style={{
                          ...styles.sendButton,
                          ...(inputValue.trim() ? {} : styles.sendButtonDisabled)
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

              {/* Sample prompts */}
              <div style={styles.promptsGrid}>
                {prompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={styles.promptButton}
                    whileHover={{ 
                      backgroundColor: colors.softGreen,
                      borderColor: `${colors.evergreen}30`,
                      x: 2
                    }}
                    onClick={() => handlePromptClick(prompt.text)}
                  >
                    <div style={styles.promptText}>{prompt.text}</div>
                    <div style={styles.promptSubtext}>{prompt.subtitle}</div>
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
            transition={{ duration: 0.3 }}
            style={styles.stateContainer}
          >
            <div style={styles.thinkingContainer}>
              <div style={styles.thinkingHeader}>
                <div style={styles.thinkingTitle}>Processing your request</div>
                <div style={styles.thinkingPrompt}>{selectedPrompt}</div>
              </div>

              <div style={styles.stepsContainer}>
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
                      transition={{ delay: index * 0.05 }}
                      style={{
                        ...styles.stepRow,
                        backgroundColor: isActive ? `${colors.softGreen}50` : 'transparent'
                      }}
                    >
                      <div style={{
                        ...styles.stepIcon,
                        backgroundColor: isCompleted ? `${colors.evergreen}15` : 
                                      isActive ? `${colors.softGreen}` : 
                                      `${colors.lightGray}20`
                      }}>
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            <Check size={16} color={colors.evergreen} strokeWidth={3} />
                          </motion.div>
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
                        ...styles.stepText,
                        color: isCompleted ? colors.evergreen : 
                               isActive ? colors.charcoal : 
                               colors.mediumGray
                      }}>
                        {isActive && typingStep ? (
                          <>
                            {typingStep}
                            <span style={styles.cursor} />
                          </>
                        ) : isCompleted ? (
                          `✓ ${step.text}`
                        ) : (
                          step.text
                        )}
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
            transition={{ duration: 0.3 }}
            style={styles.stateContainer}
          >
            <div style={styles.answerContent}>
              {/* Header with Back Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  ...styles.answerHeader,
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={styles.answerIconBox}>
                    <BarChart3 size={20} color={colors.evergreen} strokeWidth={2} />
                  </div>
                  <h3 style={styles.answerTitle}>AI Response</h3>
                </div>
                <motion.button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    resetToWelcome()
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.lightGray}60`,
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    cursor: 'pointer',
                    transition: 'all 200ms ease-out',
                    display: 'inline-block'
                  }}
                  whileHover={{ 
                    backgroundColor: colors.softGreen,
                    borderColor: `${colors.evergreen}30`
                  }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                >
                  ← New Question
                </motion.button>
              </motion.div>

              {/* Streaming Text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={styles.answerText}
              >
                {formatText(streamedText)}
                {streamedText.length > 0 && streamedText.length < 1000 && (
                  <span style={styles.cursor} />
                )}
              </motion.div>

              {/* Suggested Follow-ups */}
              {showFollowups && followupSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={styles.followupsContainer}
                >
                  <p style={styles.followupsTitle}>Suggested Follow-ups</p>
                  <div style={styles.followupsGrid}>
                    {followupSuggestions.map((followup, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        style={styles.followupButton}
                        whileHover={{ 
                          backgroundColor: colors.softGreen,
                          borderColor: `${colors.evergreen}30`,
                          x: 2
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
            </div>

            {/* Input Box at Bottom - Always visible in answer state */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: `1px solid ${colors.lightGray}40`
              }}
            >
              <div 
                style={{
                  ...styles.inputBox,
                  ...(isFocused ? styles.inputBoxFocused : {})
                }}
              >
                <div style={styles.inputWrapper}>
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
                    placeholder="Ask a follow-up question..."
                    style={styles.textArea}
                    rows={1}
                  />
                  <div style={styles.inputActions}>
                    <motion.button
                      style={styles.iconButton}
                      whileHover={{ backgroundColor: colors.softGreen }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Paperclip size={18} color={colors.mediumGray} />
                    </motion.button>
                    <motion.button
                      style={styles.iconButton}
                      whileHover={{ backgroundColor: colors.softGreen }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Mic size={18} color={colors.mediumGray} />
                    </motion.button>
                    <motion.button
                      onClick={() => handleSubmit()}
                      disabled={!inputValue.trim()}
                      style={{
                        ...styles.sendButton,
                        ...(inputValue.trim() ? {} : styles.sendButtonDisabled)
                      }}
                      whileHover={inputValue.trim() ? { scale: 1.1 } : {}}
                      whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
                    >
                      <Send size={16} color={colors.white} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}