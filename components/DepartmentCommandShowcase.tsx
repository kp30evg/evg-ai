'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, DollarSign, Users, Package, Brain, Truck,
  Target, AlertCircle, HelpCircle, Clock, Building2,
  CreditCard, CheckCircle, FileText, Check, ChevronRight,
  Sparkles, BarChart3, ArrowUpRight, ArrowDownRight,
  Loader2, Shield, Database, Activity, Zap, Send,
  Paperclip, Mic
} from 'lucide-react'

type State = 'welcome' | 'thinking' | 'answer'

interface DepartmentData {
  id: string
  name: string
  icon: any
  category: string
  questions: { text: string; icon: any }[]
  actions: { text: string; icon: any }[]
  streamingAnswer: string
  metrics: { label: string; value: string; trend: number; positive: boolean; detail: string }[]
}

// Style constants matching HeroSection-CommandInterface
const colors = {
  evergreen: '#1D5238',
  white: '#FFFFFF',
  charcoal: '#222B2E',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  softGreen: '#E6F4EC',
  gold: '#FFD600'
}

const DEPARTMENTS: DepartmentData[] = [
  {
    id: 'revenue',
    name: 'Revenue Operations',
    icon: TrendingUp,
    category: 'Revenue Operations',
    questions: [
      { text: "Which customers are about to churn and why?", icon: AlertCircle },
      { text: "Why did we lose our last 10 deals?", icon: HelpCircle },
      { text: "What's our true CAC including hidden costs?", icon: DollarSign }
    ],
    actions: [
      { text: "Clone our best customer profile and find 50 prospects", icon: Users },
      { text: "Pause campaigns for customers with support tickets", icon: AlertCircle },
      { text: "Create save plans for all at-risk deals", icon: CheckCircle }
    ],
    streamingAnswer: "I've identified **12 high-risk accounts** with an 87% churn probability, representing **$2.4M in ARR** (18% of total revenue). The primary indicators are a 40% usage decline, 3+ critical support tickets, and delayed payments. The top 3 accounts need immediate intervention within 14 days. I've prepared a retention strategy with a 70% save probability that includes executive business reviews and custom success plans.",
    metrics: [
      { label: 'At Risk ARR', value: '$2.4M', trend: 23, positive: false, detail: 'vs last month' },
      { label: 'Churn Probability', value: '87%', trend: 15, positive: false, detail: 'Critical level' },
      { label: 'Save Rate', value: '70%', trend: 5, positive: true, detail: 'If acted on' }
    ]
  },
  {
    id: 'finance',
    name: 'Financial Operations',
    icon: DollarSign,
    category: 'Financial Operations',
    questions: [
      { text: "Which invoices will actually get paid this week?", icon: CreditCard },
      { text: "What subscriptions have <10% utilization?", icon: BarChart3 },
      { text: "Where did margin leak this month?", icon: TrendingUp }
    ],
    actions: [
      { text: "Close the books for this month", icon: FileText },
      { text: "Cut all unused software licenses immediately", icon: CheckCircle },
      { text: "Launch collections for past-due invoices", icon: CreditCard }
    ],
    streamingAnswer: "High confidence payments coming this week: **23 invoices worth $847K** (90%+ probability). Medium confidence: 8 invoices worth $234K. Low confidence: 5 invoices worth $127K. Based on payment history and customer health signals, I recommend prioritized collection actions starting with the largest at-risk accounts. Expected total collections: **$964K** representing 78% of outstanding receivables.",
    metrics: [
      { label: 'Expected Collections', value: '$964K', trend: 12, positive: true, detail: 'This week' },
      { label: 'At Risk', value: '$244K', trend: 8, positive: false, detail: 'Follow up needed' },
      { label: 'DSO Impact', value: '42 days', trend: -3, positive: true, detail: 'If collected' }
    ]
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: Package,
    category: 'Operations',
    questions: [
      { text: "Which suppliers consistently deliver late?", icon: Truck },
      { text: "What inventory can we liquidate safely?", icon: Package },
      { text: "Where will we stock out next week?", icon: AlertCircle }
    ],
    actions: [
      { text: "Predict and prevent stockouts for 30 days", icon: Target },
      { text: "Consolidate vendors by 30%", icon: Building2 },
      { text: "Reroute shipments to avoid port strike", icon: Truck }
    ],
    streamingAnswer: "Five suppliers show **>30% late delivery rates**, causing $340K in monthly expedite fees and 127 production delays. Worst performer: Acme Corp at 47% late, costing $89K/month alone. I've identified pre-qualified alternative suppliers with better track records. Implementing penalty clauses and switching critical components could save **$2.1M annually** while improving on-time delivery to 95%.",
    metrics: [
      { label: 'Cost Impact', value: '$340K/mo', trend: 23, positive: false, detail: 'Expedite fees' },
      { label: 'Delays', value: '127', trend: 34, positive: false, detail: 'Production impact' },
      { label: 'Savings Potential', value: '$2.1M/yr', trend: 100, positive: true, detail: 'If optimized' }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: Target,
    category: 'Marketing',
    questions: [
      { text: "Which channels create profitable customers?", icon: DollarSign },
      { text: "Who will convert in the next 7 days?", icon: Users },
      { text: "What content moves pipeline this week?", icon: FileText }
    ],
    actions: [
      { text: "Reallocate spend to high-LTV segments", icon: Target },
      { text: "Launch sequences for 7-day converters", icon: Clock },
      { text: "Generate content from win/loss themes", icon: FileText }
    ],
    streamingAnswer: "Channel profitability analysis complete: **Organic search** leads with 4.2x LTV/CAC ratio (34% of revenue). **Partner referrals** show untapped potential at 6.7x LTV/CAC. Meanwhile, **paid social** is losing money with only 1.8x LTV/CAC. I recommend immediately shifting $127K from paid social to partner programs, which could generate an additional **$2.4M in profitable revenue** this quarter.",
    metrics: [
      { label: 'Best Channel', value: 'Partners', trend: 67, positive: true, detail: '6.7x LTV/CAC' },
      { label: 'Worst Channel', value: 'Paid Social', trend: -45, positive: false, detail: 'Losing money' },
      { label: 'Opportunity', value: '$2.4M', trend: 100, positive: true, detail: 'Shift budget' }
    ]
  },
  {
    id: 'human-capital',
    name: 'Human Capital',
    icon: Users,
    category: 'Human Capital',
    questions: [
      { text: "Who's about to quit based on patterns?", icon: AlertCircle },
      { text: "Where are our pay equity gaps?", icon: BarChart3 },
      { text: "Where will we miss capacity in 30 days?", icon: Clock }
    ],
    actions: [
      { text: "Design optimal team for Project X", icon: Users },
      { text: "Fix all pay equity gaps immediately", icon: CheckCircle },
      { text: "Create retention plan for key employees", icon: Target }
    ],
    streamingAnswer: "I've identified **8 high-risk employees** showing quit patterns (6 senior, 2 critical roles). Behavioral signals include 40% email activity decline and no 1:1s scheduled. Estimated replacement cost: **$890K plus 6 months productivity loss**. The top 3 are in critical roles with no succession plan. You have a 2-week intervention window. I recommend immediate skip-levels, retention packages, and fast-tracked promotions.",
    metrics: [
      { label: 'At Risk', value: '8 people', trend: 60, positive: false, detail: '3 critical roles' },
      { label: 'Replacement Cost', value: '$890K', trend: 100, positive: false, detail: 'Direct costs only' },
      { label: 'Time to Act', value: '14 days', trend: -50, positive: false, detail: 'Urgent window' }
    ]
  },
  {
    id: 'intelligence',
    name: 'Business Intelligence',
    icon: Brain,
    category: 'Business Intelligence',
    questions: [
      { text: "What's driving our margin decline?", icon: TrendingUp },
      { text: "Which business unit is secretly unprofitable?", icon: AlertCircle },
      { text: "What correlations would we never check?", icon: HelpCircle }
    ],
    actions: [
      { text: "Simulate 15% price increase impact", icon: BarChart3 },
      { text: "Kill all negative ROI projects", icon: CheckCircle },
      { text: "Find $2M in budget without layoffs", icon: DollarSign }
    ],
    streamingAnswer: "Margin decline analysis reveals **shipping costs up 34%** from expedited orders as the primary driver. Secondary factor: discount creep from 12% to 18% average. Hidden factor: **$240K/month** supporting legacy features with <5% usage. Total margin impact: -4.2% or $1.7M quarterly. Good news: 2.8% is immediately fixable through dynamic pricing, shipment consolidation, and sunsetting legacy features - **$1.1M recovery possible**.",
    metrics: [
      { label: 'Margin Impact', value: '-4.2%', trend: -42, positive: false, detail: '$1.7M quarterly' },
      { label: 'Fixable Portion', value: '2.8%', trend: 100, positive: true, detail: '$1.1M recovery' },
      { label: 'Implementation', value: '30 days', trend: 0, positive: true, detail: 'Quick wins' }
    ]
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    icon: Truck,
    category: 'Supply Chain',
    questions: [
      { text: "Where are the hidden bottlenecks?", icon: AlertCircle },
      { text: "What's our true landed cost per SKU?", icon: DollarSign },
      { text: "What inventory is obsolete?", icon: Package }
    ],
    actions: [
      { text: "Optimize routes to cut transport 20%", icon: Truck },
      { text: "Switch to regional suppliers for fast-movers", icon: Building2 },
      { text: "Set up automated reorder points", icon: Target }
    ],
    streamingAnswer: "Critical bottleneck found: **QC station at 60% capacity** causing throughput loss of $890K/month. Secondary issue: dock scheduling creating 4-hour truck waits ($47K/month in detention fees). Hidden problem: ERP batch processing delays orders by 18 hours average. Quick wins available: warehouse layout optimization could reduce travel time by 23%, and automated approvals would eliminate 2-day delays.",
    metrics: [
      { label: 'Throughput Loss', value: '40%', trend: 15, positive: false, detail: '$890K/month' },
      { label: 'Truck Detention', value: '$47K/mo', trend: 127, positive: false, detail: 'Growing fast' },
      { label: 'Order Delays', value: '18 hrs', trend: 30, positive: false, detail: 'Average delay' }
    ]
  }
]

const thinkingSteps = [
  { text: "Accessing department data", icon: Database },
  { text: "Analyzing patterns", icon: Brain },
  { text: "Processing metrics", icon: Activity },
  { text: "Applying security filters", icon: Shield },
  { text: "Generating insights", icon: Sparkles }
]

export default function DepartmentCommandShowcase() {
  const [activeDepartment, setActiveDepartment] = useState<DepartmentData>(DEPARTMENTS[0])
  const [currentState, setCurrentState] = useState<State>('welcome')
  const [inputValue, setInputValue] = useState('')
  const [selectedCommand, setSelectedCommand] = useState('')
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [typingStep, setTypingStep] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [showComponents, setShowComponents] = useState(false)
  const [showFollowups, setShowFollowups] = useState(false)
  const [visibleComponents, setVisibleComponents] = useState<number[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const followupCommands = [
    "Drill deeper into this",
    "Show me the trends",
    "What are my options?"
  ]

  const handleSubmit = (text?: string) => {
    const commandText = text || inputValue
    if (!commandText.trim()) return
    
    setSelectedCommand(commandText)
    setInputValue('')
    setCurrentState('thinking')
    resetAnimationStates()
    startThinkingSequence()
  }

  const handleCommandClick = (command: string) => {
    handleSubmit(command)
  }

  const resetAnimationStates = () => {
    setCompletedSteps([])
    setCurrentStep(0)
    setTypingStep('')
    setStreamedText('')
    setShowComponents(false)
    setShowFollowups(false)
    setVisibleComponents([])
  }

  const startThinkingSequence = () => {
    let stepIndex = 0
    
    const processStep = () => {
      if (stepIndex >= thinkingSteps.length) {
        setTimeout(() => {
          setCurrentState('answer')
          startStreamingText()
        }, 500)
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

  const startStreamingText = () => {
    const fullText = activeDepartment.streamingAnswer
    let index = 0
    const streamInterval = setInterval(() => {
      if (index >= fullText.length) {
        clearInterval(streamInterval)
        setTimeout(() => {
          setShowComponents(true)
          animateComponents()
        }, 300)
        return
      }
      setStreamedText(fullText.slice(0, index + 1))
      index += 3 // Speed of streaming
    }, 10)
  }

  const animateComponents = () => {
    activeDepartment.metrics.forEach((_, index) => {
      setTimeout(() => {
        setVisibleComponents(prev => [...prev, index])
      }, index * 100)
    })
    
    setTimeout(() => {
      setShowFollowups(true)
    }, activeDepartment.metrics.length * 100 + 300)
  }

  const resetToWelcome = () => {
    setCurrentState('welcome')
    setInputValue('')
    setSelectedCommand('')
    setCompletedSteps([])
    setCurrentStep(0)
    setTypingStep('')
    setStreamedText('')
    setShowComponents(false)
    setShowFollowups(false)
    setVisibleComponents([])
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

  // Reset when department changes
  useEffect(() => {
    resetToWelcome()
  }, [activeDepartment])

  const styles = {
    container: {
      position: 'relative' as const,
      minHeight: '480px',
      height: '480px',
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
      padding: '24px',
      display: 'flex',
      flexDirection: 'column' as const
    },
    welcomeContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const
    },
    welcomeHeader: {
      marginBottom: '20px',
      textAlign: 'center' as const
    },
    welcomeTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: colors.charcoal,
      marginBottom: '6px',
      letterSpacing: '-0.02em'
    },
    welcomeSubtitle: {
      fontSize: '14px',
      color: colors.mediumGray,
      lineHeight: 1.6
    },
    inputBoxContainer: {
      marginBottom: '20px'
    },
    inputBox: {
      position: 'relative' as const,
      backgroundColor: colors.white,
      border: `2px solid ${colors.lightGray}60`,
      borderRadius: '16px',
      padding: '12px',
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
    commandsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px',
      marginTop: 'auto'
    },
    commandSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    sectionLabel: {
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      color: colors.mediumGray,
      letterSpacing: '0.5px',
      marginBottom: '4px'
    },
    commandButton: {
      padding: '10px 12px',
      backgroundColor: colors.white,
      borderRadius: '10px',
      border: `1px solid ${colors.lightGray}60`,
      cursor: 'pointer',
      transition: 'all 200ms ease-out',
      textAlign: 'left' as const,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    commandText: {
      fontSize: '13px',
      fontWeight: '500',
      color: colors.charcoal,
      flex: 1
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      marginBottom: '28px'
    },
    statCard: {
      padding: '20px',
      backgroundColor: '#FAFBFC',
      borderRadius: '12px',
      border: `1px solid ${colors.lightGray}40`,
      transition: 'all 200ms ease-out'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: colors.charcoal,
      letterSpacing: '-0.02em',
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: '12px',
      color: colors.mediumGray,
      fontWeight: '500',
      marginBottom: '8px'
    },
    statTrend: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500'
    },
    statDetail: {
      fontSize: '11px',
      color: colors.mediumGray,
      marginTop: '4px'
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
    <section style={{ 
      padding: '60px 24px 40px',
      backgroundColor: colors.white,
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: '600',
              color: colors.charcoal,
              letterSpacing: '-0.02em',
              marginBottom: '12px',
              lineHeight: 1.1
            }}
          >
            One Platform. <span style={{ color: colors.evergreen }}>Every Department.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
              color: colors.mediumGray,
              fontWeight: '400',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: 1.5
            }}
          >
            See how natural language commands transform every area of your business
          </motion.p>
        </div>

        {/* Department Tabs */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'nowrap',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px',
          overflowX: 'auto',
          scrollbarWidth: 'none' as any,
          msOverflowStyle: 'none' as any,
          WebkitScrollbar: { display: 'none' }
        }}>
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon
            const isActive = activeDepartment.id === dept.id
            return (
              <motion.button
                key={dept.id}
                onClick={() => setActiveDepartment(dept)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${isActive ? colors.evergreen : colors.lightGray}`,
                  backgroundColor: isActive ? colors.evergreen : colors.white,
                  color: isActive ? colors.white : colors.mediumGray,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap' as const,
                  flexShrink: 0
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={14} />
                <span>{dept.name}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Main Chat Interface Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: colors.white,
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${colors.lightGray}50`
          }}
        >
          {/* Department Header */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <motion.div 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: colors.softGreen,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                whileHover={{ scale: 1.05 }}
              >
                {(() => {
                  const Icon = activeDepartment.icon
                  return <Icon size={24} color={colors.evergreen} />
                })()}
              </motion.div>
              <div>
                <div style={{ 
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: colors.evergreen
                }}>
                  evergreenOS™
                </div>
                <div style={{ 
                  fontSize: '14px',
                  color: colors.mediumGray
                }}>
                  {activeDepartment.name}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <motion.div 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981'
                  }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span style={{ fontSize: '12px', color: colors.evergreen, fontWeight: '500' }}>
                Connected
              </span>
            </div>
          </div>

          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '32px',
              padding: '20px',
              backgroundColor: colors.softGreen,
              borderRadius: '12px',
              border: `1px solid ${colors.evergreen}20`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <Brain size={20} color={colors.evergreen} style={{ marginTop: '2px' }} />
              <div>
                <p style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.evergreen,
                  marginBottom: '4px'
                }}>
                  Welcome to {activeDepartment.name}
                </p>
                <p style={{ 
                  fontSize: '13px',
                  color: colors.mediumGray,
                  lineHeight: 1.5
                }}>
                  Ask questions about your {activeDepartment.category.toLowerCase()} or request actions. 
                  I'll analyze your data and execute commands across your entire business.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Command Interface */}
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
                    {/* THE BOX - Input area */}
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
                            placeholder={`Ask about ${activeDepartment.name.toLowerCase()}...`}
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

                    {/* Sample Commands - 3 questions, 3 actions */}
                    <div style={styles.commandsGrid}>
                      {/* Questions Section */}
                      <div style={styles.commandSection}>
                        <p style={styles.sectionLabel}>Sample Questions</p>
                        {activeDepartment.questions.map((cmd, idx) => {
                          const Icon = cmd.icon
                          return (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              style={styles.commandButton}
                              whileHover={{ 
                                backgroundColor: colors.softGreen,
                                borderColor: `${colors.evergreen}30`,
                                x: 2
                              }}
                              onClick={() => handleCommandClick(cmd.text)}
                            >
                              <Icon size={16} color={colors.evergreen} />
                              <span style={styles.commandText}>{cmd.text}</span>
                            </motion.button>
                          )
                        })}
                      </div>

                      {/* Actions Section */}
                      <div style={styles.commandSection}>
                        <p style={styles.sectionLabel}>Sample Actions</p>
                        {activeDepartment.actions.map((cmd, idx) => {
                          const Icon = cmd.icon
                          return (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              style={styles.commandButton}
                              whileHover={{ 
                                backgroundColor: colors.softGreen,
                                borderColor: `${colors.evergreen}30`,
                                x: 2
                              }}
                              onClick={() => handleCommandClick(cmd.text)}
                            >
                              <Icon size={16} color={colors.evergreen} />
                              <span style={styles.commandText}>{cmd.text}</span>
                            </motion.button>
                          )
                        })}
                      </div>
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
                      <div style={styles.thinkingPrompt}>{selectedCommand}</div>
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
                        <h3 style={styles.answerTitle}>Analysis Complete</h3>
                      </div>
                      <motion.button
                        type="button"
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
                          transition: 'all 200ms ease-out'
                        }}
                        whileHover={{ 
                          backgroundColor: colors.softGreen,
                          borderColor: `${colors.evergreen}30`
                        }}
                        whileTap={{ scale: 0.95 }}
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
                      {streamedText.length < activeDepartment.streamingAnswer.length && (
                        <span style={styles.cursor} />
                      )}
                    </motion.div>

                    {/* Metrics Cards */}
                    {showComponents && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        style={styles.statsGrid}
                      >
                        {activeDepartment.metrics.map((stat, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                              opacity: visibleComponents.includes(index) ? 1 : 0,
                              y: visibleComponents.includes(index) ? 0 : 20
                            }}
                            transition={{ 
                              duration: 0.3,
                              ease: 'cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            style={styles.statCard}
                            whileHover={{ 
                              y: -4,
                              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)'
                            }}
                          >
                            <div style={styles.statValue}>{stat.value}</div>
                            <div style={styles.statLabel}>{stat.label}</div>
                            <div style={{
                              ...styles.statTrend,
                              backgroundColor: stat.positive ? `${colors.evergreen}10` : '#FEE2E2',
                              color: stat.positive ? colors.evergreen : '#EF4444'
                            }}>
                              {stat.positive ? (
                                <ArrowUpRight size={12} />
                              ) : (
                                <ArrowDownRight size={12} />
                              )}
                              {Math.abs(stat.trend)}%
                            </div>
                            <div style={styles.statDetail}>{stat.detail}</div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {/* Suggested Follow-ups */}
                    {showFollowups && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={styles.followupsContainer}
                      >
                        <p style={styles.followupsTitle}>Suggested Follow-ups</p>
                        <div style={styles.followupsGrid}>
                          {followupCommands.map((followup, index) => (
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
        </motion.div>
      </div>
    </section>
  )
}